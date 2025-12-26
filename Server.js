const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// --------------------------
// 🔐 MongoDB Connection Check
// --------------------------

const uri = process.env.MONGODB_URL;

if (!uri || typeof uri !== "string" || uri.trim() === "") {
  console.error("FATAL: MongoDB connection string is missing. Set MONGO_URL (or MONGO_URI) in Render environment variables.");
  process.exit(1);
}

const client = new MongoClient(uri);
app.use(express.static(path.join(__dirname, "public")));

async function start() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("Inclusio_Survey");
    const collection = db.collection("Survey_enteries");
    const emailCollection = db.collection("emails");
    const analytics = db.collection("analytics");

    // --------------------------
    // Page visit tracker
    // --------------------------
    app.use(async (req, res, next) => {
      const today = new Date().toISOString().split("T")[0];
      await analytics.updateOne(
        { date: today },
        { $inc: { visits: 1 } },
        { upsert: true }
      );
      next();
    });

    // --------------------------
    // Submit Survey 
    // --------------------------
    app.post("/submit", async (req, res) => {
      try {
        await collection.insertOne(req.body);

        const lang = req.body.language;
        const today = new Date().toISOString().split("T")[0];

        await analytics.updateOne(
          { date: today },
          { $inc: { [`forms.${lang}`]: 1 } },
          { upsert: true }
        );

        res.send("Saved successfully!");
      } catch (err) {
        console.error(err);
        res.status(500).send("Error saving survey data");
      }
    });

    // --------------------------
    // Email Submit  ✅ BREVO INTEGRATED HERE
    // --------------------------
    app.post("/email-submit", async (req, res) => {
      try {
        const emailData = req.body;

        // 1. Save email to DB
        await emailCollection.insertOne(emailData);

        const lang = emailData.lang || "english";
        const today = new Date().toISOString().split("T")[0];

        await analytics.updateOne(
          { date: today },
          {
            $inc: {
              emails: 1,
              [`emailLang.${lang}`]: 1
            }
          },
          { upsert: true }
        );

        // 2. Send email via Brevo (Sendinblue)
        if (emailData.email) {
          await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "accept": "application/json",
              "content-type": "application/json",
              "api-key": process.env.BREVO_API_KEY
            },
            body: JSON.stringify({
              sender: {
                name: process.env.BREVO_SENDER_NAME,
                email: process.env.BREVO_SENDER_EMAIL
              },
              to: [
                { email: emailData.email }
              ],
              subject: "Thanks for completing the survey",
              textContent: `Hi,

Thanks for taking the time to share your email and complete the survey.
Your response has been recorded.

— Team Inclusio`
            })
          });
        }

        res.send("Email saved and sent successfully!");
      } catch (err) {
        console.error(err);
        res.status(500).send("Error saving email or sending message");
      }
    });

    // --------------------------
    // Serve JSON Questions
    // --------------------------
    app.get("/questions", (req, res) => {
      const lang = req.query.lang || "english";
      const filePath = path.join(__dirname, "public", `${lang}.json`);

      if (!fs.existsSync(filePath)) {
        return res.status(404).send("Language JSON not found");
      }

      res.sendFile(filePath);
    });

    // --------------------------
    // Serve HTML pages
    // --------------------------
    app.get("/", (req, res) =>
      res.sendFile(path.join(__dirname, "public", "index.html"))
    );
    app.get("/email", (req, res) =>
      res.sendFile(path.join(__dirname, "public", "email.html"))
    );
    app.get("/thankyou", (req, res) =>
      res.sendFile(path.join(__dirname, "public", "thankyou.html"))
    );

    // --------------------------
    // Start Server
    // --------------------------
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server running on port ${port}`));

  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}

start();
