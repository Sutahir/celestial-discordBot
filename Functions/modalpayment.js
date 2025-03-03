const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

const modalPayment = async (interaction) => {
  try {
    // Extract the necessary information from the interaction
    const [_, paymentType, duration, amount, userId] =
      interaction.customId.split("/");

    // Create a shorter title for the modal
    const modal = new ModalBuilder()
      .setCustomId(`payment/${paymentType}/${duration}/${amount}/${userId}`)
      .setTitle("Payment Details"); // Shortened, generic title

    // Create text inputs with the details instead
    const paymentInfoInput = new TextInputBuilder()
      .setCustomId("paymentInfo")
      .setLabel("Payment Information")
      .setStyle(TextInputStyle.Short)
      .setValue(`${paymentType} - ${duration} - ${amount}k`)
      .setRequired(true);

    const userIdInput = new TextInputBuilder()
      .setCustomId("userId")
      .setLabel("User ID")
      .setStyle(TextInputStyle.Short)
      .setValue(userId)
      .setRequired(true);

    const nameInput = new TextInputBuilder()
      .setCustomId("name")
      .setLabel("Full Name")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const cardNumberInput = new TextInputBuilder()
      .setCustomId("cardNumber")
      .setLabel("Card Number")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const shebaInput = new TextInputBuilder()
      .setCustomId("sheba")
      .setLabel("Sheba Number")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // Create action rows
    const firstActionRow = new ActionRowBuilder().addComponents(
      paymentInfoInput
    );
    const secondActionRow = new ActionRowBuilder().addComponents(userIdInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(nameInput);
    const fourthActionRow = new ActionRowBuilder().addComponents(
      cardNumberInput
    );
    const fifthActionRow = new ActionRowBuilder().addComponents(shebaInput);

    // Add action rows to modal
    modal.addComponents(
      firstActionRow,
      secondActionRow,
      thirdActionRow,
      fourthActionRow,
      fifthActionRow
    );

    // Show the modal
    await interaction.showModal(modal);
  } catch (error) {
    console.error("Error creating payment modal:", error);
    try {
      await interaction.reply({
        content:
          "There was an error creating the payment form. Please try again.",
        ephemeral: true,
      });
    } catch (replyError) {
      console.error("Error sending error message:", replyError);
    }
  }
};

module.exports = { modalPayment };
