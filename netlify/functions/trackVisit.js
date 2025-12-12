const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URL;
const client = new MongoClient(uri);
let analytics;

async function connectDB() {
  if (!analytics) {
    await client.connect();
    analytics = client.db("Inclusio_Survey").collection("analytics");
  }
}

exports.handler = async () => {
  await connectDB();

  const today = new Date().toISOString().split("T")[0];

  await analytics.updateOne(
    { date: today },
    { $inc: { visits: 1 } },
    { upsert: true }
  );

  return { statusCode: 200, body: "ok" };
};
