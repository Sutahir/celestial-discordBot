const { connectToGoogleSheets } = require("./sheet");
require("dotenv").config();
const { google } = require("googleapis");
const { EmbedBuilder, Colors } = require("discord.js"); // Ensure you import Colors

const currency = async (message) => {
  try {
    console.log(message.content);
    const content = JSON.parse(message.content);
    if (content) {
      const dollarPrice = content.usd;
      const euroPrice = content.euro;
      const lowestPrice = content.lowest;
      const rawdata = [dollarPrice, euroPrice, lowestPrice];
      const sheets = await connectToGoogleSheets(); // Initialize Google Sheets API client

      // Get the last row number

      // Update the range with new data
      sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Calculator!A10:C10`,
        valueInputOption: "RAW",
        resource: {
          values: [rawdata],
        },
      });

      console.log("Values updated successfully.");
    }
  } catch (err) {
    console.error("Error updating values:", err);
  }
};

const payment = async (message) => {
  try {
    console.log(message.content);
    const content = JSON.parse(message.content);

    if (content) {
      const discordID = parseInt(content.discordid, 10);
      const duration = content.duration;
      const amount = content.meghdar;
      const gheymat = content.gheymat;
      const total = content.total;

      // Validate fields before proceeding
      if (!discordID || !duration || !amount || !gheymat || !total) {
        console.error("Missing or invalid content fields");
        return;
      }

      if (!message.guild) {
        console.error("Message is not from a guild");
        return;
      }

      // Fetch the member to make sure we are not missing anyone due to caching
      const member = await message.guild.members
        .fetch(discordID)
        .catch((err) => {
          console.error("Error fetching member:", err);
          return null;
        });

      if (!member) {
        console.error("Member not found in guild:", discordID);
        return;
      }

      // Check if member has a valid User instance and can receive DMs
      const user = member.user;
      if (!user || typeof user.send !== "function") {
        console.error("User instance not found or cannot send messages");
        return;
      }

      const paymentMessage = `Amount : ${amount}\nPrice : ${gheymat}\nMablagh Daryafti : ${total}\nTime Variz : ${duration}`;
      const paymentEmbed = new EmbedBuilder()
        .setTitle("A payment has been added for you")
        .setDescription(`\`\`\`${paymentMessage}\`\`\``)
        .setColor(Colors.Green);

      await user.send({ embeds: [paymentEmbed] });
    }
  } catch (err) {
    console.error("Error updating values:", err);
  }
};

module.exports = { currency, payment };
