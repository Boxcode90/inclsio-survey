const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  const lang = event.queryStringParameters.lang || "english";
  const filePath = path.join(__dirname, "../../public", `${lang}.json`);

  try {
    const json = fs.readFileSync(filePath, "utf8");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: json,
    };
  } catch {
    return { statusCode: 404, body: "Language JSON not found" };
  }
};
