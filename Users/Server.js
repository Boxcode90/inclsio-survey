// server.js
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
const uri = "mongodb+srv://rafiqmohamed025_db_user:1924CY@cluster0.kxikrnk.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

async function start() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("Inclusio_Survey");
    const surveyCollection = db.collection("Survey_enteries");
    const emailCollection = db.collection("emails");
    const analytics = db.collection("analytics");

    // Middleware to track page visits
    app.use(async (req, res, next) => {
      try {
        const today = new Date().toISOString().split("T")[0];
        await analytics.updateOne(
          { date: today },
          { $inc: { visits: 1 } },
          { upsert: true }
        );
      } catch (err) {
        console.error("Analytics update error:", err);
      }
      next();
    });

    // Form submission route
    app.post("/submit", async (req, res) => {
      try {
        await surveyCollection.insertOne(req.body);

        const lang = req.body.language || "english";
        const today = new Date().toISOString().split("T")[0];
        await analytics.updateOne(
          { date: today },
          { $inc: { [`forms.${lang}`]: 1 } },
          { upsert: true }
        );

        res.send("Form saved successfully!");
      } catch (err) {
        console.error(err);
        res.status(500).send("Error saving form");
      }
    });

    // Email submission route
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

    // Serve JSON files based on language
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

    // Serve HTML pages
    app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
    app.get("/email", (req, res) => res.sendFile(path.join(__dirname, "public", "email.html")));
    app.get("/thankyou", (req, res) => res.sendFile(path.join(__dirname, "public", "thankyou.html")));

    // Start server on Hostinger port
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}

start();
