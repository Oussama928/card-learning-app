/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("classes", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.text("description");
    table
      .integer("owner_user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("class_cards", (table) => {
    table.increments("id").primary();
    table
      .integer("class_id")
      .notNullable()
      .references("id")
      .inTable("classes")
      .onDelete("CASCADE");
    table
      .integer("card_id")
      .notNullable()
      .references("id")
      .inTable("cards")
      .onDelete("CASCADE");
    table.integer("position").defaultTo(0);
    table.unique(["class_id", "card_id"]);
  });

  await knex.schema.alterTable("classes", (table) => {
    table.index(["owner_user_id"], "idx_classes_owner");
  });

  await knex.schema.alterTable("class_cards", (table) => {
    table.index(["class_id"], "idx_class_cards_class");
    table.index(["card_id"], "idx_class_cards_card");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("class_cards");
  await knex.schema.dropTableIfExists("classes");
};
