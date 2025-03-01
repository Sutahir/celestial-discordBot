require("dotenv").config(); // Import dotenv to load environment variables
const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { getSheetData, updateSheetData, appendSheetData } = require("./sheet");
const { CONFIG } = require("./config");

const channelId = "1302059080105594880"; // Channel ID for logging

const rename = async (message) => {
  let logChannel; // Declare logChannel variable
  const member = message.guild.members.cache.get(message.author.id); // Get the GuildMember object
  const nickname = member.nickname || ""; // Use nickname property or default to username

  try {
    const details = message.content.split(" ");

    // Check if the command is in the format !rename <User> <newName>
    if (details.length === 3) {
      const userMention = details[1]; // The tagged user mention
      const newName = details[2]; // The new name to set

      // Check if the author has the required role
      if (!member.roles.cache.has("1231894640802791424")) {
        await message.author.send(
          "You do not have permission to rename users."
        );
        return;
      }

      // Fetch all members to ensure we have the latest data
      await message.guild.members.fetch();

      // Extract the user ID from the mention (format: <@userID>)
      const userIdMatch = userMention.match(/^<@!?(\d+)>$/);
      if (!userIdMatch) {
        await message.author.send(
          "Invalid user mention. Please tag a user correctly."
        );
        return;
      }

      const userId = userIdMatch[1]; // Get the user ID from the match
      const targetMember = message.guild.members.cache.get(userId); // Get the member by ID

      // Debugging: log the result of user lookup
      if (!targetMember) {
        console.error(`User not found: ${userId}.`);
        await message.author.send(
          "User not found. Check the username and try again."
        );
        return;
      }

      // If all checks pass, set the new nickname
      await targetMember.setNickname(newName);
      await updateName([userId, newName]);
      await message.author.send(
        `Character name updated successfully for ${targetMember.displayName} to ${newName}`
      );

      // Log the action
      logChannel = message.guild.channels.cache.get(channelId); // Get the logging channel
      if (logChannel) {
        await logChannel.send(
          `User ${targetMember} renamed to ${newName} by ${message.author}`
        );
      }
    } else if (details.length === 2) {
      // If the command is in the format !rename character-realm
      const newName = details[1];
      const member = message.guild.members.cache.get(message.author.id); // Get the GuildMember object

      // Check if the new name is empty
      if (!newName) {
        await message.author.send("Name can't be empty.");
        await message.delete();
        return;
      }

      const regex = /^[\p{L}]+-[\p{L}]+$/u;

      if (regex.test(newName)) {
        const [charName, realmName] = newName.split("-");
        const validRealms = ["kazzak"];

        if (!validRealms.includes(realmName.toLowerCase())) {
          await message.author.send(
            "Wrong Realm! Only Kazzak, Twisting Nether, and Tarren Mill are allowed."
          );
          await message.delete();
          return;
        }

        // Capitalize and set the new nickname
        const capitalizeFirstLetter = (string) =>
          string.replace(/^\w/, (c) => c.toUpperCase());
        const updatedName = capitalizeFirstLetter(charName);
        const updatedRealm = capitalizeFirstLetter(realmName);
        const updatedDetail = `${updatedName}-${updatedRealm}`;

        // Check for permission to change nickname
        await message.member.setNickname(updatedDetail);
        await updateName([message.author.id, updatedDetail]);
        await message.author.send(
          `Character name updated successfully to ${updatedDetail}`
        );

        // Log the action
        if (logChannel) {
          await logChannel.send(
            `User ${message.author} renamed from ${nickname} to ${updatedDetail}`
          );
        }
      } else {
        await message.author.send(
          "Invalid format. Please use the format `character-realm`."
        );
      }
    } else {
      await message.author.send(
        "Invalid command format. Please use `!rename <User> <newName>` or `!rename <character-realm>`."
      );
    }

    // Delete the original message
    await message.delete();
  } catch (error) {
    console.error("Error processing rename command:", error);
    // Send a fallback message in case of an error, but do not delete the original message if DM fails
    await message.reply(
      "An error occurred while processing your request. Please try again."
    );

    // Log the error to the log channel
    if (logChannel) {
      await logChannel.send(
        `Error occurred for user ${message.author.username}: ${error.message}`
      );
    }
  }
};

const updateName = async ([id, name]) => {
  try {
    // Use getSheetData instead of direct API calls
    const sheetData = await getSheetData(CONFIG.sheets.ranges.balanceSheet);

    if (!sheetData || sheetData.length === 0) {
      console.error("No data found in the sheet. Adding new entry.");
      await appendSheetData(CONFIG.sheets.ranges.balanceSheet, [[id, name]]);
      console.log(`Added new entry with User ID ${id} and name ${name}.`);
      return;
    }

    // Populate the Map
    const userMap = new Map();
    sheetData.forEach((row, index) => {
      if (row && row.length > 0) {
        const userId = row[0]; // Get user ID from the first column
        userMap.set(userId, index); // Store the user ID with its index
      }
    });

    const index = userMap.get(id); // Get the index for the specified user ID

    if (index !== undefined) {
      // If the ID exists, update the name
      const updateRange = `${
        CONFIG.sheets.ranges.balanceSheet.split("!")[0]
      }!B${index + 1}`;
      await updateSheetData(updateRange, [[name]]);
      console.log(`Successfully updated User ID ${id} with name ${name}.`);
    } else {
      // If the ID does not exist, append a new entry
      await appendSheetData(CONFIG.sheets.ranges.balanceSheet, [[id, name]]);
      console.log(`Added new entry with User ID ${id} and name ${name}.`);
    }
  } catch (error) {
    console.error("Error updating or adding name:", error);
  }
};

module.exports = { rename };
