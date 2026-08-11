# Life Lens AI

Life Lens AI is a Next.js application for managing memories, uploads, search, and chat with a retrieval-augmented generation (RAG) layer. Both relational data and vector embeddings live in a single Supabase Postgres database (via the [pgvector](https://github.com/pgvector/pgvector) extension) — no separate vector server to run or host.

## Project structure

- [src/app](src/app) — Next.js app routes and API endpoints
  - [src/app/api/ai/query](src/app/api/ai/query) — RAG chat endpoint
  - [src/app/api/memories](src/app/api/memories) — memory create/read/update/delete API (also runs the chunk → embed → index pipeline)
  - [src/app/chat](src/app/chat) — chat UI
  - [src/app/upload](src/app/upload) — upload experience
- [src/components](src/components) — reusable UI components
- [src/lib](src/lib) — shared utilities and services
  - [src/lib/db.js](src/lib/db.js) — Postgres connection, table initialization, and the pgvector extension/schema
  - [src/lib/embeddings.js](src/lib/embeddings.js) — local embedding generation with Xenova Transformers
  - [src/lib/vectorStore.js](src/lib/vectorStore.js) — pgvector-backed vector storage wrapper
  - [src/lib/groqService.js](src/lib/groqService.js) — Groq LLM integration
- [scripts](scripts) — database initialization and diagnostics
- [public](public) — static assets

## Tech stack

- Next.js 16
- React 19
- Supabase (PostgreSQL + pgvector) for both relational app data and vector search
- Xenova Transformers for offline embeddings
- Groq for LLM generation
- react-markdown for rendering formatted AI chat replies

## Prerequisites

Make sure you have:

- Node.js 18+ installed
- A [Supabase](https://supabase.com) project (free tier is enough)

## 1. Install dependencies

From the project root, run:

```bash
npm install
```

## 2. Provision Supabase and enable pgvector

1. Create a Supabase project (or use an existing one).
2. In the Supabase SQL editor, run:
   ```sql
   create extension if not exists vector;
   ```
   (or enable it via **Database → Extensions** in the dashboard).
3. Copy the **pooled connection string** (Settings → Database → Connection pooling, "Transaction" mode, port `6543`) rather than the direct connection. This matters because the app uses a connection pool, and short-lived serverless environments exhaust Postgres's direct connection limit quickly — the pooled string works fine for local dev too.

## 3. Configure environment variables

Copy [.env.example](.env.example) to `.env` and fill in your values:

```env
DATABASE_URL=postgresql://postgres.xxxxxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
GROQ_API_URL=https://api.groq.com/openai/v1
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-120b
```

The embedding layer runs locally (Xenova) and does not require an OpenAI or other embedding API key.

## 4. Initialize the database schema

```bash
npm run db:init
```

This creates the `memories`, `users`, `otps` tables plus the pgvector-backed `memory_chunks` table (with an HNSW cosine index) used for retrieval.

## 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## 6. RAG flow overview

When a user uploads a memory:

1. Text is extracted (client-side for text-like files, server-side for PDFs).
2. The text is chunked and embedded locally with Xenova Transformers.
3. Each chunk's embedding is stored in the `memory_chunks` table (pgvector).

When a user asks a question in chat:

1. The question is embedded locally using Xenova Transformers.
2. A pgvector cosine-distance query (`embedding <=> $1 ORDER BY ... LIMIT k`) finds the nearest chunks.
3. The top matching chunks are passed to Groq for answer generation.

### How to tell if an answer used your documents

Every AI reply in `/chat` shows a small badge under it:
- **📄 From your documents** — the answer used chunks retrieved from your uploaded memories (matched source file names are shown alongside it).
- **💬 General knowledge (not from your documents)** — no sufficiently close match was found, so Groq answered from general knowledge instead.

This is the fastest way to confirm ingestion is actually working end-to-end.

### Chat message formatting

AI replies are rendered with [react-markdown](https://github.com/remarkjs/react-markdown) (`src/app/chat/page.js`), so bold text, numbered/bulleted lists, code blocks, and paragraph breaks in Groq's responses render properly instead of showing raw markdown syntax. User-typed messages are shown as plain text.

## Troubleshooting ingestion

Symptom: an upload "succeeds," but chat never shows "From your documents" for a question about it.

1. Run `node scripts/check-vector-store.js` — confirms `DATABASE_URL` is reachable, the `vector` extension is installed, and reports the current `memory_chunks` row count.
2. Check the server logs for `[INGEST]` and `[vectorStore]` lines from the upload request — they report exactly where the pipeline stopped (no text extracted, embedding failed, or the database write failed).
3. In the upload UI, an amber "Saved, but not searchable yet" banner means the vector write failed even though the memory itself was saved — check `DATABASE_URL` and that `npm run db:init` has been run against it.

## Notes

- Postgres (Supabase) is the single source of truth for both relational app data (users, memories, entries) and vector embeddings.
- The local embedding model downloads once and then runs fully offline.
- Image uploads are stored but not indexed for search (no text/OCR extraction is performed on images yet).
