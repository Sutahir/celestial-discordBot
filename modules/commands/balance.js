const { CONFIG } = require("../utils/config");
const logger = require("../utils/logger");
const { getSheetData } = require("../utils/sheet");
const {
  createBalanceEmbed,
  createTransactionEmbed,
} = require("../utils/embeds");
const { formatCurrency } = require("../utils/formatters");

const processTransactions = (transactions, type) => {
  const completed = transactions.filter(
    (tx) => tx[type === "gold" ? 8 : 16] === "TRUE"
  );

  const pending = transactions.filter(
    (tx) => tx[type === "gold" ? 8 : 16] !== "TRUE"
  );

  const total = completed.reduce((sum, tx) => {
    const amount = formatCurrency(type === "gold" ? tx[3] : tx[6], "number");
    return sum + amount;
  }, 0);

  const pendingAmount = pending.reduce((sum, tx) => {
    const amount = formatCurrency(type === "gold" ? tx[3] : tx[6], "number");
    return sum + amount;
  }, 0);

  return {
    total,
    pending: {
      count: pending.length,
      amount: pendingAmount,
    },
    transactions: transactions.map((tx) => ({
      date: tx[0],
      amount: type === "gold" ? tx[3] : tx[6],
      note: type === "gold" ? tx[4] : tx[12],
      status: type === "gold" ? tx[8] : tx[16],
      admin: type === "gold" ? tx[6] : tx[14],
      id: type === "gold" ? tx[7] : tx[13],
    })),
  };
};

const balance = async (message) => {
  try {
    logger.info("Starting balance command execution", {
      userId: message.author.id,
    });

    const [balanceSheet, goldPayments, payments] = await Promise.all([
      getSheetData(
        CONFIG.sheets.ranges.balanceSheet,
        CONFIG.sheets.celestialSheetId
      ),
      getSheetData(
        CONFIG.sheets.ranges.goldPayment,
        CONFIG.sheets.celestialSheetId
      ),
      getSheetData(CONFIG.sheets.ranges.payment, CONFIG.sheets.adminSheetId),
    ]);

    const userId = message.author.id;
    const userRow = balanceSheet.find((row) => row[0] === userId);
    const userName = userRow?.[1] || "Unknown";

    const userGoldPayments = goldPayments.filter((row) => row[1] === userId);
    const userPayments = payments.filter((row) => row[1] === userId);

    const goldData = processTransactions(userGoldPayments, "gold");
    const tomanData = processTransactions(userPayments, "toman");

    const userData = {
      userName,
      totalGold: goldData.total,
      totalToman: tomanData.total,
      pendingGold: goldData.pending,
      pendingToman: tomanData.pending,
      avatar: message.author.displayAvatarURL({ dynamic: true }),
      botAvatar: message.client.user.displayAvatarURL(),
    };

    const dmChannel = await message.author.createDM();

    // Send main balance embed
    await dmChannel.send({
      embeds: [createBalanceEmbed(userData, userGoldPayments, userPayments)],
    });

    // Send transaction embeds if there are any transactions
    if (userGoldPayments.length > 0) {
      await dmChannel.send({
        embeds: [createTransactionEmbed(goldData.transactions, "gold")],
      });
    }

    if (userPayments.length > 0) {
      await dmChannel.send({
        embeds: [createTransactionEmbed(tomanData.transactions, "toman")],
      });
    }

    await message.reply({
      content: `${message.author}, I've sent your detailed balance statement to your DMs.`,
      ephemeral: true,
    });
  } catch (error) {
    logger.error("Error in balance command", {
      error,
      userId: message.author.id,
    });
    await message.reply(
      "An error occurred while retrieving your balance information. Please try again later."
    );
  }
};

module.exports = { balance };
