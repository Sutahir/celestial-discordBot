const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");
const { v4: uuidv4 } = require("uuid");

const clickedUsers = new Set();
const boostProcesses = new Map();
const selectionInProgress = new Set(); // To track if selection process is in progress for a boost

const handleBoostCommand = async (interaction) => {
  const member = interaction.guild.members.cache.get(interaction.user.id);
  if (!member.roles.cache.has("1254054223046508604")) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
  }

  const title = interaction.options.getString("title");
  const price = interaction.options.getString("price");
  const note = interaction.options.getString("note");

  const boostId = await interaction.id;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("boost_button")
      .setLabel("Take")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("cancel_take")
      .setLabel("Cancel Take")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("delete_button")
      .setLabel("Adv cancel")
      .setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setTitle("Boost Information")
    .setDescription(
      `Please DM <@${member.id}> for more details.\n\nHere are the boost details:`
    )
    .setColor(0x808080) // Default color
    .addFields(
      { name: "Title", value: title, inline: true },
      { name: "Price", value: price, inline: true },
      { name: "Note", value: note },
      { name: "Boost ID", value: boostId },
      { name: "Author ID", value: member.id.toString() },
      { name: "Signed Up Users", value: "None" } // Initial value for signed up users
    )
    .setThumbnail(
      "https://cdn.discordapp.com/icons/1219645545115680888/a_3a497a72fc59e5dae8fb47115469b268.webp?size=160"
    ) // Add a thumbnail URL
    .setTimestamp() // Add a timestamp
    .setFooter({ text: "Boost Request" });

  boostProcesses.set(boostId, {
    interaction: interaction,
    authorId: member.id,
    embed: embed,
    row: row,
    timeoutId: null,
    signedUpUsers: new Set(), // Initialize a set to store signed up user IDs
  });

  const targetChannelID = interaction.channelId;
  console.log(`Target Channel ID: ${targetChannelID}`); // Log the target channel ID for debugging

  let role = "";
  switch (targetChannelID) {
    case "1226857496002560000":
      role = "<@&1226857982785228811>";
      console.log("Case 1 matched");
      break;
    case "1231895240550518887":
      role = "<@&1234045053127888906>";
      console.log("Case 2 matched");
      break;
    case "1253360321821671506":
      role = "<@&1231894584003657748>";
      console.log("Case 3 matched");
      break;
    case "1234092213604978749":
      role = "<@&1231894584003657748>";
      console.log("Case 4 matched");
      break;
    case "1248692942072189020":
      role = "<@&1248595346146463814>";
      console.log("Case 5 matched");
      break;
    default:
      role = "";
      console.log("Default case matched");
  }

  console.log(`Assigned Role: ${role}`);

  await interaction.reply({
    content: `### Boost Information`,
    embeds: [embed],
    components: [row],
  });
  await interaction.channel.send({
    content: `@everyone ${role}`,
  });
};

const handleBoostButton = async (interaction) => {
  const message = await interaction.channel.messages.fetch(
    interaction.message.id
  );
  const embed = message.embeds[0];
  if (!embed) {
    return interaction.editReply({
      content: "Error: Embed not found.",
      ephemeral: true,
    });
  }

  const boostId = embed.fields.find(
    (field) => field.name === "Boost ID"
  )?.value;

  if (!clickedUsers.has(interaction.user.id)) {
    clickedUsers.add(interaction.user.id);
    const userList = Array.from(clickedUsers)
      .map((userId) => `<@${userId}>`)
      .join(", ");

    // Update signed up users field in the original embed
    embed.fields.find(
      (field) => field.name === "Signed Up Users"
    ).value = `${clickedUsers.size} user(s) have signed up (hidden)`;

    await message.edit({
      embeds: [embed],
    });

    await interaction.editReply({
      content: `You have signed up for the boost`,
    });

    const boostProcess = boostProcesses.get(boostId);
    if (!boostProcess.timeoutId && !selectionInProgress.has(boostId)) {
      selectionInProgress.add(boostId); // Mark selection as in progress

      await interaction.channel.send({
        content: `Selecting a booster in 10 seconds!`,
      });

      boostProcess.timeoutId = setTimeout(async () => {
        if (clickedUsers.size > 0) {
          const randomUserId =
            Array.from(clickedUsers)[
              Math.floor(Math.random() * clickedUsers.size)
            ];
          const selectedMember = await interaction.guild.members.fetch(
            randomUserId
          );
          const userList = Array.from(clickedUsers)
            .map((userId) => `<@${userId}>`)
            .join(", ");

          if (selectedMember) {
            const authorId = embed.fields.find(
              (field) => field.name === "Author ID"
            ).value;
            const authorMember = await interaction.guild.members.fetch(
              authorId
            );

            const updaterow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("payment")
                .setLabel("Payment")
                .setStyle(ButtonStyle.Primary)
            );

            const authorMessage = {
              content: `Your boost request has been picked up by <@${selectedMember.id}>.\n\nPlease coordinate with them for further details.`,
              embeds: [
                new EmbedBuilder()
                  .setTitle("Boost Information")
                  .setDescription(`Here are the boost details:`)
                  .setColor(0x00ff00)
                  .addFields(
                    {
                      name: "Title",
                      value: embed.fields.find(
                        (field) => field.name === "Title"
                      ).value,
                      inline: true,
                    },
                    {
                      name: "Price",
                      value: embed.fields.find(
                        (field) => field.name === "Price"
                      ).value,
                      inline: true,
                    },
                    {
                      name: "Note",
                      value: embed.fields.find((field) => field.name === "Note")
                        .value,
                    },
                    {
                      name: "Boost ID",
                      value: embed.fields.find(
                        (field) => field.name === "Boost ID"
                      ).value,
                    }
                  )
                  .setThumbnail(
                    "https://cdn.discordapp.com/icons/1219645545115680888/a_3a497a72fc59e5dae8fb47115469b268.webp?size=160"
                  )
                  .setTimestamp()
                  .setFooter({ text: "Boost Update" }),
              ],
            };
            await authorMember.send(authorMessage);

            await message.edit({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Boost Completed")
                  .setDescription(
                    `Please DM <@${
                      embed.fields.find((field) => field.name === "Author ID")
                        .value
                    }> for more details.\n\nHere are the boost details:`
                  )
                  .setColor(0x00ff00)
                  .addFields(
                    {
                      name: "Title",
                      value: embed.fields.find(
                        (field) => field.name === "Title"
                      ).value,
                      inline: true,
                    },
                    {
                      name: "Price",
                      value: embed.fields.find(
                        (field) => field.name === "Price"
                      ).value,
                      inline: true,
                    },
                    {
                      name: "Note",
                      value: embed.fields.find((field) => field.name === "Note")
                        .value,
                    },
                    {
                      name: "Boost ID",
                      value: embed.fields.find(
                        (field) => field.name === "Boost ID"
                      ).value,
                    }
                  )
                  .setThumbnail(
                    "https://cdn.discordapp.com/icons/1219645545115680888/a_3a497a72fc59e5dae8fb47115469b268.webp?size=160"
                  )
                  .setTimestamp()
                  .setFooter({ text: "Boost Request" }),
              ],
              components: [],
            });

            const targetChannel = await message.guild.channels.create({
              name: `${
                embed.fields.find((field) => field.name === "Title").value
              }-${selectedMember.displayName}-${
                embed.fields.find((field) => field.name === "Boost ID").value
              }`,
              type: 0,
              parent: "1264685805293535313", // 0 is for text channels in Discord.js v14
              permissionOverwrites: [
                {
                  id: message.guild.id, // Default permissions for everyone
                  deny: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                  ],
                },
                {
                  id: selectedMember.id, // Permissions for the specified role
                  allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks,
                  ],
                },
              ],
            });
            if (targetChannel) {
              await targetChannel.send({
                content: `Boost picked by <@${selectedMember.id}>`,
                embeds: [
                  new EmbedBuilder()
                    .setTitle("Boost Picked")
                    .setDescription(`Original Message: [Link](${message.url})`)
                    .setColor(0x00ff00)
                    .addFields(
                      {
                        name: "Title",
                        value: embed.fields.find(
                          (field) => field.name === "Title"
                        ).value,
                        inline: true,
                      },
                      {
                        name: "Price",
                        value: embed.fields.find(
                          (field) => field.name === "Price"
                        ).value,
                        inline: true,
                      },
                      {
                        name: "Note",
                        value: embed.fields.find(
                          (field) => field.name === "Note"
                        ).value,
                      },
                      {
                        name: "Boost ID",
                        value: embed.fields.find(
                          (field) => field.name === "Boost ID"
                        ).value,
                      },

                      {
                        name: "Selected Booster",
                        value: selectedMember.id, // Include signed up users in the announcement
                      }
                    )
                    .setThumbnail(
                      "https://cdn.discordapp.com/icons/1219645545115680888/a_3a497a72fc59e5dae8fb47115469b268.webp?size=160"
                    )
                    .setTimestamp()
                    .setFooter({ text: "Boost Update" }),
                ],
                components: [updaterow],
              });
            }
            await targetChannel.send(
              `# قبل از هر کار اگر اسم کاراکترنون اشتباه هست به چنل زیر برین و اونو فیکس کنین\n<#1302037046625570937>`
            );
            await interaction.channel.send({
              content: ` ${targetChannel} has been created for you.`,
            });
            const selectMessage = {
              content: `Congratulations! You have been selected for the boost.\n\n## Please check ${targetChannel} for more details.`,
              embeds: [
                new EmbedBuilder()
                  .setTitle("Boost Information")
                  .setDescription(`Here are boost detail:`)
                  .setColor(0x00ff00)
                  .addFields(
                    {
                      name: "Title",
                      value: embed.fields.find(
                        (field) => field.name === "Title"
                      ).value,
                      inline: true,
                    },
                    {
                      name: "Price",
                      value: embed.fields.find(
                        (field) => field.name === "Price"
                      ).value,
                      inline: true,
                    },
                    {
                      name: "Note",
                      value: embed.fields.find((field) => field.name === "Note")
                        .value,
                    },
                    {
                      name: "Boost ID",
                      value: embed.fields.find(
                        (field) => field.name === "Boost ID"
                      ).value,
                    }
                  )
                  .setThumbnail(
                    "https://cdn.discordapp.com/icons/1219645545115680888/a_3a497a72fc59e5dae8fb47115469b268.webp?size=160"
                  )
                  .setTimestamp()
                  .setFooter({ text: "Boost Assigned" }),
              ],
            };
            await selectedMember.send(selectMessage);

            clickedUsers.clear();
            boostProcesses.delete(boostId);
            selectionInProgress.delete(boostId); // Remove from in-progress set
          }
        } else {
          selectionInProgress.delete(boostId); // Mark selection as in progress
          boostProcess.timeoutId = null;
        }
      }, 10000);
    }
  } else {
    await interaction.editReply({
      content: `You have already signed up for this boost.`,
    });
  }
};

const handleCancelTakeButton = async (interaction) => {
  const message = await interaction.channel.messages.fetch(
    interaction.message.id
  );
  const embed = message.embeds[0];
  if (!embed) {
    return interaction.editReply({
      content: "Error: Embed not found.",
      ephemeral: true,
    });
  }

  const boostId = embed.fields.find(
    (field) => field.name === "Boost ID"
  )?.value;

  if (clickedUsers.has(interaction.user.id)) {
    clickedUsers.delete(interaction.user.id);
    const userList =
      Array.from(clickedUsers)
        .map((userId) => `<@${userId}>`)
        .join(", ") || "None";

    // Update signed up users field in the original embed
    embed.fields.find(
      (field) => field.name === "Signed Up Users"
    ).value = `${clickedUsers.size} user(s) have signed up (hidden)`;

    await message.edit({
      embeds: [embed],
    });

    await interaction.editReply({
      content: `You have been removed from the boost`,
    });
  } else {
    await interaction.editReply({
      content: `You were not signed up for this boost.`,
    });
  }
};

const handleDeleteButton = async (interaction) => {
  const message = await interaction.channel.messages.fetch(
    interaction.message.id
  );
  const embed = message.embeds[0];
  if (!embed) {
    return interaction.editReply({
      content: "Error: Embed not found.",
      ephemeral: true,
    });
  }

  const boostId = embed.fields.find(
    (field) => field.name === "Boost ID"
  )?.value;
  const authorId = embed.fields.find(
    (field) => field.name === "Author ID"
  )?.value;

  if (authorId === interaction.user.id) {
    const boostProcess = boostProcesses.get(boostId);
    if (boostProcess && boostProcess.timeoutId) {
      clearTimeout(boostProcess.timeoutId);
    }

    await message.edit({ components: [] });

    await message.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle("Boost Cancelled")
          .setDescription(
            `Please DM <@${
              embed.fields.find((field) => field.name === "Author ID").value
            }> for more details.\n\nHere are the boost details:`
          )
          .setColor(0xff0000)
          .addFields(
            {
              name: "Title",
              value: embed.fields.find((field) => field.name === "Title").value,
              inline: true,
            },
            {
              name: "Price",
              value: embed.fields.find((field) => field.name === "Price").value,
              inline: true,
            },
            {
              name: "Note",
              value: embed.fields.find((field) => field.name === "Note").value,
            },
            {
              name: "Boost ID",
              value: embed.fields.find((field) => field.name === "Boost ID")
                .value,
            },
            {
              name: "Signed Up Users",
              value: embed.fields.find(
                (field) => field.name === "Signed Up Users"
              ).value,
            }
          )
          .setThumbnail(
            "https://cdn.discordapp.com/icons/1219645545115680888/a_3a497a72fc59e5dae8fb47115469b268.webp?size=160"
          )
          .setTimestamp()
          .setFooter({ text: "Boost Request" }),
      ],
    });

    await interaction.editReply({
      content: "Boost has been deleted successfully.",
    });

    clickedUsers.clear();
    boostProcesses.delete(boostId);
    selectionInProgress.delete(boostId); // Remove from in-progress set
  } else {
    await interaction.editReply({
      content: "You are not authorized to delete this boost.",
    });
  }
};

module.exports = {
  handleBoostCommand,
  handleBoostButton,
  handleCancelTakeButton,
  handleDeleteButton,
};
