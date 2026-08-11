import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

const pool = globalThis.__pgPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

if (!globalThis.__pgPool) {
  globalThis.__pgPool = pool;
}

export async function query(text, params) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }
  return pool.query(text, params);
}

export async function ensureTables() {
  await query(`CREATE EXTENSION IF NOT EXISTS vector;`);

  await query(`
    CREATE TABLE IF NOT EXISTS memories (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
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
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS otps (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS memory_chunks (
      id TEXT PRIMARY KEY,
      memory_id BIGINT REFERENCES memories(id) ON DELETE CASCADE,
      chunk_index INTEGER,
      source_file TEXT,
      text TEXT,
      embedding VECTOR(384),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS memory_chunks_embedding_idx
      ON memory_chunks USING hnsw (embedding vector_cosine_ops);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS memory_chunks_memory_id_idx
      ON memory_chunks (memory_id);
  `);
}
