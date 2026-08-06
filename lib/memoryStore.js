const KEY = "memories";

function getAllRaw() {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

function saveAll(memories) {
  localStorage.setItem(KEY, JSON.stringify(memories));
}

function estimateBytes(dataUrl) {
  if (!dataUrl) return 0;
  // rough base64 -> bytes conversion
  const base64 = dataUrl.split(",")[1] || "";
  return Math.floor((base64.length * 3) / 4);
}

export function getMemories(includeDeleted = false) {
  const all = getAllRaw();
  return includeDeleted ? all : all.filter((m) => !m.deleted);
}

export function getAllMemoriesRaw() {
  return getAllRaw();
}

export function addMemory(memory) {
  const memories = getAllRaw();
  const newMemory = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    deleted: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    fileSize: estimateBytes(memory.preview),
    ...memory,
  };
  memories.unshift(newMemory);
  saveAll(memories);
  return newMemory;
}

export function updateMemories(ids, updates) {
  const memories = getAllRaw().map((m) =>
    ids.includes(m.id) ? { ...m, ...updates } : m
  );
  saveAll(memories);
}

export function deleteMemories(ids) {
  const memories = getAllRaw().map((m) =>
    ids.includes(m.id)
      ? { ...m, deleted: true, deletedAt: new Date().toISOString() }
      : m
  );
  saveAll(memories);
}

export function restoreMemories(ids) {
  const memories = getAllRaw().map((m) =>
    ids.includes(m.id) ? { ...m, deleted: false, deletedAt: null } : m
  );
  saveAll(memories);
}

export function getTotalStorageBytes() {
  return getMemories(false).reduce((sum, m) => sum + (m.fileSize || 0), 0);
}