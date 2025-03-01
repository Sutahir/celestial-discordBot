const handleButton = async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, value] = interaction.customId.split("_");
  const member = interaction.message.mentions.users.first();

  if (!member) {
    await interaction.reply({
      content: "Could not find the user.",
      ephemeral: true,
    });
    return;
  }

  const guildMember = await interaction.guild.members.fetch(member.id);

  if (action === "role") {
    // Add the base role
    await guildMember.roles.add("1342463404778065940");

    // Add the specific role based on button pressed
    const roleMap = {
      3500: "1300843433774153789",
      3400: "1254443951004454942",
      3300: "1302240179670749214",
      3200: "1301951462032801904",
      3100: "1302240266450636840",
      3000: "1254217511507857429",
      2900: "1302240333639192618",
      2800: "1301946977956921456",
    };

    const roleId = roleMap[value];
    if (roleId) {
      await guildMember.roles.add(roleId);
      await interaction.editReply(
        `Assigned roles to ${member}:\n- Base Role\n- ${value}+ Rating Role`
      );
      await member.send(`You have been assigned the requested roles!`);
    }

    // Disable all buttons after use
    const message = interaction.message;
    const components = message.components.map((row) => {
      const newRow = row.toJSON();
      newRow.components = newRow.components.map((button) => {
        button.disabled = true;
        return button;
      });
      return newRow;
    });

    await message.edit({ components });
  }

  if (action === "reject") {
    await interaction.editReply(`Application for ${member} has been rejected.`);
    await member.send(
      "Your application has been rejected. Please try again later."
    );

    // Disable all buttons after rejection
    const message = interaction.message;
    const components = message.components.map((row) => {
      const newRow = row.toJSON();
      newRow.components = newRow.components.map((button) => {
        button.disabled = true;
        return button;
      });
      return newRow;
    });

    await message.edit({ components });
  }
};

module.exports = { handleButton };
