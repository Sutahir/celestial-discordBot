const { google } = require("googleapis");
const fs = require("fs");
require("dotenv").config();

// Function to connect to Google Sheets
async function connectToGoogleSheets() {
  const credentials = JSON.parse(
    fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS, "utf-8")
  );
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}
// Example usage
(async () => {
  try {
    const range = "Gold Payment!A:J"; // Specify your range
    const data = await getData(range);
    console.log(data);

    // You can access the cached data later
    setTimeout(async () => {
      const cachedData = await getData(range);
      console.log(cachedData);
    }, 5000);
  } catch (error) {
    console.error("Error:", error);
  }
})();
