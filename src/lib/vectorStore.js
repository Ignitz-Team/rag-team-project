import dotenv from "dotenv";
import pgvector from "pgvector/pg";
import { query } from "./db";

dotenv.config();

console.log(
  "[vectorStore] Backend: Postgres/pgvector via DATABASE_URL (Supabase). " +
    "Vectors live in the memory_chunks table alongside relational data."
);

function normalizeChunk({ id, text, embedding, metadata = {} }) {
  const normalized = {
    id: String(id ?? `chunk-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    text: text ?? "",
    embedding: Array.isArray(embedding) ? embedding : [],
    metadata: metadata ?? {},
  };
  if (!Array.isArray(embedding) || embedding.length === 0) {
    console.warn(
      `[vectorStore] normalizeChunk: chunk "${normalized.id}" has NO or EMPTY embedding ` +
        `(expected 384 dims for all-MiniLM-L6-v2). Length=${Array.isArray(embedding) ? embedding.length : typeof embedding}. ` +
        `This chunk will be DROPPED and never stored.`
    );
  }
  return normalized;
}

function toChunkResult(row) {
  return {
    id: row.id,
    text: row.text ?? "",
    metadata: {
      memory_id: row.memory_id != null ? String(row.memory_id) : null,
      source_file: row.source_file || "unknown",
      chunk_index: row.chunk_index,
    },
    distance: row.distance != null ? Number(row.distance) : null,
    text_chunk: row.text ?? "",
  };
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : null;
}

// No-op kept for API compatibility with earlier Chroma-based code — there's
// no separate collection to create, the table is set up by ensureTables().
export async function initCollection() {
  return true;
}

// Add a single chunk with its embedding and metadata.
export async function addChunk(chunk) {
  const insertedIds = await addChunksBatch([chunk]);
  return insertedIds.length > 0;
}

// Add many chunks in one request for better ingestion performance.
export async function addChunksBatch(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    console.warn("[vectorStore] addChunksBatch called with an EMPTY/absent array — nothing to store.");
    return [];
  }

  const rawWithEmpty = chunks.filter((c) => !Array.isArray(c.embedding) || c.embedding.length === 0);
  if (rawWithEmpty.length > 0) {
    console.warn(
      `[vectorStore] addChunksBatch: ${rawWithEmpty.length} of ${chunks.length} incoming chunk(s) have empty embeddings (dims expected 384). These will be skipped.`
    );
  }

  const normalized = chunks
    .map(normalizeChunk)
    .filter((chunk) => Array.isArray(chunk.embedding) && chunk.embedding.length > 0);

  if (normalized.length === 0) {
    console.error(
      "[vectorStore] addChunksBatch ABORTED: after filtering, 0 chunks had a valid embedding — nothing was written."
    );
    return [];
  }

  const values = [];
  const rows = normalized.map((chunk, index) => {
    const base = index * 7;
    values.push(
      chunk.id,
      chunk.metadata.memory_id ?? null,
      chunk.metadata.chunk_index ?? index,
      chunk.metadata.source_file || "unknown",
      chunk.text,
      pgvector.toSql(chunk.embedding),
      normalizeEmail(chunk.metadata.user_email)
    );
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
  });

  try {
    await query(
      `INSERT INTO memory_chunks (id, memory_id, chunk_index, source_file, text, embedding, user_email)
       VALUES ${rows.join(", ")}
       ON CONFLICT (id) DO UPDATE SET
         memory_id = EXCLUDED.memory_id,
         chunk_index = EXCLUDED.chunk_index,
         source_file = EXCLUDED.source_file,
         text = EXCLUDED.text,
         embedding = EXCLUDED.embedding,
         user_email = EXCLUDED.user_email`,
      values
    );
    console.log(`[vectorStore] addChunksBatch SUCCESS: wrote ${normalized.length} chunk(s) to memory_chunks.`);
    return normalized.map((chunk) => chunk.id);
  } catch (error) {
    console.error(`[vectorStore] addChunksBatch FAILED writing ${normalized.length} chunk(s):`, error);
    return [];
  }
}

// Query for the top K nearest chunks by cosine distance, scoped to one
// user's own documents. userEmail is required — without it this fails safe
// (returns nothing) rather than risk searching across every user's data.
export async function queryTopK(queryEmbedding, k = 5, userEmail = null) {
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    console.warn(`[vectorStore] queryTopK: query embedding is empty (${typeof queryEmbedding}) — cannot search.`);
    return [];
  }
  const email = normalizeEmail(userEmail);
  if (!email) {
    console.error("[vectorStore] queryTopK ABORTED: no userEmail provided — refusing to search across all users' data.");
    return [];
  }

  try {
    const result = await query(
      `SELECT id, memory_id, chunk_index, source_file, text, embedding <=> $1 AS distance
       FROM memory_chunks
       WHERE user_email = $2
       ORDER BY embedding <=> $1
       LIMIT $3`,
      [pgvector.toSql(queryEmbedding), email, Math.max(1, Number(k) || 5)]
    );
    console.log(`[vectorStore] queryTopK returned ${result.rows.length} result(s) for user_email="${email}".`);
    return result.rows.map(toChunkResult);
  } catch (error) {
    console.error("[vectorStore] queryTopK FAILED:", error);
    return [];
  }
}

// Delete every chunk that belongs to a memory.
export async function deleteChunksByMemoryId(memoryId) {
  if (memoryId == null) return false;

  try {
    await query(`DELETE FROM memory_chunks WHERE memory_id = $1`, [memoryId]);
    console.log(`[vectorStore] deleteChunksByMemoryId: removed chunks for memory_id="${memoryId}".`);
    return true;
  } catch (error) {
    console.error(`[vectorStore] deleteChunksByMemoryId FAILED for memory_id="${memoryId}":`, error);
    return false;
  }
}

// Backward-compatible wrapper used by the existing app code.
export async function saveDocumentWithEmbeddings({ memoryId = null, source = null, userEmail = null, chunks = [] }) {
  const normalizedChunks = (chunks || []).map((chunk, index) => ({
    id: chunk.id || `${memoryId || "memory"}-${index}`,
    text: chunk.text || "",
    embedding: chunk.embedding || [],
    metadata: {
      memory_id: memoryId != null ? String(memoryId) : null,
      source_file: source || chunk.source_file || "unknown",
      chunk_index: index,
      user_email: userEmail,
      ...(chunk.metadata || {}),
    },
  }));

  const insertedIds = await addChunksBatch(normalizedChunks);
  return { insertedIds, memoryId, source };
}

export async function similaritySearch(queryEmbedding, topK = 5, userEmail = null) {
  return queryTopK(queryEmbedding, topK, userEmail);
}

// Diagnostic helper: used by this process and by scripts/check-vector-store.js.
// Reports whether the pgvector extension is installed and how many chunks
// are actually stored right now.
export async function debugVectorStore() {
  const summary = {
    backend: "postgres/pgvector",
    extensionInstalled: false,
    tableReachable: false,
    chunkCount: null,
    error: null,
  };
  try {
    const extResult = await query(`SELECT 1 FROM pg_extension WHERE extname = 'vector'`);
    summary.extensionInstalled = extResult.rows.length > 0;

    const countResult = await query(`SELECT COUNT(*)::int AS count FROM memory_chunks`);
    summary.tableReachable = true;
    summary.chunkCount = countResult.rows[0]?.count ?? 0;
  } catch (error) {
    summary.error = error?.message || String(error);
  }
  console.log("[vectorStore.debugVectorStore] " + JSON.stringify(summary, null, 2));
  return summary;
}

export default {
  initCollection,
  addChunk,
  addChunksBatch,
  queryTopK,
  saveDocumentWithEmbeddings,
  deleteChunksByMemoryId,
  similaritySearch,
  debugVectorStore,
};
