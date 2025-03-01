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
    // Connect to Google Sheets
    const goldPaymentSheet = await getSheetData(
      CONFIG.sheets.ranges.goldPayment
    );
    const paymentSheet = await getSheetData(CONFIG.sheets.ranges.payment);
    const balanceSheet = await getSheetData(CONFIG.sheets.ranges.balanceSheet);

    const userId = message.author.id;

    // Find user in balance sheet
    const userRow = balanceSheet.find((row) => row[0] === userId);

    if (!userRow) {
      return message.channel.send(
        "❌ **Account Not Found**: Your Discord ID was not found in our records."
      );
    }

    const userName = userRow[1] || "Unknown";

    // Filter gold payments for this user
    // Order: Date(0), Discord ID(1), Name-Realm(2), Amount(3), Note(4), Category(5), Admin(6), Payment ID(7), Status(8), Who Paid(9)
    const goldPayments = goldPaymentSheet.filter((row) => row[1] === userId);

    // Filter payments for this user
    const payments = paymentSheet.filter((row) => row[6] === userId);

    try {
      // Create user DM channel
      const dmChannel = await message.author.createDM();

      // Calculate totals
      const totalGoldPayments = goldPayments.reduce((total, payment) => {
        const amount = parseFloat(payment[3].replace(/[^\d.-]/g, "")) || 0;
        return total + (payment[8] === "Done" ? amount : 0);
      }, 0);

      const totalTomanPayments = payments.reduce((total, payment) => {
        const amount = parseFloat(payment[3].replace(/[^\d.-]/g, "")) || 0;
        return total + (payment[14] === "Done" ? amount : 0);
      }, 0);

      // Count pending transactions
      const pendingGoldPayments = goldPayments.filter(
        (p) => p[8] === "Pending"
      ).length;
      const pendingTomanPayments = payments.filter(
        (p) => p[14] === "Pending"
      ).length;

      // Send bold title as the first message
      await dmChannel.send(`**Balance Statement For: ${userName}**`);

      // Send summary section
      await dmChannel.send(`**SUMMARY:**`);
      let summaryContent = `Gold: ${totalGoldPayments.toLocaleString()}\n`;
      summaryContent += `Toman: ${totalTomanPayments.toLocaleString()}\n`;
      summaryContent += `Pending: ${
        pendingGoldPayments + pendingTomanPayments
      }`;
      await dmChannel.send("```" + summaryContent + "```");

      // Gold Section
      if (goldPayments.length > 0) {
        await dmChannel.send(
          `**<:gold:1345504166046339082> Gold Transactions (${goldPayments.length}):**`
        );
        let goldContent = "";

        // Just show the last 3 most recent for extreme simplicity
        goldPayments.slice(0, 3).forEach((payment) => {
          const formattedAmount = parseFloat(
            payment[3].replace(/[^\d.-]/g, "")
          ).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          goldContent += `${payment[0]}: ${formattedAmount} - ${payment[8]}\n`;
        });

        if (goldPayments.length > 3) {
          goldContent += `+ ${goldPayments.length - 3} more transactions`;
        }

        await dmChannel.send("```" + goldContent + "```");
      }

      // Toman Section
      if (payments.length > 0) {
        await dmChannel.send(`**💰 Cash Transactions (${payments.length}):**`);
        let tomanContent = "";

        // Just show the last 3 most recent for extreme simplicity
        payments.slice(0, 3).forEach((payment) => {
          tomanContent += `${payment[5]}: ${parseFloat(
            payment[3]
          ).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} Rial - ${payment[14]}\n`;
        });

        if (payments.length > 3) {
          tomanContent += `+ ${payments.length - 3} more transactions`;
        }

        await dmChannel.send("```" + tomanContent + "```");
      }

      // No Records Message
      if (goldPayments.length === 0 && payments.length === 0) {
        await dmChannel.send("**NO TRANSACTIONS FOUND**");
      }

      // Send footer message in bold
      await dmChannel.send("**For full details, contact an administrator.**");

      // Confirm in channel that DM was sent
      return message.channel.send("**✅ Balance sent to your DMs.**");
    } catch (error) {
      console.error("Error sending DM:", error);
      return message.channel.send(
        "**❌ Couldn't send DM. Please enable DMs from server members.**"
      );
    }
  } catch (error) {
    console.error("Error in balance command:", error);
    return message.channel.send(
      "**❌ An error occurred. Please try again later.**"
    );
  }
}

module.exports = { balance };
