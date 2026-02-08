const { Pool } = require('pg');

const db = new Pool({
  host: 'localhost',
  user: 'ous223',  
  password: '',     
  database: 'cardApp',
  port: 5432,
});

db.queryAsync = (sql, values) => {
  return db.query(sql, values);
};

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to the database');
});

module.exports = db;