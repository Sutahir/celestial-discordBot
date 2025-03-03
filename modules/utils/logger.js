const logLevels = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = {
    timestamp,
    level,
    message,
    ...(data && { data }),
  };

  console.log(JSON.stringify(logMessage));
};

module.exports = {
  error: (message, data) => log(logLevels.ERROR, message, data),
  warn: (message, data) => log(logLevels.WARN, message, data),
  info: (message, data) => log(logLevels.INFO, message, data),
  debug: (message, data) => log(logLevels.DEBUG, message, data),
};
