require("dotenv").config();
const { EmbedBuilder, Client } = require("discord.js");
const {
  getCurrentTimestamp,
  getSheetData,
  appendSheetData,
} = require("./sheet");
const { v4: uuidv4 } = require("uuid");
const { CONFIG } = require("./config");
const attendance = async (message) => {
  try {
    const details = message.content.split(" ");
    if (details.length < 3) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Error")
        .setDescription(
          "Please provide a price and at least one booster mention."
        );
      return message.reply({ embeds: [errorEmbed] });
    }

    const balanceSheet = await getSheetData(CONFIG.sheets.ranges.balanceSheet);
    const priceInput = details[1];
    const booster = details[2];

    const discordID = booster.replace(/<@!?|>/g, "");

    const namerealm = balanceSheet.find((row) => row[1] === discordID)?.[0];
    console.log(namerealm);
    const price = priceInput.replace(/k/i, "").trim();

    if (isNaN(price) || price <= 0) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Error")
        .setDescription(
          "The input is not a valid number. Please enter a positive amount."
        );
      return message.reply({ embeds: [errorEmbed] });
    }

    const attendanceId = uuidv4();

    // Check if IDs exist in the balance sheet
    if (!namerealm) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Error")
        .setDescription("Please add name-realm first, then try again.");
      return message.reply({ embeds: [errorEmbed] });
    }

    const rawdata = [
      getCurrentTimestamp(),
      discordID,
      namerealm,
      price * 1000,
      "Automated payment",
      "Mplus",
      message.author.displayName,
      attendanceId,
    ];
    // Append data to Google Sheets
    await appendSheetData("Gold Payment!A1", [rawdata]);

    const successEmbed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("Success")
      .setDescription(
        `Attendance recorded for ${namerealm} with ID ${attendanceId}.`
      );

    message.reply({ embeds: [successEmbed] });
  } catch (error) {
    console.error("Error handling attendance:", error);
    const errorEmbed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("Error")
      .setDescription(
        "There was an error recording the attendance. Please try again later."
      );
    message.reply({ embeds: [errorEmbed] });
  }
};

module.exports = { attendance };
