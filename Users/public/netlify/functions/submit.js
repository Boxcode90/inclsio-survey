const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://rafiqmohamed025_db_user:1924CY@cluster0.kxikrnk.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);
let db, collection, analytics;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("Inclusio_Survey");
    collection = db.collection("Survey_enteries");
    analytics = db.collection("analytics");
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  await connectDB();

  const body = JSON.parse(event.body);
  const lang = body.language || "english";
  const today = new Date().toISOString().split("T")[0];

  try {
    await collection.insertOne(body);

    await analytics.updateOne(
      { date: today },
      { $inc: { [`forms.${lang}`]: 1 } },
      { upsert: true }
    );

    return {
      statusCode: 200,
      body: "Saved successfully!",
    };
  } catch (err) {
    return { statusCode: 500, body: "Error saving data" };
  }
};
