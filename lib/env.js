const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || "development";

const isProd = APP_ENV === "production";

const env = {
  appEnv: APP_ENV,
  nodeEnv: process.env.NODE_ENV || "development",
  host: process.env.HOST || "localhost",
  port: parseInt(process.env.PORT || "3000", 10),
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "cardApp",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    ssl: isProd ? { rejectUnauthorized: false } : undefined,
  },
};

module.exports = { env };
