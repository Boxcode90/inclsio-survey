const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
const uri = process.env.MONGODB_URI; 
const client = new MongoClient(uri);
async function start() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("Inclusio_Survey");
    const collection = db.collection("Survey_enteries");
    const emailCollection = db.collection("emails");
    const analytics = db.collection("analytics"); // new collection for tracking

    // Middleware to track page visits
    app.use(async (req, res, next) => {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      await analytics.updateOne(
        { date: today },
        { $inc: { visits: 1 } },
        { upsert: true }
      );
      next();
    });

    // STORE form data
    app.post("/submit", async (req, res) => {
      try {
        await collection.insertOne(req.body);

        // increment form count per language
        const lang = req.body.language || "english";
        const today = new Date().toISOString().split("T")[0];
        await analytics.updateOne(
          { date: today },
          { $inc: { [`forms.${lang}`]: 1 } },
          { upsert: true }
        );

        res.send("Saved successfully!");
      } catch (err) {
        console.error(err);
        res.status(500).send("Error saving data");
      }
    });

    // EMAIL SUBMISSION
    app.post("/email-submit", async (req, res) => {
      try {
        await emailCollection.insertOne(req.body);

        // increment email count
        const today = new Date().toISOString().split("T")[0];
        await analytics.updateOne(
          { date: today },
          { $inc: { emails: 1 } },
          { upsert: true }
        );

        res.send("Email saved successfully!");
      } catch (err) {
        console.error(err);
        res.status(500).send("Error saving email");
      }
    });

    // SERVE ANY JSON FILE BASED ON LANGUAGE
    app.get("/questions", (req, res) => {
      const lang = req.query.lang || "english";
      const filePath = path.join(__dirname, "public", `${lang}.json`);

      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          console.error("JSON file missing:", filePath);
          return res.status(404).send("Language JSON not found");
        }
        res.sendFile(filePath);
      });
    });

    // SERVE HTML PAGES
    app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
    app.get("/email", (req, res) => res.sendFile(path.join(__dirname, "public", "email.html")));
    app.get("/thankyou", (req, res) => res.sendFile(path.join(__dirname, "public", "thankyou.html")));

    // Start server
    app.listen(3000, () => console.log("Server running on port 3000"));
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}

start();
