const { readdirSync } = require("fs");
const path = require("path");
require("dotenv").config();
// Centralized configuration
const CONFIG = {
  sheets: {
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    adminSheetId: process.env.ADMIN_SPREADSHEET_ID, // Spreadsheet for Payments
    celestialSheetId: process.env.CELESTIAL_SPREADSHEET_ID, // Spreadsheet for Gold Payments and Balance
    ranges: {
      balanceSheet: "Balance Sheet!A:B", // Corrected range name with space
      goldPayment: "Gold Payment!A:Z",
      payment: "Payment!A:Z", // In ADMIN spreadsheet
      // ... other ranges
    },
  },
  channels: {
    applicationsSource: "1231657838863192136",
    applicationsDestination: "1254199483726565486",
    balanceCommand: "1262534348993855619",
    payment: "1318601642144170155",
    mplusBooking: "1301933098426171402",
    balanceAdd: "1264335663558430741",
    transcriptDestination: "1264699919415906444",
  },
  roles: {
    admin: "1254054223046508604",
    booster: "1231894640802791424",
    ratingTiers: {
      3500: "1300843433774153789",
      3400: "1254443951004454942",
      3300: "1302240179670749214",
      3200: "1301951462032801904",
      3100: "1302240266450636840",
      3000: "1254217511507857429",
      2900: "1302240333639192618",
      2800: "1301946977956921456",
    },
  },
  commandPrefixes: {
    balance: ["!balance", "!b", ".b", ".balance"],
    mplus: "!m",
    done: "!done",
    rename: "!rename",
  },
  timeZone: "Etc/GMT-3",
  categories: {
    levelup: "LevelUp",
    mplus: "MPlus",
    other: "Others",
  },
};

const loadCommands = () => {
  const commandFiles = readdirSync(path.join(__dirname, "../commands")).filter(
    (file) => file.endsWith(".js")
  );
  const commands = commandFiles.map((file) =>
    require(`../commands/${file}`).data.toJSON()
  );
  return commands;
};

const loadEventHandlers = (client) => {
  const eventFiles = readdirSync(path.join(__dirname, "../handlers")).filter(
    (file) => file.endsWith(".js")
  );
  for (const file of eventFiles) {
    const event = require(`../handlers/${file}`);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
};

module.exports = { loadCommands, loadEventHandlers, CONFIG };
