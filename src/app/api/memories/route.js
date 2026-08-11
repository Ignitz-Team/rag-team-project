import { NextResponse } from "next/server";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { query, ensureTables } from "@/lib/db";
import { embedTexts } from "@/lib/embeddings";
import { saveDocumentWithEmbeddings, deleteChunksByMemoryId } from "@/lib/vectorStore";
import { withErrorHandling } from "@/lib/apiRoute";
import { getSessionEmail } from "@/lib/session";

async function init() {
  await ensureTables();
}

// pdf.js derives its worker path relative to the bundled pdf.mjs chunk, which
// breaks under Next.js bundling ("Setting up fake worker failed: Cannot find
// module ...pdf.worker.mjs"). Under Turbopack, require.resolve() returns
// virtual paths like "[project]\...pdf.worker.mjs [app-route] (ecmascript)",
// so pin workerSrc to the real on-disk worker file instead.
{
  try {
    const workerPath = path.join(
      process.cwd(),
      "node_modules",
      "pdfjs-dist",
      "legacy",
      "build",
      "pdf.worker.mjs"
    );
    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).toString();
  } catch (error) {
    console.warn("[INGEST] Could not resolve pdf.js worker:", error?.message || error);
  }
}

function normalizeUpdates(updates) {
  const mapping = {
    fileName: "file_name",
    fileType: "file_type",
    textContent: "text_content",
    deletedAt: "deleted_at",
  };

  return Object.entries(updates).reduce((acc, [key, value]) => {
    const normalizedKey = mapping[key] || key;
    acc[normalizedKey] = value;
    return acc;
  }, {});
}

function chunkText(text, chunkSize = 800, overlap = 120) {
  if (!text || typeof text !== "string") return [];
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks = [];
  for (let index = 0; index < normalized.length; index += chunkSize - overlap) {
    const chunk = normalized.slice(index, index + chunkSize).trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

// Extract plain text from a PDF that was uploaded as a base64 data URL
// (client-side preview). Only used when the browser could not provide text.
async function extractPdfText(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return "";
  const base64 = dataUrl.split(",").pop() || "";
  if (!base64) return "";

  const data = new Uint8Array(Buffer.from(base64, "base64"));
  const doc = await pdfjs.getDocument({ data }).promise;
  try {
    let text = "";
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str || "").join(" ") + "\n";
    }
    return text.replace(/\s+/g, " ").trim();
  } finally {
    await doc.destroy();
  }
}

// Chunk -> embed -> store a memory's text in the vector store. Used by POST
// (create), PATCH (text_content update / restore) and kept idempotent per
// memory id. Returns a result so callers/the UI can tell when indexing
// silently failed instead of assuming success.
async function indexMemory(memory) {
  const textContent = memory?.text_content || "";
  const chunks = chunkText(textContent);
  if (chunks.length === 0) {
    console.warn(`[INGEST] indexMemory: memory id=${memory?.id} has no text to index (${textContent.length} chars).`);
    return { indexed: false, chunkCount: 0, reason: "no_text_content" };
  }

  try {
    const embeddings = await embedTexts(chunks);
    const sourceFile = memory.file_name || "unknown";
    const result2 = await saveDocumentWithEmbeddings({
      memoryId: memory.id,
      source: sourceFile,
      userEmail: memory.user_email,
      chunks: chunks.map((text, index) => ({
        id: `memory-${memory.id}-chunk-${index}`,
        text,
        embedding: embeddings[index],
        metadata: { source_file: sourceFile, chunk_index: index },
      })),
    });
    console.log(
      `[INGEST] indexMemory: memory id=${memory.id} -> insertedIds=[${result2.insertedIds.join(",")}] ` +
        `(empty array here = vector store write failed/skipped — see vectorStore logs above).`
    );
    const indexed = result2.insertedIds.length > 0;
    return { indexed, chunkCount: result2.insertedIds.length, reason: indexed ? null : "vector_store_write_failed" };
  } catch (vectorError) {
    console.error(`[INGEST] indexMemory: embedding or vector store indexing failed for memory id=${memory.id}:`, vectorError);
    return { indexed: false, chunkCount: 0, reason: vectorError?.message || "embedding_or_index_error" };
  }
}

// Remove every Chroma chunk that belongs to a memory (soft-delete/delete sync).
async function removeMemoryFromIndex(memoryId) {
  try {
    await deleteChunksByMemoryId(memoryId);
  } catch (error) {
    console.error(`[INGEST] removeMemoryFromIndex: failed for memory id=${memoryId}:`, error);
  }
}

export const GET = withErrorHandling(async function GET(req) {
  await init();
  const userEmail = getSessionEmail(req);
  if (!userEmail) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const url = new URL(req.url);
  const includeDeleted = url.searchParams.get("includeDeleted") === "true";
  const sql = includeDeleted
    ? "SELECT * FROM memories WHERE user_email = $1 ORDER BY created_at DESC"
    : "SELECT * FROM memories WHERE user_email = $1 AND deleted = false ORDER BY created_at DESC";
  const result = await query(sql, [userEmail]);
  return NextResponse.json(result.rows);
});

export const POST = withErrorHandling(async function POST(req) {
  await init();
  const userEmail = getSessionEmail(req);
  if (!userEmail) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  console.log(
    "[INGEST] Stage 1 — request body received. fileName=", body.fileName,
    "fileType=", body.fileType,
    "textContent length:", (body.textContent || "").length,
  );

  const {
    title,
    description,
    category,
    date,
    year,
    fileName,
    fileType,
    preview,
    textContent,
    url,
    fileSize,
    location,
  } = body;

  // ---- Stage 1.5: server-side PDF text extraction (client never extracts PDFs) ----
  let resolvedText = textContent || "";
  const isPdf = fileType === "application/pdf" || (fileName || "").toLowerCase().endsWith(".pdf");
  if (!resolvedText && isPdf) {
    try {
      resolvedText = await extractPdfText(preview);
      console.log(`[INGEST] Stage 1.5 — server-side PDF text extraction: textContent length=${resolvedText.length}`);
    } catch (pdfError) {
      console.warn(`[INGEST] Stage 1.5 — PDF text extraction FAILED for "${fileName || "unknown"}":`, pdfError?.message || pdfError);
      resolvedText = "";
    }
  }

  // ---- Stage 2: persist memory row (Postgres) ----
  const result = await query(
    `INSERT INTO memories
      (title, description, category, date, year, file_name, file_type, preview, text_content, url, file_size, user_email, location)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      title || null,
      description || null,
      category || null,
      date || null,
      year || null,
      fileName || null,
      fileType || null,
      preview || null,
      resolvedText || null,
      url || null,
      fileSize || 0,
      userEmail,
      location || null,
    ]
  );

  const storedMemory = result.rows[0];
  console.log(
    `[INGEST] Stage 2 — memory row saved. id=${storedMemory.id} text_content_length=${(storedMemory.text_content || "").length}`
  );

  // ---- Stage 3-5: chunking + embeddings + vector store write ----
  const indexing = await indexMemory(storedMemory);

  return NextResponse.json({ ...storedMemory, indexing });
});

export const PATCH = withErrorHandling(async function PATCH(req) {
  await init();
  const userEmail = getSessionEmail(req);
  if (!userEmail) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const ids = Array.isArray(body.ids) ? body.ids : [];
  const updates = normalizeUpdates(body.updates || {});

  if (ids.length === 0 || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const allowed = [
    "title",
    "description",
    "category",
    "date",
    "year",
    "file_name",
    "file_type",
    "preview",
    "text_content",
    "url",
    "deleted",
    "deleted_at",
    "file_size",
    "location",
  ];

  const entries = Object.entries(updates).filter(([key]) => allowed.includes(key));

  if (entries.length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const setClauses = entries.map(([key], index) => `${key} = $${index + 1}`);
  const params = entries.map(([, value]) => value);
  const idsParamIndex = params.push(ids);
  const emailParamIndex = params.push(userEmail);

  const result = await query(
    `UPDATE memories SET ${setClauses.join(", ")}
     WHERE id = ANY($${idsParamIndex}) AND user_email = $${emailParamIndex}
     RETURNING *`,
    params
  );

  // Sync the vector index when a memory's text or deletion state changed.
  const touchesIndex = entries.some(([key]) =>
    ["text_content", "deleted", "deleted_at"].includes(key)
  );
  const indexingByRowId = {};
  if (touchesIndex) {
    for (const row of result.rows) {
      await removeMemoryFromIndex(row.id);
      if (!row.deleted) {
        indexingByRowId[row.id] = await indexMemory(row);
      }
    }
  }

  const rowsWithIndexing = result.rows.map((row) => ({
    ...row,
    indexing: indexingByRowId[row.id],
  }));

  return NextResponse.json(rowsWithIndexing);
});

export const DELETE = withErrorHandling(async function DELETE(req) {
  await init();
  const userEmail = getSessionEmail(req);
  if (!userEmail) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const ids = Array.isArray(body.ids) ? body.ids : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await query(
    "UPDATE memories SET deleted = true, deleted_at = NOW() WHERE id = ANY($1) AND user_email = $2 RETURNING *",
    [ids, userEmail]
  );

  for (const row of result.rows) {
    await removeMemoryFromIndex(row.id);
  }

  return NextResponse.json(result.rows);
});
