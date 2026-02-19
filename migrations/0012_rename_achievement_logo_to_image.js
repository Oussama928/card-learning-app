/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable("achievements", (table) => {
    table.renameColumn("logo_url", "image_url");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable("achievements", (table) => {
    table.renameColumn("image_url", "logo_url");
  });
};
