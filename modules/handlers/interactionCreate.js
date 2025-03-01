const {
  handleLevelupCommand,
  handleBoostButton,
  handleCancelTakeButton,
  handleDeleteButton,
} = require("../utils/levelup");
const { add } = require("../utils/add");
const { mplus } = require("../utils/mplus");
const { handleButton } = require("../utils/buttonHandler");

const { payment, handleModalSubmit } = require("./payment");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      // Handle modal submissions
      if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction);
        return;
      }

      // Handle slash commands
      if (interaction.isCommand()) {
        console.log(`Processing command: ${interaction.commandName}`);

        // Handle commands through client.commands first if available
        const command = interaction.client.commands?.get(
          interaction.commandName
        );
        if (command) {
          await command.execute(interaction);
          return;
        }

        // Fallback for legacy commands
        switch (interaction.commandName) {
          case "levelup":
            await handleLevelupCommand(interaction);
            break;
          case "mplus":
            await mplus(interaction);
            break;
          case "add":
            await add(interaction);
            break;
          default:
            console.log(`Unknown command: ${interaction.commandName}`);
        }

        return;
      }

      // Handle buttons
      if (interaction.isButton()) {
        console.log(`Processing button: ${interaction.customId}`);

        // Only defer reply if not already replied to
        if (
          !interaction.replied &&
          !interaction.deferred &&
          interaction.customId !== "payment_button"
        ) {
          await interaction.deferReply({ ephemeral: true });
        }

        switch (interaction.customId) {
          case "boost_button":
            await handleBoostButton(interaction);
            break;
          case "cancel_take": // Keep for backward compatibility
            await handleCancelTakeButton(interaction);
            break;
          case "delete_button":
            await handleDeleteButton(interaction);
            break;
          case "payment_button":
            await payment(interaction);
            break;
          default:
            if (
              interaction.customId.startsWith("role_") ||
              interaction.customId === "reject_application"
            ) {
              await handleButton(interaction);
            }
        }

        return;
      }
    } catch (error) {
      console.error("Error handling interaction:", error);
      try {
        // Only reply or followUp if not already handled
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "There was an error processing your request.",
            ephemeral: true,
          });
        } else if (!interaction.replied) {
          await interaction.followUp({
            content: "There was an error processing your request.",
            ephemeral: true,
          });
        }
      } catch (replyError) {
        console.error("Error sending error message:", replyError);
      }
    }
  },
};
