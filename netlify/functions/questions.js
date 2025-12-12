const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  const lang = event.queryStringParameters.lang || "english";
  const filePath = path.join(__dirname, "../../public", `${lang}.json`);

  // 🔥 Add debug output
  console.log("Looking for JSON at:", filePath);

  try {
    const json = fs.readFileSync(filePath, "utf8");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: json,
    };
  } catch (err) {
    console.log("ERROR:", err);
    return { statusCode: 404, body: "Language JSON not found" };
  }
};
