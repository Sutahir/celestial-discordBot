const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("boost")
  .setDescription("Submit a boost")
  .addStringOption((option) =>
    option
      .setName("title")
      .setDescription("Title of the boost")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("price")
      .setDescription("Price of the boost")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("note").setDescription("Additional notes").setRequired(true)
  );

module.exports = {
  data,
};
