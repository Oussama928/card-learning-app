/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username", 255);
    table.string("email", 255).notNullable().unique();
    table.string("password", 255);
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.string("image", 511);
    table.string("role", 50).defaultTo("user");
    table.text("bio");
    table.string("country", 100);
  });

  await knex.schema.createTable("cards", (table) => {
    table.increments("id").primary();
    table.string("title", 255).notNullable();
    table.text("description");
    table.string("target_language", 255).notNullable();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.integer("total_words").defaultTo(0);
  });

  await knex.schema.createTable("words", (table) => {
    table.increments("id").primary();
    table.string("word", 255).notNullable();
    table.integer("card_id").notNullable().references("id").inTable("cards").onDelete("CASCADE");
    table.string("translated_word", 255);
  });

  await knex.schema.createTable("favorites", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.integer("card_id").notNullable().references("id").inTable("cards").onDelete("CASCADE");
  });

  await knex.schema.createTable("user_progress", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.integer("word_id").notNullable().references("id").inTable("words").onDelete("CASCADE");
    table.boolean("is_learned").defaultTo(false);
    table.unique(["user_id", "word_id"]);
  });

  await knex.schema.createTable("user_stats", (table) => {
    table.integer("user_id").primary().references("id").inTable("users").onDelete("CASCADE");
    table.integer("total_terms_learned").defaultTo(0);
    table.integer("daily_streak").defaultTo(0);
    table.decimal("accuracy", 5, 2).defaultTo(0.0);
    table.integer("xp").defaultTo(0);
    table.date("last_login_date");
  });

  await knex.schema.createTable("notifications", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("type", 50).notNullable();
    table.text("content").notNullable();
    table.boolean("is_read").defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("notifications");
  await knex.schema.dropTableIfExists("user_stats");
  await knex.schema.dropTableIfExists("user_progress");
  await knex.schema.dropTableIfExists("favorites");
  await knex.schema.dropTableIfExists("words");
  await knex.schema.dropTableIfExists("cards");
  await knex.schema.dropTableIfExists("users");
};
