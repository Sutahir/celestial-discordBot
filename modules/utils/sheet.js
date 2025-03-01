const { google } = require("googleapis");
const NodeCache = require("node-cache");
require("dotenv").config();
const fs = require("fs");
const { CONFIG } = require("./config");
const spreadsheetId = CONFIG.sheets.sheetId;
async function connectToGoogleSheets() {
  try {
    const credentials = JSON.parse(
      fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS, "utf-8")
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    return sheets;
  } catch (error) {
    console.error("Error connecting to Google Sheets:", error);
    throw error;
  }
}

// Initialize cache with the TTL from CONFIG (converting from ms to seconds)
const cache = new NodeCache({ stdTTL: CONFIG.sheets.cacheTime / 1000 });

const getSheetData = async (range) => {
  const cacheKey = `getSheetData-${spreadsheetId}-${range}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const sheets = await connectToGoogleSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  cache.set(cacheKey, response.data.values);
  return response.data.values;
};

const appendSheetData = async (range, values) => {
  const sheets = await connectToGoogleSheets();
  const resource = {
    values,
  };
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "user_entered",
    resource,
  });

  // Invalidate cache for the range
  cache.del(`getSheetData-${spreadsheetId}-${range}`);
  return response.data;
};

const updateSheetData = async (range, values) => {
  const sheets = await connectToGoogleSheets();
  const resource = {
    values,
  };
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    resource,
  });

  // Invalidate cache for the range
  cache.del(`getSheetData-${spreadsheetId}-${range}`);
  return response.data;
};

const deleteSheetData = async (range) => {
  const sheets = await connectToGoogleSheets();
  const response = await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range,
  });

  // Invalidate cache for the range
  cache.del(`getSheetData-${spreadsheetId}-${range}`);
  return response.data;
};
const getCurrentTimestamp = () => {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" });
};

/**
 * Caches data from all sheet ranges defined in CONFIG
 * This function should be called when the bot starts up to pre-populate the cache
 */
const cacheAllSheetRanges = async () => {
  try {
    const ranges = CONFIG.sheets.ranges;
    const rangeCount = Object.keys(ranges).length;
    const cacheDuration = CONFIG.sheets.cacheTime / 1000;

    console.log(
      `Starting to cache ${rangeCount} sheet ranges with a ${cacheDuration}s cache duration...`
    );

    for (const [rangeName, rangeValue] of Object.entries(ranges)) {
      console.log(`Caching range: ${rangeName} (${rangeValue})`);
      const data = await getSheetData(rangeValue);
      console.log(
        `Successfully cached: ${rangeName} - Got ${
          data ? data.length : 0
        } rows of data`
      );
    }

    console.log(
      `All ${rangeCount} sheet ranges have been cached successfully!`
    );
  } catch (error) {
    console.error("Error caching sheet ranges:", error);
  }
};

module.exports = {
  getSheetData,
  appendSheetData,
  updateSheetData,
  deleteSheetData,
  connectToGoogleSheets,
  getCurrentTimestamp,
  cacheAllSheetRanges,
};
