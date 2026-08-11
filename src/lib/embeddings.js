import dotenv from "dotenv";

dotenv.config();

let transformersModule = null;
let embedderPromise = null;

async function getTransformers() {
  if (!transformersModule) {
    const mod = await import("@xenova/transformers");
    transformersModule = mod;
  }
  return transformersModule;
}

async function getEmbedder() {
  if (!embedderPromise) {
    console.log("Loading embedding model (first run may take a moment)...");
    const { pipeline, env } = await getTransformers();
    env.allowLocalModels = true;
    embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { quantized: true });
  }
  return embedderPromise;
}

// Convert a plain array OR a typed array (Float32Array, etc.) into a plain
// number[] array. The Xenova pipeline returns Tensor.data as a typed array,
// which Array.isArray() does not detect — the old code treated that as empty.
function toNumberArray(values) {
  if (Array.isArray(values)) return values.map((value) => Number(value));
  if (ArrayBuffer.isView(values)) return Array.from(values, (value) => Number(value));
  return [];
}

function normalizeEmbedding(values) {
  return toNumberArray(values);
}

// The feature-extraction pipeline returns a single Tensor (never an array of
// tensors). Its .dims is [batch, embeddingDim] and .data is one flat typed
// array. Extract the single row for one text.
function sliceSingleRow(tensor) {
  if (tensor && ArrayBuffer.isView(tensor.data) && Array.isArray(tensor.dims)) {
    const cols = tensor.dims[tensor.dims.length - 1] || 0;
    const rowLength = cols && cols < tensor.data.length ? cols : tensor.data.length;
    return Array.from(tensor.data.slice(0, rowLength), (value) => Number(value));
  }
  return null;
}

// Generate a single embedding for one text chunk using a local ONNX model.
export async function generateEmbedding(text) {
  if (!text || typeof text !== "string") return [];

  const extractor = await getEmbedder();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  const row = sliceSingleRow(output);
  if (row) return row;
  return normalizeEmbedding(output?.data || output || []);
}

// Generate embeddings for multiple texts in one go. Returns an array of plain
// number[] arrays (one per input text).
export async function generateEmbeddingsBatch(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const extractor = await getEmbedder();
  const outputs = await extractor(texts, { pooling: "mean", normalize: true });

  // Normal path: single Tensor of shape [n, dims] with a flat .data array.
  if (outputs && ArrayBuffer.isView(outputs.data) && Array.isArray(outputs.dims) && outputs.dims.length >= 2) {
    const rows = outputs.dims[0];
    const cols = outputs.dims[1];
    const embeddings = [];
    for (let i = 0; i < rows; i++) {
      embeddings.push(Array.from(outputs.data.subarray(i * cols, (i + 1) * cols), (value) => Number(value)));
    }
    return embeddings;
  }

  // Fallback: some builds return an array of per-text tensors.
  if (Array.isArray(outputs)) {
    return outputs.map((value) => normalizeEmbedding(value?.data || value || []));
  }

  // Fallback: single tensor (one input) — wrap it in an array.
  const single = normalizeEmbedding(outputs?.data || outputs || []);
  return single.length ? [single] : [];
}

// Backward-compatible wrappers used by the app.
export async function embedText(text) {
  return generateEmbedding(text);
}

export async function embedTexts(texts) {
  return generateEmbeddingsBatch(texts);
}

export default { generateEmbedding, generateEmbeddingsBatch, embedText, embedTexts };
