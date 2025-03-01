const { google } = require("googleapis");
const fs = require("fs");
require("dotenv").config();
const { sleep } = require("./sleep");
const { EmbedBuilder, Colors } = require("discord.js"); // Ensure you import Colors

async function cachebalance() {
  while (true) {
    try {
      getData("Gold Payment!A:J");
      getData("Payment!B4:Q");
	   getData("Balance Sheet!A2:B");
      await sleep(15000);
    } catch (err) {
      console.log(err.message);
    }
  }
}
// Function to get the current timestamp
const getCurrentTimestamp = () => {
  let options = {
    timeZone: "Etc/GMT-3",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false, // Set to true for 12-hour format
  };

  let date = new Date().toLocaleString("en-US", options);
  console.log(date);
  return date;
};

// Function to connect to Google Sheets
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

// Function to handle the interaction and submit data
async function submit(interaction) {
  try {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    if (!member.roles.cache.has("1231894640802791424")) {
      return await interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }
    if (interaction.channel.id !== "1264335663558430741") {
      return await interaction.reply({
        content: "Please head over to <#1264335663558430741> to add balance.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("user"); // Corrected to get the user option
    const name = interaction.options.getString("namerealm");
    const priceInput = interaction.options.getString("amount");
    const price = priceInput.replace(/\D/g, "");
    const note = interaction.options.getString("note");

    // Handle potential null values

    // Prepare the data to be added to the Google Sheet
    const rawdata = [
      getCurrentTimestamp(),
      user.id,
      name,
      price * 1000,
      name,
      member.displayName,
      note,
    ];

    // Respond to the interaction first to avoid unknown interaction error
    await interaction.deferReply();

    // Call the function to update Google Sheets
    await addvalue("Gold Payment", [rawdata]);

    // Send the DM to the user
    await user.send(
      `Hey <@${user.id}>\n${price}k has been added to ${name} \nNote : ${note} `
    );

    // Edit the deferred reply
    await interaction.editReply(
      `${user}\n${price}k has been added to ${name} \nNote : ${note} `
    );
  } catch (error) {
    console.error("Error handling interaction:", error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply("Failed to update the sheet.");
    } else {
      await interaction.reply("Failed to update the sheet.");
    }
  }
}

// Function to add values to the Google Sheet
async function addvalue(range, rawdata) {
  try {
    const sheets = await connectToGoogleSheets();

    // Get the last row number
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${range}!K1`, // Assuming K1 is a cell where you always have a value
    });

    const lastRow = response.data.values ? response.data.values[0] : 1;

    // Update the range with new data
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${range}!A:G`,
      valueInputOption: "RAW",
      resource: {
        values: rawdata,
      },
    });

    console.log(
      `Updated range: ${range}!A${lastRow}:G${lastRow + rawdata.length - 1}`
    );
  } catch (error) {
    console.error("Error updating Google Sheets:", error);
    throw error; // Optional: propagate the error if needed
  }
}

let cache = {};
const CACHE_DURATION = 15 * 1000; // 15 sec

// Function to fetch data from Google Sheets and update the cache

async function fetchDataAndCache(range) {
  const sheets = await connectToGoogleSheets();
  const spreadsheetId = range.startsWith("Payment!")
    ? "1p9DVLcMwoNK55kU37Pebo3OAan94_hnJqdlZ-FDSE3M"
    : process.env.GOOGLE_SHEET_ID;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: range,
  });
  const data = response.data.values;

  cache[range] = {
    data: data,
    timestamp: Date.now(),
  };

  return data;
}


async function balance(message) {
  try {
    const member = message.guild.members.cache.get(message.author.id);
    const goldData = await getData("Gold Payment!A:K");
    const moneyData = await getData("Payment!A4:Q");
    const balanceSheetData = await getData("Balance Sheet!A:D");
    const moneyFilteredData = moneyData.filter((boost) => boost && boost[1] === member.id);
    const goldFilteredData = goldData.filter((boost) => boost && boost[1] === member.id);
    const balanceEntry = balanceSheetData.find((entry) => entry && entry[1] === member.id);

    console.log(member.id);

    if (!balanceEntry) {
      await member.send({
        content: "Your username was not found in the Balance Sheet. If you are boosting, head over to <#1302037046625570937> and register your Name-Realm.",
      });
    }

    const balance = balanceEntry ? balanceEntry[3] : 0;

    const goldMessage = goldFilteredData
      .map((boost) => {
        const status = boost[10] === "TRUE" ? "Paid" : "Not Paid";
        return `${boost.slice(0, 1).concat(boost.slice(2, 4)).join(", ")} - ${status}`;
      })
      .join("\n");

    const moneyMessage = moneyFilteredData
      .map((boost) => {
        const status = boost[16] === "TRUE" ? "Paid" : "Not Paid";
        return `${boost.slice(0, 1).concat(boost.slice(2, 6)).join(", ")} - ${status}`;
      })
      .join("\n");

    const splitIntoChunks = (text, maxLength) => {
      const chunks = [];
      while (text.length > 0) {
        chunks.push(text.slice(0, maxLength));
        text = text.slice(maxLength);
      }
      return chunks;
    };

    const balanceEmbed = new EmbedBuilder()
      .setTitle("Balance Information")
      .setDescription(`Your current Balance : ${balance}`)
      .setColor(Colors.Green);

    await member.send({
      embeds: [balanceEmbed],
    });

    if (goldMessage) {
      const goldChunks = splitIntoChunks(goldMessage, 4096);
      for (const chunk of goldChunks) {
        const goldEmbed = new EmbedBuilder()
          .setTitle("Gold Payments")
          .setDescription(chunk)
          .setColor(Colors.Gold);

        await member.send({ embeds: [goldEmbed] });
      }
    }

    if (moneyMessage) {
      const moneyChunks = splitIntoChunks(moneyMessage, 4096);
      for (const chunk of moneyChunks) {
        const moneyEmbed = new EmbedBuilder()
          .setTitle("Cash Payments")
          .setDescription(chunk)
          .setColor(Colors.Green);

        await member.send({ embeds: [moneyEmbed] });
      }
    }

    await message.reply("Check your DM.");
  } catch (error) {
    console.error("Error handling interaction:", error);
    await message.reply("There was an error while processing your command.");
  }
}
// Function to get data, either from cache or by fetching from Google Sheets
async function getData(range) {
  const cachedData = cache[range];

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data;
  } else {
    return await fetchDataAndCache(range);
  }
}

module.exports = {
  submit,
  balance,
  cachebalance,
  connectToGoogleSheets,
  addvalue,
  getCurrentTimestamp,
  getData
};
