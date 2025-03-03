const { EmbedBuilder } = require("discord.js");
const { formatCurrency, formatDate, formatStatus } = require("./formatters");

const createBalanceEmbed = (userData, goldPayments, tomanPayments) => {
  const { userName, totalGold, totalToman, pendingGold, pendingToman, avatar } =
    userData;

  return new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`Balance Statement for ${userName}`)
    .setThumbnail(avatar)
    .addFields([
      {
        name: "💰 Available Balance",
        value: `**Gold:** ${formatCurrency(
          totalGold
        )}\n**Toman:** ${formatCurrency(totalToman)}`,
        inline: false,
      },
      {
        name: "⏳ Pending Transactions",
        value: `**Gold:** ${pendingGold.count} (${formatCurrency(
          pendingGold.amount
        )})\n**Toman:** ${pendingToman.count} (${formatCurrency(
          pendingToman.amount
        )})`,
        inline: false,
      },
      {
        name: "📊 Transaction Summary",
        value: `**Gold Transactions:** ${goldPayments.length}\n**Toman Transactions:** ${tomanPayments.length}`,
        inline: false,
      },
    ])
    .setTimestamp()
    .setFooter({
      text: "Celestial Boosting",
      iconURL: userData.botAvatar,
    });
};

const createTransactionEmbed = (transactions, type) => {
  const colors = {
    gold: 0xffd700,
    toman: 0x4169e1,
  };

  return new EmbedBuilder()
    .setColor(colors[type])
    .setTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} Transactions`)
    .setDescription(`Your most recent ${type} transactions:`)
    .addFields(
      transactions
        .slice(-7)
        .reverse()
        .map((tx, index) => ({
          name: `Transaction #${index + 1} · ${formatDate(tx.date)}`,
          value: `**Amount:** ${formatCurrency(
            tx.amount
          )}\n**Status:** ${formatStatus(tx.status)}\n**Admin:** ${
            tx.admin
          }\n**Note:** ${tx.note}\n**ID:** ${tx.id}`,
          inline: false,
        }))
    )
    .setTimestamp();
};

module.exports = {
  createBalanceEmbed,
  createTransactionEmbed,
};
