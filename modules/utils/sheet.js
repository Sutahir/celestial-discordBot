const { google } = require("googleapis");
const NodeCache = require("node-cache");
require("dotenv").config();
const fs = require("fs");
const { CONFIG } = require("./config");

// Initialize cache with the TTL from CONFIG (converting from ms to seconds)
const cache = new NodeCache({ stdTTL: CONFIG.sheets.cacheTime / 1000 });

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

// Modified to accept a spreadsheet ID parameter
const getSheetData = async (range, spreadsheetId) => {
  // Use the provided spreadsheet ID, or determine it based on the range if not provided
  const sheetId = spreadsheetId || getSpreadsheetIdForRange(range);

  const cacheKey = `getSheetData-${sheetId}-${range}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const sheets = await connectToGoogleSheets();
  console.log(`Fetching data from range ${range} in spreadsheet ${sheetId}`);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  cache.set(cacheKey, response.data.values);
  return response.data.values;
};

// Determine which spreadsheet ID to use based on the range
function getSpreadsheetIdForRange(range) {
  // These ranges are in the CELESTIAL spreadsheet
  if (range.startsWith("Balance Sheet!") || range.startsWith("Gold Payment!")) {
    console.log(`Using CELESTIAL spreadsheet for range: ${range}`);
    return CONFIG.sheets.celestialSheetId;
  }
  // These ranges are in the ADMIN spreadsheet
  else if (range.startsWith("Payment!")) {
    console.log(`Using ADMIN spreadsheet for range: ${range}`);
    return CONFIG.sheets.adminSheetId;
  }
  // Default to ADMIN spreadsheet for other ranges
  else {
    console.log(`Using default ADMIN spreadsheet for range: ${range}`);
    return CONFIG.sheets.adminSheetId;
  }
}

// Modified to accept a spreadsheet ID parameter
const appendSheetData = async (range, values, spreadsheetId) => {
  try {
    // Use the provided spreadsheet ID, or determine it based on the range if not provided
    const sheetId = spreadsheetId || getSpreadsheetIdForRange(range);

    const sheets = await connectToGoogleSheets();

    // Sanitize the values to ensure all elements are strings, numbers, or booleans
    const sanitizedValues = values.map((row) => {
      return row.map((cell) => {
        // Handle null or undefined values
        if (cell === null || cell === undefined) {
          return "";
        }

        // Convert everything to string for safety
        return String(cell);
      });
    });

    const resource = {
      values: sanitizedValues,
    };

    console.log(`Appending data to ${range} in spreadsheet ${sheetId}`);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      resource,
    });

    // Invalidate cache for the range
    cache.del(`getSheetData-${sheetId}-${range}`);
    return response.data;
  } catch (error) {
    console.error(`Error in appendSheetData for range ${range}:`, error);
    if (error.errors && error.errors.length > 0) {
      console.error("Detailed error:", error.errors[0].message);
    }
    throw error;
  }
};

// Modified to accept a spreadsheet ID parameter
const updateSheetData = async (range, values, spreadsheetId) => {
  // Use the provided spreadsheet ID, or determine it based on the range if not provided
  const sheetId = spreadsheetId || getSpreadsheetIdForRange(range);

  const sheets = await connectToGoogleSheets();
  const resource = {
    values,
  };

  console.log(`Updating data in ${range} in spreadsheet ${sheetId}`);

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "RAW",
    resource,
  });

  // Invalidate cache for the range
  cache.del(`getSheetData-${sheetId}-${range}`);
  return response.data;
};

// Modified to accept a spreadsheet ID parameter
const deleteSheetData = async (range, spreadsheetId) => {
  // Use the provided spreadsheet ID, or determine it based on the range if not provided
  const sheetId = spreadsheetId || getSpreadsheetIdForRange(range);

  const sheets = await connectToGoogleSheets();

  console.log(`Deleting data from ${range} in spreadsheet ${sheetId}`);

  const response = await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range,
  });

  // Invalidate cache for the range
  cache.del(`getSheetData-${sheetId}-${range}`);
  return response.data;
};

// Synchronous function to get current timestamp
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
      try {
        // Determine the appropriate spreadsheet ID for this range
        const spreadsheetId = getSpreadsheetIdForRange(rangeValue);
        console.log(
          `Caching range: ${rangeName} (${rangeValue}) from spreadsheet: ${spreadsheetId}`
        );

        const data = await getSheetData(rangeValue, spreadsheetId);
        console.log(
          `Successfully cached: ${rangeName} - Got ${
            data ? data.length : 0
          } rows of data`
        );
      } catch (rangeError) {
        console.error(
          `Error caching range ${rangeName} (${rangeValue}):`,
          rangeError.message
        );
      }
    }

    console.log(`Sheet range caching process completed.`);
  } catch (error) {
    console.error("Error in cacheAllSheetRanges:", error);
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
  getSpreadsheetIdForRange,
};
