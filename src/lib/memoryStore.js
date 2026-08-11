const API_BASE = "/api/memories";

function normalizeMemory(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    date: row.date,
    year: row.year,
    fileName: row.file_name,
    fileType: row.file_type,
    preview: row.preview,
    textContent: row.text_content,
    url: row.url,
    deleted: row.deleted,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    fileSize: row.file_size,
    location: row.location,
    indexing: row.indexing,
  };
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Memory API request failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getMemories(includeDeleted = false) {
  const url = `${API_BASE}?includeDeleted=${includeDeleted ? "true" : "false"}`;
  const rows = await fetchJson(url);
  return rows.map(normalizeMemory);
}

export async function getAllMemoriesRaw() {
  return getMemories(true);
}

export async function addMemory(memory) {
  const row = await fetchJson(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...memory,
      fileSize: memory.fileSize || 0,
      fileName: memory.fileName || memory.file_name || null,
      fileType: memory.fileType || memory.file_type || null,
      textContent: memory.textContent || memory.text_content || null,
    }),
  });
  return normalizeMemory(row);
}

export async function updateMemories(ids, updates) {
  const rows = await fetchJson(API_BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, updates }),
  });
  return rows.map(normalizeMemory);
}

export async function deleteMemories(ids) {
  const rows = await fetchJson(API_BASE, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  return rows.map(normalizeMemory);
}

export async function restoreMemories(ids) {
  return updateMemories(ids, { deleted: false, deletedAt: null });
}

export async function getTotalStorageBytes() {
  const memories = await getMemories(false);
  return memories.reduce((sum, m) => sum + (m.fileSize || 0), 0);
}
