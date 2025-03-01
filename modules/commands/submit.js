const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("add")
  .setDescription("Submit a boost")
  .addUserOption((option) =>
    option.setName("user").setDescription("Booster's tag").setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("namerealm")
      .setDescription("booster name-realm")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("amount")
      .setDescription("Amount in K scale (E.g 100, 2000)")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("note").setDescription("Additional notes").setRequired(true)
  );

module.exports = {
  data,
};
