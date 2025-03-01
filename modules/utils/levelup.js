const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");
const { v4: uuidv4 } = require("uuid");
const { getCurrentTimestamp } = require("./sheet");
const { CONFIG } = require("./config");
const clickedUsers = new Set();
const boostProcesses = new Map();
const selectionInProgress = new Set(); // To track if selection process is in progress for a boost

// Renamed function to handle both levelup and boost commands
const handleLevelupCommand = async (interaction) => {
  try {
    console.log(`Processing levelup command for ${interaction.user.tag}`);

    const member = interaction.guild.members.cache.get(interaction.user.id);
    if (!member.roles.cache.has(CONFIG.roles.admin)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    const title = interaction.options.getString("title");
    const price = interaction.options.getString("price");
    const note = interaction.options.getString("note");
    const currency = interaction.options.getString("currency") || "gold"; // Default to gold if not specified

    const boostId = interaction.id;

    console.log(
      `Levelup command parameters: title=${title}, price=${price}, currency=${currency}, note=${note}`
    );

    // Add data to the tracker spreadsheet
    try {
      // Format data for tracker spreadsheet
      const trackerData = [
        getCurrentTimestamp(), // Date
        interaction.user.id, // Discord ID
        title, // Name-Realm
        price, // Amount
        CONFIG.categories.levelup, // Category "LevelUp"
        "Pending", // Status
        member.displayName, // Who Paid?
      ];

      // Submit to tracker
      console.log(`Added levelup data to tracker: ${title}, ${price}`);
    } catch (error) {
      console.error("Error adding to tracker:", error);
      // Continue with the command even if tracker update fails
    }

    // Create row with a single toggle button plus admin delete
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("boost_button")
        .setLabel("Take / Cancel")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("delete_button")
        .setLabel("Adv cancel")
        .setStyle(ButtonStyle.Danger)
    );

    // Create a color based on payment type
    const embedColor = currency === "gold" ? 0xffd700 : 0x4169e1; // Gold color for gold, Blue for toman

    const embed = new EmbedBuilder()
      .setTitle("Level-up Information")
      .setDescription(
        `Please DM <@${member.id}> for more details.\n\nHere are the level-up details:`
      )
      .setColor(embedColor)
      .addFields(
        { name: "Title", value: title, inline: true },
        {
          name: "Price",
          value: `${price} (${currency.toUpperCase()})`,
          inline: true,
        },
        { name: "Note", value: note, inline: false },
        { name: "Boost ID", value: boostId },
        { name: "Participants", value: "No one has signed up yet" }
      )
      .setFooter({ text: "Level-up Request" });

    boostProcesses.set(boostId, {
      participants: [],
      timeoutId: null,
      title,
      price,
      currency,
      note,
      originalMessage: null,
    });

    console.log("Sending reply for levelup command");
    const message = await interaction.reply({
      content: `### Level-up Information (${currency.toUpperCase()} Payment)`,
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    console.log("Reply sent, storing message reference");
    boostProcesses.get(boostId).originalMessage = message;
    console.log("Levelup command completed successfully");
  } catch (error) {
    console.error("Error in handleLevelupCommand:", error);

    // Ensure we always respond to the interaction
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          "There was an error processing your request. Please try again.",
        ephemeral: true,
      });
    } else if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({
        content:
          "There was an error processing your request. Please try again.",
      });
    }
  }
};

// Keep the original function for backwards compatibility
const handleBoostCommand = handleLevelupCommand;

const handleBoostButton = async (interaction) => {
  try {
    console.log(`Boost button clicked by ${interaction.user.tag}`);

    const member = interaction.guild.members.cache.get(interaction.user.id);
    const message = interaction.message;
    const embed = message.embeds[0];

    const boostId = embed.fields.find(
      (field) => field.name === "Boost ID"
    ).value;
    console.log(`Processing boost button for ID: ${boostId}`);

    const boostProcess = boostProcesses.get(boostId);
    if (!boostProcess) {
      return interaction.editReply({
        content: "This boost is no longer available.",
        ephemeral: true,
      });
    }

    // Check if user is already a participant
    const participantIndex = boostProcess.participants.indexOf(
      interaction.user.id
    );
    const isAlreadyParticipant = participantIndex !== -1;

    if (isAlreadyParticipant) {
      // REMOVE USER - User is already participating, so remove them
      boostProcess.participants.splice(participantIndex, 1);

      // Only show count instead of listing users
      const updatedParticipants =
        boostProcess.participants.length > 0
          ? `${boostProcess.participants.length} booster(s) signed up`
          : "No one has signed up yet";

      // Get payment type from boostProcess
      const payment = boostProcess.currency || "gold";

      // Update embed with new participants
      const updatedEmbed = EmbedBuilder.from(embed).setFields(
        { name: "Title", value: boostProcess.title, inline: true },
        { name: "Price", value: boostProcess.price, inline: true },
        {
          name: "Payment",
          value: payment === "gold" ? "Gold" : "Toman",
          inline: true,
        },
        { name: "Note", value: boostProcess.note, inline: false },
        { name: "Boost ID", value: boostId },
        { name: "Participants", value: updatedParticipants }
      );

      await message.edit({ embeds: [updatedEmbed] });
      console.log(`Removed user ${interaction.user.tag} from participants`);

      await interaction.editReply({
        content: `You have been removed from the boost`,
        ephemeral: true,
      });
    } else {
      // ADD USER - User is not participating, so add them
      if (clickedUsers.has(interaction.user.id)) {
        return interaction.editReply({
          content: "You have already signed up for a boost. Please wait.",
          ephemeral: true,
        });
      }

      // Add user to participants
      boostProcess.participants.push(interaction.user.id);

      // Only show count instead of listing users
      const updatedParticipants = `${boostProcess.participants.length} booster(s) signed up`;

      console.log(`User ${interaction.user.tag} added to participants`);

      // Get payment type from boostProcess
      const payment = boostProcess.currency || "gold";

      // Update embed with new participants
      const updatedEmbed = EmbedBuilder.from(embed).setFields(
        { name: "Title", value: boostProcess.title, inline: true },
        { name: "Price", value: boostProcess.price, inline: true },
        {
          name: "Payment",
          value: payment === "gold" ? "Gold" : "Toman",
          inline: true,
        },
        { name: "Note", value: boostProcess.note, inline: false },
        { name: "Boost ID", value: boostId },
        { name: "Participants", value: updatedParticipants }
      );

      await message.edit({ embeds: [updatedEmbed] });
      console.log(`Updated message with new participants`);

      await interaction.editReply({
        content: `You have signed up for the boost`,
        ephemeral: true,
      });

      // Set a timeout to select a booster if not already in progress
      if (!boostProcess.timeoutId && !selectionInProgress.has(boostId)) {
        selectionInProgress.add(boostId); // Mark selection as in progress
        const selectMessage = await interaction.channel.send({
          content: `Selecting a booster in 10 seconds!`,
        });

        boostProcess.timeoutId = setTimeout(async () => {
          try {
            const participantIds = boostProcess.participants;
            if (participantIds.length === 0) {
              await selectMessage.edit({
                content: "No one signed up for the boost.",
              });
              // Reset the timeout and selection status so it can restart when someone signs up
              boostProcess.timeoutId = null;
              selectionInProgress.delete(boostId);
              return;
            }

            // Randomly select a member
            const randomIndex = Math.floor(
              Math.random() * participantIds.length
            );
            const selectedUserId = participantIds[randomIndex];
            const selectedMember = await interaction.guild.members.fetch(
              selectedUserId
            );

            if (!selectedMember) {
              await selectMessage.edit({
                content: "Could not find the selected member.",
              });
              return;
            }

            // Update the message

            // Get payment type from boostProcess
            const payment = boostProcess.currency || "gold";

            // Create a dedicated channel for this boost
            const channelName = `levelup-${boostId}`;
            const boostChannel = await interaction.guild.channels.create({
              name: channelName,
              type: 0, // Text channel
              parent: "1264685805293535313",
              permissionOverwrites: [
                {
                  id: interaction.guild.id, // @everyone role
                  deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                  id: selectedUserId, // Winner
                  allow: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                  id: interaction.user.id, // Interaction initiator
                  allow: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                  id: CONFIG.roles.admin, // Admin role
                  allow: [PermissionsBitField.Flags.ViewChannel],
                },
              ],
            });

            // Get the booster creator ID
            const boostCreatorId = embed.description.match(/<@(\d+)>/)[1];
            const boostCreator = await interaction.guild.members.fetch(
              boostCreatorId
            );

            // Update permissions if creator is different from interaction user
            if (boostCreatorId !== interaction.user.id) {
              await boostChannel.permissionOverwrites.create(boostCreatorId, {
                ViewChannel: true,
                ReadMessageHistory: true,
                SendMessages: true,
              });
            }

            // Create payment button
            const paymentRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("payment_button")
                .setLabel("Process Payment")
                .setStyle(ButtonStyle.Success)
            );

            // Send the embed to the new channel with payment button
            const boostEmbed = new EmbedBuilder()
              .setTitle("Boost Information")
              .setDescription(`Here are the boost details:`)
              .setColor(payment === "gold" ? 0xffd700 : 0x4169e1)
              .addFields(
                {
                  name: "Title",
                  value: embed.fields.find((field) => field.name === "Title")
                    .value,
                  inline: true,
                },
                {
                  name: "Price",
                  value: embed.fields.find((field) => field.name === "Price")
                    .value,
                  inline: true,
                },
                {
                  name: "Payment",
                  value: payment === "gold" ? "Gold" : "Toman",
                  inline: true,
                },
                {
                  name: "Note",
                  value: embed.fields.find((field) => field.name === "Note")
                    .value,
                  inline: false,
                },
                {
                  name: "Boost ID",
                  value: embed.fields.find((field) => field.name === "Boost ID")
                    .value,
                },
                {
                  name: "Selected Booster",
                  value: `<@${selectedMember.id}>`,
                }
              )
              .setFooter({ text: "Boost Request" });

            await boostChannel.send({
              content: `## Boost Channel\nBooster: <@${selectedMember.id}>\nRequester: <@${boostCreatorId}>`,
              embeds: [boostEmbed],
              components: [paymentRow],
            });

            // Notify both parties about the new channel
            const channelLink = `<#${boostChannel.id}>`;
            await selectMessage.edit({
              content: `Please check ${channelLink} for details.`,
            });
            // Notify the boost creator in DM
            await boostCreator.send({
              content: `Your boost request has been picked up by <@${selectedMember.id}>.\n\nA dedicated channel has been created for this boost: ${channelLink}`,
              embeds: [boostEmbed],
            });

            // Notify the selected member in DM
            await selectedMember.send({
              content: `Congratulations! You have been selected for the boost.\n\nA dedicated channel has been created for this boost: ${channelLink}`,
              embeds: [boostEmbed],
            });

            // Update the original message in the main channel
            interaction.message.edit({ components: [] });
            boostProcesses.delete(boostId);
            selectionInProgress.delete(boostId); // Remove from in-progress set
          } catch (error) {
            console.error("Error in boost selection:", error);
            selectionInProgress.delete(boostId);
            boostProcess.timeoutId = null;
          }
        }, 10000);
      }
    }
  } catch (error) {
    console.error("Error in handleBoostButton:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          "There was an error processing your request. Please try again.",
        ephemeral: true,
      });
    } else if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({
        content:
          "There was an error processing your request. Please try again.",
      });
    }
  }
};

const handleCancelTakeButton = async (interaction) => {
  try {
    console.log(`Cancel take button clicked by ${interaction.user.tag}`);

    const member = interaction.guild.members.cache.get(interaction.user.id);
    if (!member.roles.cache.has("1254199439602675772")) {
      return interaction.editReply({
        content: "You do not have permission to use this button.",
        ephemeral: true,
      });
    }

    const message = interaction.message;
    const embed = message.embeds[0];

    const boostId = embed.fields.find(
      (field) => field.name === "Boost ID"
    ).value;
    console.log(`Processing cancel take for boost ID: ${boostId}`);

    const boostProcess = boostProcesses.get(boostId);
    if (!boostProcess) {
      return interaction.editReply({
        content: "This boost is no longer available.",
        ephemeral: true,
      });
    }

    // Check if user is in participants
    const index = boostProcess.participants.indexOf(interaction.user.id);
    if (index !== -1) {
      // Remove user from participants
      boostProcess.participants.splice(index, 1);

      // Get payment type from boostProcess
      const payment = boostProcess.currency || "gold";

      // Only show count instead of listing users
      const updatedParticipants =
        boostProcess.participants.length > 0
          ? `${boostProcess.participants.length} booster(s) signed up`
          : "No one has signed up yet";

      // Update embed with new participants
      const updatedEmbed = EmbedBuilder.from(embed).setFields(
        { name: "Title", value: boostProcess.title, inline: true },
        { name: "Price", value: boostProcess.price, inline: true },
        {
          name: "Payment",
          value: payment === "gold" ? "Gold" : "Toman",
          inline: true,
        },
        { name: "Note", value: boostProcess.note, inline: false },
        { name: "Boost ID", value: boostId },
        { name: "Participants", value: updatedParticipants }
      );

      await message.edit({ embeds: [updatedEmbed] });
      console.log(`Updated message after removing participant`);

      await interaction.reply({
        content: `You have been removed from the boost`,
        ephemeral: true,
      });
    } else {
      await interaction.editReply({
        content: `You were not signed up for this boost.`,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("Error in handleCancelTakeButton:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.editReply({
        content:
          "There was an error processing your request. Please try again.",
        ephemeral: true,
      });
    } else if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({
        content:
          "There was an error processing your request. Please try again.",
      });
    }
  }
};

const handleDeleteButton = async (interaction) => {
  try {
    console.log(`Delete button clicked by ${interaction.user.tag}`);

    const member = interaction.guild.members.cache.get(interaction.user.id);
    if (!member.roles.cache.has("1254054223046508604")) {
      return interaction.reply({
        content: "You do not have permission to use this button.",
        ephemeral: true,
      });
    }

    const message = interaction.message;
    const embed = message.embeds[0];

    const boostId = embed.fields.find(
      (field) => field.name === "Boost ID"
    ).value;
    console.log(`Processing delete for boost ID: ${boostId}`);

    const boostProcess = boostProcesses.get(boostId);
    if (boostProcess && boostProcess.timeoutId) {
      clearTimeout(boostProcess.timeoutId);
    }

    // Get payment type from boostProcess or embed
    const paymentField = embed.fields.find((field) => field.name === "Payment");
    const payment =
      boostProcess?.currency ||
      (paymentField
        ? paymentField.value === "Gold"
          ? "gold"
          : "toman"
        : "gold");

    // Update participant status in spreadsheet
    try {
      // Format data for payment tab
      const paymentData = [
        new Date().toISOString(), // ID
        "", // Amount
        "", // Price
        "", // Final Amount
        embed.fields.find((field) => field.name === "Title").value, // User
        new Date().toISOString(), // Submit Date
        interaction.user.id, // Discord ID
        "", // Card Number
        "", // IBAN
        "", // Name
        "", // Phone
        "", // Payment Duration
        "Level-up", // Game
        "Cancelled by admin", // Note
        "Cancelled", // Status
        member.displayName, // Who Cancelled
      ];

      // Update payment records
      console.log("Payment records updated for cancelled boost");
    } catch (error) {
      console.error("Error updating payment record:", error);
      // Continue with deletion even if payment update fails
    }

    // Create a cancelled embed
    const cancelledEmbed = new EmbedBuilder()
      .setTitle("Boost Cancelled")
      .setDescription(
        `Please DM <@${
          embed.description.match(/<@(\d+)>/)[1]
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
          name: "Payment",
          value: payment === "gold" ? "Gold" : "Toman",
          inline: true,
        },
        {
          name: "Note",
          value: embed.fields.find((field) => field.name === "Note").value,
          inline: false,
        },
        {
          name: "Boost ID",
          value: embed.fields.find((field) => field.name === "Boost ID").value,
        },
        {
          name: "Status",
          value: "Cancelled",
        }
      )
      .setFooter({ text: "Boost Request" });

    await message.edit({ embeds: [cancelledEmbed], components: [] });
    console.log("Updated message with cancellation embed");

    await interaction.reply({
      content: "Boost has been deleted successfully.",
      ephemeral: true,
    });

    boostProcesses.delete(boostId);
  } catch (error) {
    console.error("Error in handleDeleteButton:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          "There was an error processing your request. Please try again.",
        ephemeral: true,
      });
    } else if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({
        content:
          "There was an error processing your request. Please try again.",
      });
    }
  }
};

module.exports = {
  handleBoostCommand,
  handleLevelupCommand,
  handleBoostButton,
  handleCancelTakeButton,
  handleDeleteButton,
};
