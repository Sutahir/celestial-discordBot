const formatCurrency = (amount, type = "number") => {
  if (typeof amount !== "number") {
    amount = parseFloat(amount?.replace(/[^\d.-]/g, "")) || 0;
  }

  return type === "string" ? amount.toLocaleString() : amount;
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-US", { timeZone: "Asia/Tehran" });
};

const formatStatus = (status) => {
  return status === "TRUE" ? "✅ Completed" : "⏳ Pending";
};

module.exports = {
  formatCurrency,
  formatDate,
  formatStatus,
};
