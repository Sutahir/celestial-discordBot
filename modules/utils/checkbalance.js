const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getSheetData } = require("./sheet");
const { CONFIG } = require("./config");
/**
 * Sends balance information to a user
 * @param {Object} message Discord message that triggered the command
 */
async function balance(message) {
  try {
    console.log("Starting balance command execution");

    // Get all sheet data with the correct spreadsheet IDs
    const balanceSheet = await getSheetData(
      CONFIG.sheets.ranges.balanceSheet,
      CONFIG.sheets.celestialSheetId // Pass CELESTIAL spreadsheet ID for balance sheet
    );

    console.log(
      `Retrieved balance sheet data with ${
        balanceSheet ? balanceSheet.length : 0
      } rows`
    );

    const goldPaymentSheet = await getSheetData(
      CONFIG.sheets.ranges.goldPayment,
      CONFIG.sheets.celestialSheetId // Pass CELESTIAL spreadsheet ID for gold payment
    );

    console.log(
      `Retrieved gold payment data with ${
        goldPaymentSheet ? goldPaymentSheet.length : 0
      } rows`
    );

    const paymentSheet = await getSheetData(
      CONFIG.sheets.ranges.payment,
      CONFIG.sheets.adminSheetId // Pass ADMIN spreadsheet ID for payment
    );

    console.log(
      `Retrieved payment data with ${
        paymentSheet ? paymentSheet.length : 0
      } rows`
    );

    // Get user ID from command
    const userId = message.author.id;

    // Find user in balance sheet
    const userRow = balanceSheet.find((row) => row[0] === userId);
    const userName = userRow && userRow[1] ? userRow[1] : "Unknown";

    // Filter gold payments for this user
    // New Order: Date(0), Discord ID(1), Name-Realm(2), Amount(3), Note(4), Category(5), Admin(6), Payment ID(7), Status(8), Who Paid(9)
    const goldPayments = goldPaymentSheet.filter((row) => row[1] === userId);

    // Filter payments for this user
    // New Order: Timestamp(0), Discord ID(1), Payment Time(2), Amount(3), Price(4), #VALUE!(5), Gheymat(6),
    // Realm(7), Shomare Kart(8), Shomare Sheba(9), Name(10), Shomare tamas(11), Note(12), ID(13), Admin(14), Ki Pay Kard(15), Paid(16)
    const payments = paymentSheet.filter((row) => row[1] === userId);

    try {
      // Create user DM channel
      const dmChannel = await message.author.createDM();

      // Calculate totals
      const totalGoldPayments = goldPayments.reduce((total, payment) => {
        const amount = parseFloat(payment[3]?.replace(/[^\d.-]/g, "")) || 0;
        return total + (payment[8] === "TRUE" ? amount : 0);
      }, 0);

      const totalTomanPayments = payments.reduce((total, payment) => {
        let amount = 0;
        try {
          const gheymatStr = payment[6]?.replace(/[^\d.-]/g, "");
          amount = parseFloat(gheymatStr) || 0;
        } catch (err) {
          console.error("Error parsing payment amount:", err);
        }
        return total + (payment[16] === "TRUE" ? amount : 0);
      }, 0);

      // Count pending transactions
      const pendingGoldPayments = goldPayments.filter(
        (p) => p[8] === "FALSE" || p[8] === "Pending"
      ).length;

      const pendingTomanPayments = payments.filter(
        (p) => p[16] === "FALSE" || p[16] === "Pending"
      ).length;

      // Get pending amounts
      const pendingGoldAmount = goldPayments
        .filter((p) => p[8] === "FALSE" || p[8] === "Pending")
        .reduce((total, payment) => {
          const amount = parseFloat(payment[3]?.replace(/[^\d.-]/g, "")) || 0;
          return total + amount;
        }, 0);

      const pendingTomanAmount = payments
        .filter((p) => p[16] === "FALSE" || p[16] === "Pending")
        .reduce((total, payment) => {
          let amount = 0;
          try {
            const gheymatStr = payment[6]?.replace(/[^\d.-]/g, "");
            amount = parseFloat(gheymatStr) || 0;
          } catch (err) {
            console.error("Error parsing pending amount:", err);
          }
          return total + amount;
        }, 0);

      // Create a rich embed for the balance statement
      const balanceEmbed = {
        color: 0x0099ff, // Blue color
        title: `Balance Statement for ${userName}`,
        thumbnail: {
          url: message.author.displayAvatarURL({ dynamic: true }),
        },
        fields: [
          {
            name: "💰 Available Balance",
            value: `**Gold:** ${totalGoldPayments.toLocaleString()}\n**Toman:** ${totalTomanPayments.toLocaleString()}`,
            inline: false,
          },
        ],
        timestamp: new Date(),
        footer: {
          text: "Celestial Boosting",
          icon_url: message.client.user.displayAvatarURL(),
        },
      };

      // Add pending transactions if any exist
      if (pendingGoldPayments > 0 || pendingTomanPayments > 0) {
        balanceEmbed.fields.push({
          name: "⏳ Pending Transactions",
          value: `${
            pendingGoldPayments > 0
              ? `**Gold:** ${pendingGoldPayments} (${pendingGoldAmount.toLocaleString()})\n`
              : ""
          }${
            pendingTomanPayments > 0
              ? `**Toman:** ${pendingTomanPayments} (${pendingTomanAmount.toLocaleString()})`
              : ""
          }`,
          inline: false,
        });
      }

      // Add transaction summary
      balanceEmbed.fields.push({
        name: "📊 Transaction Summary",
        value: `**Gold Transactions:** ${goldPayments.length}\n**Toman Transactions:** ${payments.length}`,
        inline: false,
      });

      // Send the main balance embed
      await dmChannel.send({ embeds: [balanceEmbed] });

      // Prepare transaction details embeds

      // Gold transactions embed
      if (goldPayments.length > 0) {
        const goldEmbed = {
          color: 0xffd700, // Gold color
          title: "Gold Transactions",
          description: `Your most recent gold transactions:`,
          fields: [],
          timestamp: new Date(),
        };

        // Add the most recent transactions
        const recentGoldPayments = goldPayments.slice(-7).reverse(); // Get last 7 transactions, most recent first

        recentGoldPayments.forEach((payment, index) => {
          const date = payment[0] || "N/A";
          let amount = parseFloat(payment[3]?.replace(/[^\d.-]/g, "")) || 0;
          const note = payment[4] || "N/A";
          const status = payment[8] === "TRUE" ? "✅ Completed" : "⏳ Pending";
          const admin = payment[6] || "N/A";

          goldEmbed.fields.push({
            name: `Transaction #${index + 1} · ${date}`,
            value: `**Amount:** ${amount.toLocaleString()}\n**Status:** ${status}\n**Admin:** ${admin}\n**Note:** ${note}\n**ID:** ${
              payment[7] || "N/A"
            }`,
            inline: false,
          });
        });

        await dmChannel.send({ embeds: [goldEmbed] });
      }

      // Toman transactions embed
      if (payments.length > 0) {
        const tomanEmbed = {
          color: 0x4169e1, // Royal blue color
          title: "Toman Transactions",
          description: `Your most recent toman transactions:`,
          fields: [],
          timestamp: new Date(),
        };

        // Add the most recent transactions
        const recentTomanPayments = payments.slice(-7).reverse(); // Get last 7 transactions, most recent first

        recentTomanPayments.forEach((payment, index) => {
          const date = payment[0] || "N/A";
          let amount;
          try {
            amount = parseFloat(payment[6]?.replace(/[^\d.-]/g, "")) || 0;
          } catch (err) {
            amount = 0;
          }
          const note = payment[12] || "N/A";
          const status = payment[16] === "TRUE" ? "✅ Completed" : "⏳ Pending";
          const admin = payment[14] || "N/A";

          tomanEmbed.fields.push({
            name: `Transaction #${index + 1} · ${date}`,
            value: `**Amount:** ${amount.toLocaleString()}\n**Status:** ${status}\n**Admin:** ${admin}\n**Note:** ${note}\n**ID:** ${
              payment[13] || "N/A"
            }`,
            inline: false,
          });
        });

        await dmChannel.send({ embeds: [tomanEmbed] });
      }

      // Send help information
      const helpEmbed = {
        color: 0x00cc99, // Teal color
        title: "Need Assistance?",
        description:
          "For more details about your transactions or any questions, please contact an administrator.",
        fields: [
          {
            name: "Commands",
            value:
              "`!balance` - View your balance statement\n`!help` - Display all available commands",
            inline: false,
          },
        ],
        timestamp: new Date(),
      };

      await dmChannel.send({ embeds: [helpEmbed] });

      // Respond in the channel where command was issued
      await message.reply({
        content: `${message.author}, I've sent your detailed balance statement to your DMs.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error sending DM:", error);
      await message.reply(
        "I couldn't send you a DM. Please make sure you have DMs enabled for this server."
      );
    }
  } catch (error) {
    console.error("Error in balance command:", error);
    await message.reply(
      "An error occurred while retrieving your balance information. Please try again later."
    );
  }
}

module.exports = { balance };
