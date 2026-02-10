/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("users", (table) => {
    table.boolean("email_verified").notNullable().defaultTo(false);
    table.string("otp_code_hash", 255);
    table.timestamp("otp_expires_at");
    table.string("reset_token_hash", 255);
    table.timestamp("reset_expires_at");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("email_verified");
    table.dropColumn("otp_code_hash");
    table.dropColumn("otp_expires_at");
    table.dropColumn("reset_token_hash");
    table.dropColumn("reset_expires_at");
  });
};
