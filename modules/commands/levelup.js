const { SlashCommandBuilder } = require("discord.js");
const { handleLevelupCommand } = require("../utils/levelup");

// Create the command data
const data = new SlashCommandBuilder()
  .setName("levelup")
  .setDescription("Submit a level-up request")
  .addStringOption((option) =>
    option
      .setName("title")
      .setDescription("Title of the level-up (e.g., Tarren Mill - Warriorname)")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("price")
      .setDescription("Price of the level-up (e.g., 300k)")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("currency")
      .setDescription("Currency (Gold or Toman)")
      .addChoices(
        { name: "Gold", value: "gold" },
        { name: "Toman", value: "toman" }
      )
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("note")
      .setDescription("Additional information")
      .setRequired(true)
  );

// Export both data and execute
module.exports = {
  data,
  async execute(interaction) {
    console.log("Executing levelup command");
    await handleLevelupCommand(interaction);
  },
};
