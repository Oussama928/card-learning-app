/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("skill_trees", (table) => {
    table.increments("id").primary();
    table.string("language", 64).notNullable();
    table.string("name", 255).notNullable();
    table.text("description");
    table.integer("completion_xp_reward").defaultTo(0);
    table.string("badge_name", 255);
    table.string("badge_image_url", 1024);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.index(["language"], "idx_skill_trees_language");
  });

  await knex.schema.createTable("skill_tree_nodes", (table) => {
    table.increments("id").primary();
    table
      .integer("tree_id")
      .notNullable()
      .references("id")
      .inTable("skill_trees")
      .onDelete("CASCADE");
    table
      .integer("card_id")
      .references("id")
      .inTable("cards")
      .onDelete("SET NULL");
    table.string("title", 255).notNullable();
    table.text("description");
    table.string("difficulty", 32).defaultTo("beginner");
    table.integer("xp_reward").defaultTo(0);
    table.string("criteria_type", 32).defaultTo("card_mastery");
    table.integer("required_mastery_pct").defaultTo(100);
    table.integer("required_xp");
    table.integer("position_x").defaultTo(0);
    table.integer("position_y").defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.index(["tree_id"], "idx_skill_tree_nodes_tree");
    table.index(["card_id"], "idx_skill_tree_nodes_card");
  });

  await knex.schema.createTable("skill_tree_edges", (table) => {
    table.increments("id").primary();
    table
      .integer("tree_id")
      .notNullable()
      .references("id")
      .inTable("skill_trees")
      .onDelete("CASCADE");
    table
      .integer("parent_node_id")
      .notNullable()
      .references("id")
      .inTable("skill_tree_nodes")
      .onDelete("CASCADE");
    table
      .integer("child_node_id")
      .notNullable()
      .references("id")
      .inTable("skill_tree_nodes")
      .onDelete("CASCADE");
    table.index(["tree_id"], "idx_skill_tree_edges_tree");
    table.index(["parent_node_id"], "idx_skill_tree_edges_parent");
    table.index(["child_node_id"], "idx_skill_tree_edges_child");
  });

  await knex.schema.createTable("skill_tree_user_nodes", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("node_id")
      .notNullable()
      .references("id")
      .inTable("skill_tree_nodes")
      .onDelete("CASCADE");
    table.string("status", 16).notNullable().defaultTo("locked");
    table.integer("xp_awarded").defaultTo(0);
    table.timestamp("unlocked_at");
    table.timestamp("completed_at");
    table.unique(["user_id", "node_id"], "ux_skill_tree_user_nodes");
    table.index(["user_id"], "idx_skill_tree_user_nodes_user");
    table.index(["node_id"], "idx_skill_tree_user_nodes_node");
  });

  await knex.schema.createTable("skill_tree_user_trees", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("tree_id")
      .notNullable()
      .references("id")
      .inTable("skill_trees")
      .onDelete("CASCADE");
    table.integer("xp_earned").defaultTo(0);
    table.boolean("badge_awarded").defaultTo(false);
    table.string("certificate_url", 1024);
    table.timestamp("completed_at");
    table.unique(["user_id", "tree_id"], "ux_skill_tree_user_trees");
    table.index(["user_id"], "idx_skill_tree_user_trees_user");
    table.index(["tree_id"], "idx_skill_tree_user_trees_tree");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("skill_tree_user_trees");
  await knex.schema.dropTableIfExists("skill_tree_user_nodes");
  await knex.schema.dropTableIfExists("skill_tree_edges");
  await knex.schema.dropTableIfExists("skill_tree_nodes");
  await knex.schema.dropTableIfExists("skill_trees");
};
