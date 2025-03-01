const { getCurrentTimestamp } = require("./sheet");
const { appendSheetData } = require("./sheet");
const { EmbedBuilder, Colors } = require("discord.js");
const crypto = require("crypto"); // Fix: Correctly import crypto without destructuring
const add = async (interaction) => {
  const namerealm = interaction.options.getString("namerealm");
  let amount = interaction.options.getString("amount");
  const note = interaction.options.getString("note");
  const user = interaction.options.getUser("user");
  const id = crypto.randomBytes(16).toString("hex"); // Fix: Ensure crypto is used correctly
  const { CONFIG } = require("./config");
  const timestamp = await getCurrentTimestamp();

  // Check if amount is a pure number, if not replace non-integer characters
  amount = parseFloat(amount.replace(/[^\d.-]/g, "")) || 0;
  amount *= 1000; // Multiply by 1000

  const data = [
    timestamp,
    user.id,
    namerealm,
    amount,
    note,
    "Others",
    interaction.user.username,
    id,
    "Pending",
  ];
  await appendSheetData(`${CONFIG.sheets.ranges.tracker}A1`, [data]);
  await interaction.reply({
    content: `Added ${amount} to ${namerealm}`,
  });
  user.send({
    content: `New payment added to your account`,
    embeds: [
      new EmbedBuilder()
        .setTitle("Added to tracker")
        .setDescription(`Added ${amount} to ${namerealm}`)
        .setColor(Colors.Green),
    ],
  });
};

module.exports = { add };
