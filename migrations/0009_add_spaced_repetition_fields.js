/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("user_progress", (table) => {
    table.integer("correct_count").notNullable().defaultTo(0);
    table.integer("incorrect_count").notNullable().defaultTo(0);
    table.integer("repetitions").notNullable().defaultTo(0);
    table.integer("interval_days").notNullable().defaultTo(0);
    table.decimal("ease_factor", 5, 2).notNullable().defaultTo(2.5);
    table.timestamp("last_reviewed");
    table.timestamp("next_review_at");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("user_progress", (table) => {
    table.dropColumn("correct_count");
    table.dropColumn("incorrect_count");
    table.dropColumn("repetitions");
    table.dropColumn("interval_days");
    table.dropColumn("ease_factor");
    table.dropColumn("last_reviewed");
    table.dropColumn("next_review_at");
  });
};
