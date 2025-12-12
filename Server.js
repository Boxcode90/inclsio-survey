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

const uri = process.env.MONGO_URL || process.env.MONGO_URI;

if (!uri || typeof uri !== "string" || uri.trim() === "") {
  console.error("FATAL: MongoDB connection string is missing. Set MONGO_URL (or MONGO_URI) in Render environment variables.");
  process.exit(1);
}

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// --------------------------
// Static files (public)
// --------------------------
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
    // Email Submit
    // --------------------------
    app.post("/email-submit", async (req, res) => {
      try {
        await emailCollection.insertOne(req.body);

        const lang = req.body.lang || "english";
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

        res.send("Email saved successfully!");
      } catch (err) {
        console.error(err);
        res.status(500).send("Error saving email");
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
