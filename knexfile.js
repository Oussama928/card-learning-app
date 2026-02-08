require("dotenv/config");

module.exports = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL || {
      host: "localhost",
      user: "ous223",
      database: "cardApp",
      port: 5432,
    },
    pool: { min: 0, max: 10 },
    migrations: {
      directory: "migrations",
    },
  },
};
