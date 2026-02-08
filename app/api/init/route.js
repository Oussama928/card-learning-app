import db from "../../../lib/db";

export async function GET(req) {
  //modify later as this is a security risk
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY, 
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW(),
      image VARCHAR(511),
      role ENUM('user', 'admin') DEFAULT 'user',
      bio TEXT DEFAULT NULL,
      country VARCHAR(100) DEFAULT NULL,
    )`,
    `CREATE TABLE IF NOT EXISTS cards (
      id INT AUTO_INCREMENT PRIMARY KEY, 
      title VARCHAR(255) NOT NULL,
      description TEXT,
      target_language VARCHAR(255) NOT NULL,
      user_id INT NOT NULL,
      total_words INT DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS words (
      id INT AUTO_INCREMENT PRIMARY KEY, 
      word VARCHAR(255) NOT NULL,
      card_id INT NOT NULL,
      translated_word VARCHAR(255),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    )`,
    `CREATE TABLE IF NOT EXISTS favorites (
      id INT AUTO_INCREMENT PRIMARY KEY, 
      user_id INT NOT NULL,
      card_id INT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_progress (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT,
      word_id INT,
      is_learned BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (word_id) REFERENCES words(id),
      UNIQUE(user_id, word_id)
    )`,
    `CREATE TABLE user_stats (
      user_id INT PRIMARY KEY,
      total_terms_learned INT DEFAULT 0,
      daily_streak INT DEFAULT 0,
      accuracy DECIMAL(5,2) DEFAULT 0.00,
      xp INT DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('streak', 'system', 'feature', 'reminder') NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`,
  ];
  //last_login_date DATE

  for (const query of queries) {
    db.query(query, (err) => {
      if (err) {
        console.error(err);
        return new Response(
          JSON.stringify({ error: "Failed to create tables" }),
          { status: 500 }
        );
      }
    });
  }

  return new Response(
    JSON.stringify({ message: "Tables created successfully!" }),
    { status: 200 }
  );
}
