const { InteractionType } = require("discord.js");

const handler = async (interaction) => {
  try {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const errorResponse = {
        content: "There was an error executing this command!",
        flags: 1 << 6, // This is the flag for ephemeral messages
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorResponse);
      } else {
        await interaction.reply(errorResponse);
      }
    }
  } catch (error) {
    console.error("Error in interaction handler:", error);
  }
};

module.exports = { handler };
