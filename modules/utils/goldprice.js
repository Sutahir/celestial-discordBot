const { connectToGoogleSheets } = require("./sheet");
require("dotenv").config();
const goldprice = async (interaction) => {
  await interaction.deferReply({ ephemeral: true });
  const message = interaction.options.getString("message");
  if (!message) {
    await interaction.reply({
      content: "You must provide a message to send!",
      ephemeral: true,
    });
    return;
  }
  const sheets = await connectToGoogleSheets();
  const range = "Bot Check!B1";
  await sheets.spreadsheets.values.update({
    spreadsheetId: "1h-DyYpLCcxJUVE19mliHzCfiepV3ZyEFoQ881IIf4p8",
    range,
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [[message]],
    },
  });

  await interaction.editReply({
    content: "Message added to sheet",
    ephemeral: true,
  });
};
module.exports = { goldprice };
