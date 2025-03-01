require("dotenv").config(); // Import dotenv to load environment variables
const {
  PermissionsBitField,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");

const mplus = async (interaction) => {
  const armorType = interaction.options.getString("armor_type");
  const title = interaction.options.getString("title");
  const price = interaction.options.getString("price");
  const boostercut = interaction.options.getString("boostercut");
  const note = interaction.options.getString("note")||"None";
  const paymentType = interaction.options.getString("payment_type");

  console.log(armorType, title, price, note, paymentType);

  // Calculate booster cut

  const roleLevels = [
    { level: 6, roleID: "1301946977956921456" },
    { level: 8, roleID: "1254217511507857429" },
    { level: 10, roleID: "1301951462032801904" },
    { level: 13, roleID: "1254443951004454942" },
    { level: 20, roleID: "1300843433774153789" },
  ];
  const runRegex = /^(1[0-5]|[1-9])x(3[0]|[12]?[0-9])$/;
  if (!runRegex.test(title)) {
    return interaction.reply(`Invalid run detail: ${title}`);
  }
  const [runAmount, runLevel] = title.split("x").map(Number);

  // Determine applicable roles for the current runLevel
  const applicableRoles = roleLevels
    .filter((role) => runLevel <= role.level)
    .map((role) => role.roleID);

  // Create the channel with permissions for all applicable roles
  const targetChannel = await interaction.guild.channels.create({
    name: `${armorType}-${title}`,
    type: ChannelType.GuildText, // Correct channel type
    parent: "1264685805293535313",
    permissionOverwrites: [
      {
        id: interaction.guild.id, // Default permissions for everyone
        deny: [PermissionsBitField.Flags.SendMessages],
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.ReadMessageHistory,
        ],
      },
      ...applicableRoles.map((roleID) => ({
        id: roleID,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.EmbedLinks,
        ],
      })),
    ],
  });

  // Create the role mentions string
  const roleMentions = applicableRoles
    .map((roleID) => `<@&${roleID}>`)
    .join(" ");

  // Create and send the embed as before
  const embed = new EmbedBuilder()
    .setColor(0x00ae86)
    .setTitle("Mythic Plus Boost Details")
    .addFields(
      { name: "Armor Type", value: armorType, inline: true },
      { name: "Run Detail", value: title, inline: true },
      { name: "Booster Cut", value: boostercut, inline: true },
      { name: "Payment Type", value: paymentType, inline: true },
      { name: "Notes", value: note || "No additional notes", inline: false }
    )
    .setTimestamp()
    .setFooter({ text: "Boost request created" });

  // Send the embed and content to the created channel
  await interaction.reply(`${targetChannel} has been created for you!`);
  await targetChannel.send({ embeds: [embed] });
  await targetChannel.send({
    content: `${roleMentions}\n**Armor Type:** ${armorType}\n${
      note ? `# **Notes:** ${note}` : ""
    }\n\nFor rank and tagging, refer to <#1231657838863192136>.`,
  });
};

module.exports = { mplus };
