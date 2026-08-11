/**
 * Vector store (Postgres/pgvector via Supabase) consistency diagnostic.
 *
 * Usage:  node scripts/check-vector-store.js
 *
 * Answers the "silent failure" questions:
 *  1. Is DATABASE_URL set and reachable?
 *  2. Is the pgvector extension installed on this database?
 *  3. Does the memory_chunks table exist, and how many chunks are stored?
 */
require('dotenv').config();

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

async function main() {
  console.log('='.repeat(72));
  console.log('VECTOR STORE CONSISTENCY CHECK (Postgres/pgvector)');
  console.log('='.repeat(72));

  if (!connectionString) {
    console.log('\nFAILURE: DATABASE_URL is not set in .env.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    console.log('\n[1] Connecting to Postgres (DATABASE_URL)...');
    await pool.query('SELECT 1');
    console.log('    SUCCESS: database reachable.');

    console.log('\n[2] Checking for the pgvector extension...');
    const ext = await pool.query("SELECT 1 FROM pg_extension WHERE extname = 'vector'");
    if (ext.rows.length > 0) {
      console.log('    SUCCESS: pgvector extension is installed.');
    } else {
      console.log('    MISSING: run `CREATE EXTENSION IF NOT EXISTS vector;` (or `npm run db:init`).');
    }

    console.log('\n[3] Checking memory_chunks table...');
    try {
      const count = await pool.query('SELECT COUNT(*)::int AS count FROM memory_chunks');
      const chunkCount = count.rows[0].count;
      console.log(`    memory_chunks reachable. chunk count = ${chunkCount}${chunkCount === 0 ? '  <-- ZERO chunks stored' : ''}`);
    } catch (err) {
      console.log(`    memory_chunks table NOT found: ${err.message}`);
      console.log('    -> Run `npm run db:init` to create it.');
    }
  } catch (err) {
    console.log(`\nFAILURE: could not reach the database.`);
    console.log(`Error detail: ${err.message || err}`);
  } finally {
    await pool.end();
  }

  console.log('\n' + '='.repeat(72));
}

main().catch((err) => {
  console.error('check-vector-store.js crashed:', err);
  process.exit(1);
});
