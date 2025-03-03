const transaction = async (message, client) => {
  try {
    if (message.embeds.length > 0) {
      const embed = message.embeds[0];
      if (embed.fields && Array.isArray(embed.fields)) {
        const idField = embed.fields.find((field) => field.name === "id");

        if (idField) {
          const userId = idField.value;

          // Extract all potential fields (some may be undefined based on action type)
          const amountField = embed.fields.find(
            (field) => field.name === "Amount"
          );
          const priceField = embed.fields.find(
            (field) => field.name === "Price"
          );
          const gheymatField = embed.fields.find(
            (field) => field.name === "Gheymat"
          );
          const paymentDurationField = embed.fields.find(
            (field) => field.name === "Payment Duration"
          );
          const gameField = embed.fields.find((field) => field.name === "Game");
          const adminField = embed.fields.find(
            (field) => field.name === "Admin"
          );
          const noteField = embed.fields.find((field) => field.name === "Note");
          const uniqueIDField = embed.fields.find(
            (field) => field.name === "payment id"
          );
          const actionField = embed.fields.find(
            (field) => field.name === "action"
          );
          const shebaField = embed.fields.find(
            (field) => field.name === "Sheba"
          );
          const nameField = embed.fields.find((field) => field.name === "Name");

          // Get values or defaults
          const amount = amountField ? amountField.value : "";
          const price = priceField ? priceField.value : "";
          const gheymat = gheymatField ? gheymatField.value : "";
          const paymentDuration = paymentDurationField
            ? paymentDurationField.value
            : "";
          const game = gameField ? gameField.value : "";
          const admin = adminField ? adminField.value : "Not available";
          const note = noteField ? noteField.value : "";
          const uniqueID = uniqueIDField
            ? uniqueIDField.value
            : "Not available";
          const action = actionField ? actionField.value.toLowerCase() : "";
          const sheba = shebaField ? shebaField.value : "";
          const name = nameField ? nameField.value : "";

          const user = await client.users.fetch(userId);

          // Default embed color and title
          const embedColor = 3066993; // Green color for both create and paid
          const embedTitle = "Payment Transaction Update";

          let fields = [];
          let statusMessage = "";

          // Determine message and fields based on action type
          if (action === "create") {
            statusMessage = "Your payment request has been **CREATED**";

            fields = [
              { name: "Amount", value: amount, inline: true },
              { name: "Price", value: price, inline: true },
              { name: "Gheymat", value: gheymat, inline: true },
              {
                name: "Payment Duration",
                value: paymentDuration,
                inline: true,
              },
              { name: "Game", value: game, inline: true },
              { name: "Admin", value: admin, inline: true },
              {
                name: "Note",
                value: note || "No notes provided",
                inline: false,
              },
              { name: "Payment ID", value: uniqueID, inline: false },
              { name: "Sheba", value: sheba, inline: false },
              { name: "Name", value: name, inline: false },
            ];
          } else if (action === "paid") {
            statusMessage = "Your payment has been marked as **PAID**";

            fields = [
              { name: "Payment ID", value: uniqueID, inline: false },
              { name: "Gheymat", value: gheymat, inline: true },
              { name: "Admin", value: admin, inline: true },
              {
                name: "Note",
                value: note || "No notes provided",
                inline: false,
              },
              { name: "Sheba", value: sheba, inline: false },
              { name: "Name", value: name, inline: false },
            ];
          } else {
            // Fallback for any other action type
            statusMessage = `Your payment status has been updated to: **${
              action || "Unknown"
            }**`;

            fields = [
              { name: "Payment ID", value: uniqueID, inline: false },
              { name: "Gheymat", value: gheymat, inline: true },
              { name: "Admin", value: admin, inline: true },
              {
                name: "Note",
                value: note || "No notes provided",
                inline: false,
              },
              {
                name: "Status",
                value: action ? action.toUpperCase() : "Unknown",
                inline: true,
              },
              { name: "Sheba", value: sheba, inline: false },
              { name: "Name", value: name, inline: false },
            ];
          }

          // Create the embed to send
          const embedToSend = {
            color: embedColor,
            title: embedTitle,
            description: statusMessage,
            fields: fields,
            footer: {
              text: `Processed on ${new Date().toLocaleString()}`,
              icon_url: message.author.displayAvatarURL(),
            },
            timestamp: new Date(),
          };

          await user.send({ embeds: [embedToSend] });
          console.log(
            `Payment update (${action}) sent to the user successfully!`
          );

          // React to the message with a green checkmark
          await message.react("✅");

          // DM specific users if paymentDuration is "1-3 saat" and action is "create"
          if (paymentDuration === "1-3 saat" && action === "create") {
            const user1 = await client.users.fetch("339703905166426114");
            const user2 = await client.users.fetch("180032303303491584");

            // Create notification embed for urgent payments
            const notificationEmbed = {
              color: 0xff0000, // Red color for notification
              title: "Immediate Payment Notification",
              description:
                "A transaction with immediate payment duration has been created.",
              fields: [
                { name: "User ID", value: userId, inline: true },
                { name: "Amount", value: amount, inline: true },
                { name: "Price", value: price, inline: true },
                {
                  name: "Payment Duration",
                  value: paymentDuration,
                  inline: true,
                },
                { name: "Game", value: game, inline: true },
                { name: "Admin", value: admin, inline: true },
                { name: "Note", value: note, inline: false },
                { name: "Payment ID", value: uniqueID, inline: false },
                { name: "شماره شبا", value: sheba, inline: false },
                { name: "نام صاحب حساب", value: name, inline: false },
              ],
              footer: {
                text: `Requested by ${message.author.username}`,
                icon_url: message.author.displayAvatarURL(),
              },
              timestamp: new Date(),
            };

            await user1.send({ embeds: [notificationEmbed] });
            await user2.send({ embeds: [notificationEmbed] });
            console.log(
              "Notification sent to specific users for immediate payment duration."
            );
          }
        } else {
          console.log("No 'id' field found in the embed.");
        }
      } else {
        console.log("Embed fields are not defined or not an array.");
      }
    } else {
      console.log("No embeds found in the message.");
    }
  } catch (error) {
    console.error("An error occurred in the transaction function:", error);
  }
};

module.exports = { transaction };
