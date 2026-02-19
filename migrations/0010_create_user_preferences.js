/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("user_preferences", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().unique().references("id").inTable("users").onDelete("CASCADE");
    table.string("study_mode", 50).notNullable().defaultTo("default");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.index(["user_id"], "idx_user_preferences_user");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("user_preferences");
};
