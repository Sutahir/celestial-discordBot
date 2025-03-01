const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
  .setName("mplus")
  .setDescription("Submit a mplus")
  .addStringOption((option) =>
    option
      .setName("title")
      .setDescription("Title of the mplus")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("boostercut")
      .setDescription("Cut of boosters")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("payment_type")
      .setDescription("Type of payment")
      .addChoices(
        { name: "Gold", value: "gold" },
        { name: "Toman", value: "toman" }
      )
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("armor_type")
      .setDescription("Type of armor")
      .addChoices(
        { name: "Leather", value: "leather" },
        { name: "Mail", value: "mail" },
        { name: "Cloth", value: "cloth" },
        { name: "Plate", value: "plate" },
        { name: "NoStack", value: "nostack" }
      )
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("note").setDescription("Additional notes").setRequired(false)
  );

module.exports = {
  data,
};
