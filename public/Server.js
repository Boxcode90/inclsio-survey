const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, "public")));

const uri = "mongodb+srv://rafiqmohamed025_db_user:1924CY@cluster0.kxikrnk.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

async function start() {
try {
await client.connect();
console.log("Connected to MongoDB");

const db = client.db("Inclusio_Survey");
const collection = db.collection("Survey_enteries");

// STORE form data
app.post("/submit", async (req, res) => {
  try {
    await collection.insertOne(req.body);
    res.send("Saved successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving data");
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

// SERVE HTML FORM
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));

} catch (err) {
console.error("Failed to connect to MongoDB:", err);
}
}
// EMAIL PAGE
app.get("/email", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "email.html"));
});

// STORE EMAIL
app.post("/email-submit", async (req, res) => {
  try {
    const emailDb = client.db("Inclusio_Survey").collection("emails");
    await emailDb.insertOne(req.body);
    res.send("Email saved successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving email");
  }
});

start();
