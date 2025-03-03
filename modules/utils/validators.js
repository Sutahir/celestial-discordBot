const validateUser = (userId, requiredRole, guild) => {
  const member = guild.members.cache.get(userId);
  return member && member.roles.cache.has(requiredRole);
};

const validateAmount = (amount) => {
  const parsed = parseFloat(amount?.replace(/[^\d.-]/g, ""));
  return !isNaN(parsed) && parsed > 0;
};

module.exports = {
  validateUser,
  validateAmount,
};
