const { Pool } = require('pg');
const { env } = require('./env');

const db = new Pool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  port: env.db.port,
  ssl: env.db.ssl,
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

db.queryAsync = (sql, values) => {
  return db.query(sql, values);
};

db.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = db;