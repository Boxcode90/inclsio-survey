const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URL;
const client = new MongoClient(uri);
let db, emailCollection, analytics;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("Inclusio_Survey");
    emailCollection = db.collection("emails");
    analytics = db.collection("analytics");
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Not allowed" };
  }

  await connectDB();

  const body = JSON.parse(event.body);
  const lang = body.lang || "english";
  const today = new Date().toISOString().split("T")[0];

  try {
    await emailCollection.insertOne(body);

    await analytics.updateOne(
      { date: today },
      {
        $inc: {
          emails: 1,
          [`emailLang.${lang}`]: 1,
        }
      },
      { upsert: true }
    );

    return {
      statusCode: 200,
      body: "Email saved successfully!",
    };
  } catch (err) {
    return { statusCode: 500, body: "Error saving email" };
  }
};
