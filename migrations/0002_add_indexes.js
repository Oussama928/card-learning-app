/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    //indexing for faster look ups for all the following 
  await knex.schema.alterTable('notifications', (table) => {
    table.index(['user_id', 'created_at'], 'idx_notifications_user_created');
    table.index('user_id', 'idx_notifications_user');
  });

  await knex.schema.alterTable('cards', (table) => {
    table.index('user_id', 'idx_cards_user');
  });

  await knex.schema.alterTable('words', (table) => {
    table.index('card_id', 'idx_words_card');
  });

  await knex.schema.alterTable('user_progress', (table) => {
    table.index('user_id', 'idx_user_progress_user');
    table.index('word_id', 'idx_user_progress_word');
  });

  await knex.schema.alterTable('favorites', (table) => {
    table.index('user_id', 'idx_favorites_user');
    table.index('card_id', 'idx_favorites_card');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('notifications', (table) => {
    table.dropIndex(['user_id', 'created_at'], 'idx_notifications_user_created');
    table.dropIndex('user_id', 'idx_notifications_user');
  });

  await knex.schema.alterTable('cards', (table) => {
    table.dropIndex('user_id', 'idx_cards_user');
  });

  await knex.schema.alterTable('words', (table) => {
    table.dropIndex('card_id', 'idx_words_card');
  });

  await knex.schema.alterTable('user_progress', (table) => {
    table.dropIndex('user_id', 'idx_user_progress_user');
    table.dropIndex('word_id', 'idx_user_progress_word');
  });

  await knex.schema.alterTable('favorites', (table) => {
    table.dropIndex('user_id', 'idx_favorites_user');
    table.dropIndex('card_id', 'idx_favorites_card');
  });
};
