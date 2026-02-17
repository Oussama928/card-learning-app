/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("study_groups", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.text("description");
    table
      .integer("teacher_user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("visibility", 20).notNullable().defaultTo("private");
    table.string("join_code", 16).unique();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.index(["teacher_user_id"], "idx_study_groups_teacher");
    table.index(["visibility"], "idx_study_groups_visibility");
  });

  await knex.schema.createTable("study_group_members", (table) => {
    table.increments("id").primary();
    table
      .integer("group_id")
      .notNullable()
      .references("id")
      .inTable("study_groups")
      .onDelete("CASCADE");
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.timestamp("joined_at").defaultTo(knex.fn.now());
    table.unique(["group_id", "user_id"]);
    table.index(["user_id"], "idx_study_group_members_user");
    table.index(["group_id"], "idx_study_group_members_group");
  });

  await knex.schema.createTable("study_group_assignments", (table) => {
    table.increments("id").primary();
    table
      .integer("group_id")
      .notNullable()
      .references("id")
      .inTable("study_groups")
      .onDelete("CASCADE");
    table
      .integer("assigned_by_user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("assignment_type", 20).notNullable();
    table.integer("card_id").references("id").inTable("cards").onDelete("CASCADE");
    table.integer("class_id").references("id").inTable("classes").onDelete("CASCADE");
    table.string("title", 255);
    table.timestamp("due_at");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.index(["group_id"], "idx_study_group_assignments_group");
    table.index(["card_id"], "idx_study_group_assignments_card");
    table.index(["class_id"], "idx_study_group_assignments_class");
  });

  await knex.schema.createTable("study_group_posts", (table) => {
    table.increments("id").primary();
    table
      .integer("group_id")
      .notNullable()
      .references("id")
      .inTable("study_groups")
      .onDelete("CASCADE");
    table
      .integer("author_user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("post_type", 20).notNullable().defaultTo("text");
    table.text("content").notNullable();
    table.string("link_url", 1024);
    table.string("image_url", 1024);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.index(["group_id", "created_at"], "idx_study_group_posts_group_created");
  });

  await knex.schema.createTable("study_group_post_comments", (table) => {
    table.increments("id").primary();
    table
      .integer("post_id")
      .notNullable()
      .references("id")
      .inTable("study_group_posts")
      .onDelete("CASCADE");
    table.integer("parent_comment_id").references("id").inTable("study_group_post_comments").onDelete("CASCADE");
    table
      .integer("author_user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("content").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.index(["post_id", "created_at"], "idx_study_group_comments_post_created");
    table.index(["parent_comment_id"], "idx_study_group_comments_parent");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("study_group_post_comments");
  await knex.schema.dropTableIfExists("study_group_posts");
  await knex.schema.dropTableIfExists("study_group_assignments");
  await knex.schema.dropTableIfExists("study_group_members");
  await knex.schema.dropTableIfExists("study_groups");
};
