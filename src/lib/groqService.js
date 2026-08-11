import dotenv from "dotenv";

dotenv.config();

const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1";
const GROQ_API_KEY = process.env.GROQ_API_KEY || null;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

if (!GROQ_API_URL || !GROQ_API_KEY) {
  console.warn("GROQ_API_URL or GROQ_API_KEY not configured. Groq calls will fail until set.");
}

// Extract text from an image URL using a Groq vision model (placeholder implementation).
export async function extractTextFromImageUrl(imageUrl) {
  if (!GROQ_API_URL || !GROQ_API_KEY) throw new Error("Groq API not configured");
  const res = await fetch(`${GROQ_API_URL}/vision/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model: "qwen/vision-1", url: imageUrl }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Groq vision request failed: ${res.status} ${t}`);
  }
  const json = await res.json();
  // expected: { text: "..." }
  return json.text || json.extracted_text || null;
}

// Generate an answer using the Groq LLM (qwen/qwen3.6-27b) given a prompt/context
export async function generateAnswerWithGroqLLM({ systemPrompt = "", contextChunks = [], question = "" }) {
  if (!GROQ_API_URL || !GROQ_API_KEY) throw new Error("Groq API not configured");

  const context = contextChunks
    .map((chunk, index) => `Chunk ${index + 1}: ${chunk.text_chunk || chunk.text || ""}`)
    .join("\n\n");
  const userMessage = context
    ? `User-document context:\n${context}\n\nUser question: ${question}`
    : question;
  const baseUrl = GROQ_API_URL.replace(/\/$/, "");

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 512,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Groq LLM request failed: ${res.status} ${t}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content || json.output || null;
}

export default { extractTextFromImageUrl, generateAnswerWithGroqLLM };
