const { Pool } = require('pg');

const db = new Pool({
  host: 'localhost',
  user: 'ous223',
  password: '',
  database: 'cardApp',
  port: 5432,
});

const queries = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    image VARCHAR(511),
    role VARCHAR(50) DEFAULT 'user',
    bio TEXT,
    country VARCHAR(100)
  )`,
  `CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_language VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    total_words INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(255) NOT NULL,
    card_id INT NOT NULL,
    translated_word VARCHAR(255),
    FOREIGN KEY (card_id) REFERENCES cards(id)
  )`,
  `CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    card_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES cards(id)
  )`,
  `CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INT,
    word_id INT,
    is_learned BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (word_id) REFERENCES words(id),
    UNIQUE(user_id, word_id)
  )`,
  `CREATE TABLE IF NOT EXISTS user_stats (
    user_id INT PRIMARY KEY,
    total_terms_learned INT DEFAULT 0,
    daily_streak INT DEFAULT 0,
    accuracy DECIMAL(5,2) DEFAULT 0.00,
    xp INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`
];

async function runMigrations() {
  try {
    console.log('Starting migrations...');
    for (const query of queries) {
      await db.query(query);
      console.log('Table created');
    }
    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
