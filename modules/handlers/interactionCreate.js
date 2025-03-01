const {
  handleBoostCommand,
  handleBoostButton,
  handleCancelTakeButton,
  handleDeleteButton,
} = require("../utils/boostUtils");
const { submit, balance } = require("../utils/submit");
const { goldprice } = require("../utils/goldprice");
const { mplus } = require("../utils/mplus");
const { handleButton } = require("../utils/buttonHandler");

const { payment, handleModalSubmit } = require("./payment");
module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (
      !interaction.isCommand() &&
      !interaction.isButton() &&
      !interaction.isModalSubmit()
    )
      return;

    try {
      if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction);
        return;
      }
      if (interaction.isCommand() && interaction.commandName === "boost") {
        await handleBoostCommand(interaction);
      } else if (
        interaction.customId === "payment" &&
        !interaction.isModalSubmit()
      ) {
        await payment(interaction);
      } else if (interaction.commandName === "goldprice") {
        await goldprice(interaction);
      } else if (interaction.commandName === "mplus") {
        await mplus(interaction);
      } else if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction);
      } else if (interaction.isButton()) {
        await interaction.deferReply({ ephemeral: true });

        if (interaction.customId === "boost_button") {
          await handleBoostButton(interaction);
        } else if (interaction.customId === "cancel_take") {
          await handleCancelTakeButton(interaction);
        } else if (interaction.customId === "delete_button") {
          await handleDeleteButton(interaction);
        } else if (
          interaction.customId.startsWith("role_") ||
          interaction.customId === "reject_application"
        ) {
          await handleButton(interaction);
        }
      }

      if (interaction.isCommand() && interaction.commandName === "add") {
        await submit(interaction);
      }
    } catch (error) {
      console.error("Error handling interaction:", error);
    }
  },
};
