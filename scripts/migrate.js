require("dotenv/config");
const knex = require("knex");
const knexConfig = require("../knexfile");

const environment = process.env.NODE_ENV || "development";
const db = knex(knexConfig[environment]);

async function runMigrations() {
  try {
    console.log("Running knex migrations...");
    await db.migrate.latest();
    console.log("Migrations applied successfully.");
  } catch (error) {
    console.error("Migration error:", error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

runMigrations();
