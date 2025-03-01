const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  InteractionType,
} = require("discord.js");
const { addvalue, getCurrentTimestamp } = require("../utils/submit");

const payment = async (interaction) => {
  try {
    // Fetch the message from the channe
    const usermember = interaction.guild.members.cache.get(interaction.user.id);
    if (!usermember.roles.cache.has("1231894640802791424")) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    const message = await interaction.channel.messages.fetch(
      interaction.message.id
    );

    // Extract fields from the message embed
    const embedFields = message.embeds[0].fields;
    let titleFieldValue = "";
    let priceFieldValue = "";
    let boostIdFieldValue = "";
    let selectedBoosterFieldValue = "";

    embedFields.forEach((field) => {
      switch (field.name) {
        case "Title":
          titleFieldValue = field.value;
          break;
        case "Price":
          priceFieldValue = field.value;
          break;
        case "Boost ID":
          boostIdFieldValue = field.value;
          break;
        case "Selected Booster":
          selectedBoosterFieldValue = field.value;
          break;
      }
    });

    // Create a modal with a title
    const modal = new ModalBuilder()
      .setCustomId("Payment")
      .setTitle("Add Payment");

    // Create text inputs
    const boostTitle = new TextInputBuilder()
      .setCustomId("title")
      .setLabel("Boost Title")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(titleFieldValue);

    const selectValueInput = new TextInputBuilder()
      .setCustomId("amount")
      .setLabel("Payment Amount")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(priceFieldValue);

    const boostID = new TextInputBuilder()
      .setCustomId("id")
      .setLabel("Boost ID")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(boostIdFieldValue);

    const tagInput = new TextInputBuilder()
      .setCustomId("tagInput")
      .setLabel("Discord Tag")
      .setStyle(TextInputStyle.Short)
      .setValue(selectedBoosterFieldValue);

    // Create action rows
    const actionRow2 = new ActionRowBuilder().addComponents(boostTitle);
    const actionRow3 = new ActionRowBuilder().addComponents(selectValueInput);
    const actionRow4 = new ActionRowBuilder().addComponents(boostID);
    const actionRow5 = new ActionRowBuilder().addComponents(tagInput);

    // Add action rows to the modal
    modal.addComponents(actionRow2, actionRow3, actionRow4, actionRow5);

    // Show the modal to the user
    await interaction.showModal(modal);
  } catch (error) {
    console.error("Error showing modal:", error);
    try {
      await interaction.reply({
        content: "There was an error displaying the modal.",
        ephemeral: true,
      });
    } catch (replyError) {
      console.error("Error replying to interaction:", replyError);
    }
  }
};
const handleModalSubmit = async (interaction) => {
  if (
    interaction.type === InteractionType.ModalSubmit &&
    interaction.customId === "Payment"
  ) {
    // Send an immediate response to acknowledge receipt of the interaction
    try {
      await interaction.deferUpdate();

      const title = interaction.fields.getTextInputValue("title");

      const amountInput = interaction.fields.getTextInputValue("amount");

      // Use a regular expression to remove all non-numeric characters
      const amount = amountInput.replace(/\D/g, "");
      const boostID = interaction.fields.getTextInputValue("id");
      const tag = interaction.fields.getTextInputValue("tagInput");

      // Process the data as needed
      const rawdata = [
        getCurrentTimestamp(),
        amount * 1000,
        "Levelling",
        tag,
        "",
        "",
        "",
        boostID,
      ];
      await addvalue("Boost", [rawdata]);

      // Construct the message
      const message = `Balance Added for <@${tag}> by ${interaction.user.displayName} \nTitle: ${title}\nAmount: ${amount}K\nBoost ID: ${boostID}`;

      // Ensure the interaction's channel is valid
      if (interaction.channel) {
        const member = interaction.guild.members.cache.get(tag);
        if (member) {
          await member.send(message);
        }
        // Send the message to the channel where the interaction occurred
        await interaction.channel.send(message);
        await interaction.message.edit({ components: [] });
      } else {
        console.error("Channel is not accessible or doesn't exist.");
      }
    } catch (error) {
      console.error("Error handling modal submission:", error);

      // Handle errors that occurred during processing
      try {
      } catch (replyError) {
        console.error("Error replying to modal submission:", replyError);
      }
    }
  }
};

module.exports = { payment, handleModalSubmit };
