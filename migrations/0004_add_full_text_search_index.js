/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_cards_search_vector
    ON cards USING GIN (
      to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
    );
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.raw(`DROP INDEX IF EXISTS idx_cards_search_vector;`);
};
