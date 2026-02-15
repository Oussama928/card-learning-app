const { createLogger, format, transports } = require("winston");
const { env } = require("./env");

const level = process.env.LOG_LEVEL || (env.appEnv === "production" ? "info" : "error");

const logger = createLogger({
  level,
  silent: true, // disabled for now
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: env.appEnv === "production" ? [new transports.Console()] : [],
});

module.exports = logger;
