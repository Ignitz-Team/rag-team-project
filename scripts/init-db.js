require('dotenv').config();

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString });
  try {
    // Postgres (Supabase) stores both relational app data and, via pgvector,
    // the chunk embeddings used for retrieval.
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE IF NOT EXISTS memories (
        id BIGSERIAL PRIMARY KEY,
        title TEXT,
        description TEXT,
        category TEXT,
        date DATE,
        year TEXT,
        file_name TEXT,
        file_type TEXT,
        preview TEXT,
        text_content TEXT,
        url TEXT,
        deleted BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        file_size INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS otps (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS memory_chunks (
        id TEXT PRIMARY KEY,
        memory_id BIGINT REFERENCES memories(id) ON DELETE CASCADE,
        chunk_index INTEGER,
        source_file TEXT,
        text TEXT,
        embedding VECTOR(384),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS memory_chunks_embedding_idx
        ON memory_chunks USING hnsw (embedding vector_cosine_ops);

      CREATE INDEX IF NOT EXISTS memory_chunks_memory_id_idx
        ON memory_chunks (memory_id);
    `);
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
