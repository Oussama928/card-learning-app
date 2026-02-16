/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("words", (table) => {
    table.string("image_url", 511);
  });

  await knex.schema.createTable("study_activity", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("word_id")
      .references("id")
      .inTable("words")
      .onDelete("SET NULL");
    table.boolean("is_correct").notNullable().defaultTo(false);
    table.timestamp("reviewed_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("study_activity", (table) => {
    table.index(["user_id", "reviewed_at"], "idx_study_activity_user_reviewed_at");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("study_activity");

  await knex.schema.alterTable("words", (table) => {
    table.dropColumn("image_url");
  });
};
