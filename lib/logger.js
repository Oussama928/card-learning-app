const { createLogger, format, transports } = require("winston");
const { env } = require("./env");

const level = process.env.LOG_LEVEL || (env.appEnv === "production" ? "info" : "debug");

const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
