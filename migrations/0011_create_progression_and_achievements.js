/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable("user_stats", (table) => {
    table.string("current_tier", 32).notNullable().defaultTo("Bronze");
  });

  await knex.schema.alterTable("notifications", (table) => {
    table.jsonb("metadata").nullable();
  });

  await knex.schema.createTable("achievements", (table) => {
    table.increments("id").primary();
    table.string("key", 128).notNullable().unique();
    table.string("name", 255).notNullable();
    table.text("description").notNullable();
    table.string("logo_url", 511).nullable();
    table.string("condition_type", 64).notNullable();
    table.integer("condition_value").notNullable();
    table.integer("xp_reward").notNullable().defaultTo(0);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("user_achievements", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table
      .integer("achievement_id")
      .notNullable()
      .references("id")
      .inTable("achievements")
      .onDelete("CASCADE");
    table.timestamp("unlocked_at").notNullable().defaultTo(knex.fn.now());
    table.unique(["user_id", "achievement_id"]);
    table.index(["user_id"], "idx_user_achievements_user_id");
  });

  await knex.schema.alterTable("user_stats", (table) => {
    table.index(["xp"], "idx_user_stats_xp");
  });

  await knex("achievements").insert([
    {
      key: "study_100_cards",
      name: "Study Grinder",
      description: "Study 100 cards",
      condition_type: "cards_studied_total",
      condition_value: 100,
      xp_reward: 0,
    },
    {
      key: "create_10_cards",
      name: "Deck Architect",
      description: "Create 10 cards",
      condition_type: "cards_created_total",
      condition_value: 10,
      xp_reward: 0,
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable("user_stats", (table) => {
    table.dropIndex(["xp"], "idx_user_stats_xp");
  });

  await knex.schema.dropTableIfExists("user_achievements");
  await knex.schema.dropTableIfExists("achievements");

  await knex.schema.alterTable("notifications", (table) => {
    table.dropColumn("metadata");
  });

  await knex.schema.alterTable("user_stats", (table) => {
    table.dropColumn("current_tier");
  });
};
