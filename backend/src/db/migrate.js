const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

function splitSqlStatements(sql) {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
}

/**
 * Applies backend/db/schema.sql (idempotent CREATE IF NOT EXISTS).
 */
async function runSchemaIfNeeded() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run database migrations');
  }
  const schemaPath = path.join(__dirname, '../../db/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    return;
  }
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const statements = splitSqlStatements(sql);
  const client = await pool.connect();
  try {
    for (const st of statements) {
      await client.query(`${st};`);
    }
    console.log('✅ Database schema applied');
  } finally {
    client.release();
  }
}

module.exports = { runSchemaIfNeeded };
