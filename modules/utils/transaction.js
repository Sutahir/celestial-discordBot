const transaction = async (message, client) => {
  try {
    if (message.embeds.length > 0) {
      const embed = message.embeds[0];

      if (embed.fields && Array.isArray(embed.fields)) {
        const idField = embed.fields.find((field) => field.name === "id");

        if (idField) {
          const userId = idField.value;

          const gheymatField = embed.fields.find(
            (field) => field.name === "Gheymat"
          );
          const adminField = embed.fields.find(
            (field) => field.name === "Admin"
          );
          const uniqueIDField = embed.fields.find(
            (field) => field.name === "payment id"
          );
          const actionField = embed.fields.find(
            (field) => field.name === "action"
          );
          const amountField = embed.fields.find(
            (field) => field.name === "Amount"
          );
          const priceField = embed.fields.find(
            (field) => field.name === "Price"
          );
          const paymentDurationField = embed.fields.find(
            (field) => field.name === "Payment Duration"
          );
          const gameField = embed.fields.find((field) => field.name === "Game");
          const noteField = embed.fields.find((field) => field.name === "Note");
          const shebaField = embed.fields.find(
            (field) => field.name === "Sheba"
          );
          const nameField = embed.fields.find((field) => field.name === "Name");

          const gheymat = gheymatField ? gheymatField.value : "Not available";
          const admin = adminField ? adminField.value : "Not available";
          const uniqueID = uniqueIDField
            ? uniqueIDField.value
            : "Not available";
          const action = actionField ? actionField.value.toLowerCase() : null;
          const amount = amountField ? amountField.value : "Not available";
          const price = priceField ? priceField.value : "Not available";
          const paymentDuration = paymentDurationField
            ? paymentDurationField.value
            : "Not available";
          const game = gameField ? gameField.value : "Not available";
          const note = noteField ? noteField.value : "Not available";
          const sheba = shebaField ? shebaField.value : "Not available";
          const name = nameField ? nameField.value : "Not available";

          const user = await client.users.fetch(userId);

          const embedToSend = {
            color: action === "paid" ? 0x00ff00 : 0x3498db, // Green for "paid", Blue for "create"
            title:
              action === "paid"
                ? "Payment Confirmation"
                : "Transaction Details",
            description:
              action === "paid"
                ? "پرداختی شما انجام شد.تا سیکل بعدی پایا پول برایتان واریز میشود."
                : "مشخصات واریزی :",
            fields:
              action === "paid"
                ? [
                    {
                      name: "Mablagh Pardakhty",
                      value: `${gheymat} Rial`,
                      inline: true,
                    },
                    { name: "Admin", value: admin, inline: true },
                    { name: "ID", value: uniqueID, inline: false },
                    { name: "شماره شبا", value: sheba, inline: false },
                    { name: "نام صاحب حساب", value: name, inline: false },
                  ]
                : [
                    { name: "Amount", value: amount, inline: true },
                    { name: "Price", value: price, inline: true },
                    {
                      name: "Mablagh Pardakhty",
                      value: `${gheymat} Rial`,
                      inline: true,
                    },
                    {
                      name: "Payment Duration",
                      value: paymentDuration,
                      inline: true,
                    },
                    { name: "Game", value: game, inline: true },
                    { name: "Admin", value: admin, inline: true },
                    { name: "Note", value: note, inline: false },
                    { name: "ID", value: uniqueID, inline: false },
                    { name: "شماره شبا", value: sheba, inline: false },
                    { name: "نام صاحب حساب", value: name, inline: false },
                  ],
            footer: {
              text: `Requested by ${message.author.username}`,
              icon_url: message.author.displayAvatarURL(),
            },
            timestamp: new Date(),
          };

          await user.send({ embeds: [embedToSend] });
          console.log(
            `${
              action === "paid" ? "Paid" : "Create"
            } embed sent to the user successfully!`
          );

          // React to the message with a green checkmark
          await message.react("✅");

          // DM specific users if paymentDuration is "lahzei" and action is "create"
          if (paymentDuration === "1-3 saat" && action === "create") {
            const user1 = await client.users.fetch("339703905166426114");
            const user2 = await client.users.fetch("180032303303491584");
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
                { name: "ID", value: uniqueID, inline: false },
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
