import { NextResponse } from 'next/server';
import { embedText } from '@/lib/embeddings';
import { queryTopK } from '@/lib/vectorStore';
import { generateAnswerWithGroqLLM } from '@/lib/groqService';
import { getSessionEmail } from '@/lib/session';

// Chroma's cosine distance is lower for more similar documents. Results above
// this threshold are weak matches and should not influence a general answer.
const MAX_CONTEXT_DISTANCE = 0.75;

export async function POST(req) {
  try {
    const userEmail = getSessionEmail(req);
    if (!userEmail) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const { question, topK } = await req.json();
    if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 });

    const resultLimit = Math.max(1, Number(topK) || 5);
    let retrievedChunks = [];

    try {
      const qVec = await embedText(question);
      retrievedChunks = await queryTopK(qVec, resultLimit, userEmail);
    } catch (embeddingError) {
      // A retrieval outage should not stop the chatbot from answering normally.
      console.warn("Embedding retrieval unavailable; answering without document context:", embeddingError.message);
    }

    // Only use meaningful Chroma matches. A missing distance is retained because
    // some Chroma configurations do not return distance metadata.
    const contextChunks = retrievedChunks.filter((chunk) =>
      chunk.distance == null || chunk.distance <= MAX_CONTEXT_DISTANCE
    );
    const usedContext = contextChunks.length > 0;

    // Both paths use Groq. With context, it prioritizes the user's documents;
    // without context, it behaves as a normal general-knowledge chatbot.
    const answer = await generateAnswerWithGroqLLM({
      systemPrompt: usedContext
        ? "You are a helpful assistant. Prioritize the supplied user-document context, but supplement it with general knowledge when the context is incomplete."
        : "You are a helpful, conversational general-knowledge assistant. Answer the user's question directly and accurately.",
      contextChunks,
      question,
    });

    // Extract unique source file names from the matched document chunks
    const sources = usedContext
      ? Array.from(new Set(contextChunks.map((chunk) => chunk.metadata?.source_file).filter(Boolean)))
      : [];

    return NextResponse.json({ answer, top: contextChunks, usedContext, sources });
  } catch (err) {
    const message = err?.message || String(err);
    console.error('RAG query failed:', err);
    const status = /not configured|API key|not reachable|ChromaDB/.test(message) ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
