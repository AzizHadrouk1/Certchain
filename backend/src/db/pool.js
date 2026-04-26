const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    '⚠️  DATABASE_URL is not set. Start Postgres (docker compose up -d) and set DATABASE_URL in .env'
  );
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err);
});

module.exports = { pool };
