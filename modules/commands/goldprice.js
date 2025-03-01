const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("goldprice")
  .setDescription("Add gold price text")
  .addStringOption(
    (option) =>
      option
        .setName("message")
        .setDescription("Price of gold")
        .setRequired(true)
        .setMaxLength(2000) // Setting the maximum length for long text
  );

module.exports = {
  data,
};
