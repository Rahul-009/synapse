# AI Chat — Multi-Agent Chat App

A full-stack multi-agent AI chat application. Messages are routed by a LangGraph
supervisor to one of five specialized agents, with real-time SSE token streaming,
RAG over uploaded documents, and a React UI.

## Architecture

```
frontend (React + Vite, :5173)
        │  /api/* (dev proxy)
        ▼
gateway (Express, :8000) ── JWT cookie auth, proxies to services
        ├── /api/auth  → auth service  (:8001) — register/login, MongoDB
        ├── /api/chat  → chat service  (:8002) — conversations/messages, MongoDB + Redis cache
        └── /api/agent → agent service (:8003) — LangGraph multi-agent + RAG
```

**Agents** (all LLM calls via Groq): a fast `llama-3.1-8b-instant` supervisor
classifies each message and dispatches to:

| Agent | Model | Purpose |
|---|---|---|
| 💬 chat | llama-3.3-70b-versatile | general conversation |
| ⌨️ coding | llama-3.3-70b-versatile | writing/debugging code |
| 📄 pdf | llama-3.3-70b-versatile | RAG Q&A over uploaded documents |
| 🔍 search | groq/compound-mini | live web search (built into the model) |
| 🖼️ image | qwen/qwen3.6-27b | image understanding (vision) |

**RAG pipeline**: upload (multer) → pdf-parse → chunk (LangChain splitter) →
embed (Gemini `gemini-embedding-001`) → Qdrant Cloud, isolated per conversation.

**Stack**: Express 5 (ESM), MongoDB Atlas (Mongoose), Upstash Redis (cache),
Qdrant Cloud (vectors), React 19 + Tailwind v4 + Zustand + Framer Motion,
Monaco editor artifact panel with HTML preview.

## Prerequisites

- Node.js 20+
- Free accounts / API keys:
  - [MongoDB Atlas](https://www.mongodb.com/atlas) — connection string
  - [Groq](https://console.groq.com) — `GROQ_API_KEY`
  - [Google AI Studio](https://aistudio.google.com) — `GOOGLE_API_KEY` (embeddings)
  - [Qdrant Cloud](https://cloud.qdrant.io) — cluster URL + API key
  - [Upstash](https://upstash.com) — Redis `rediss://` URL (optional; cache
    degrades gracefully without it)

## Environment files

Create a `.env` in each service directory (values are examples/placeholders):

`backend/gateway/.env`
```env
PORT=8000
AUTH_SERVICE="http://localhost:8001"
CHAT_SERVICE="http://localhost:8002"
AGENT_SERVICE="http://localhost:8003"
FRONTEND_URL="http://localhost:5173"
JWT_SECRET=<any-long-random-string>
```

`backend/services/auth/.env`
```env
PORT=8001
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/auth
JWT_SECRET=<same-value-as-gateway>
```

`backend/services/chat/.env`
```env
PORT=8002
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/chat
REDIS_URL=rediss://default:<password>@<name>.upstash.io:6379
```

`backend/services/agent/.env`
```env
PORT=8003
GROQ_API_KEY=<groq-key>
GOOGLE_API_KEY=<google-ai-studio-key>
QDRANT_URL=https://<cluster-id>.cloud.qdrant.io:6333
QDRANT_API_KEY=<qdrant-key>
```

> `JWT_SECRET` must be identical in the gateway and auth service — auth signs
> the cookie, the gateway verifies it.

## Install & run

Install dependencies once per package:

```bash
cd backend/gateway            && npm install
cd backend/services/auth      && npm install
cd backend/services/chat      && npm install
cd backend/services/agent     && npm install
cd frontend                   && npm install
```

Start everything (five terminals, order doesn't strictly matter but gateway
last is tidiest):

```bash
# terminal 1 — auth
cd backend/services/auth && npm run dev

# terminal 2 — chat
cd backend/services/chat && npm run dev

# terminal 3 — agent
cd backend/services/agent && npm run dev

# terminal 4 — gateway
cd backend/gateway && npm run dev

# terminal 5 — frontend
cd frontend && npm run dev
```

Open **http://localhost:5173**, register an account, and chat. The Vite dev
server proxies `/api/*` to the gateway, so cookies work without any CORS setup.

Each service exposes `GET /health` for a quick liveness check.

## Using the app

- **Auto routing**: just type — the supervisor picks the right agent (shown as
  a badge on each reply). Pills under the composer force a specific agent.
- **Documents**: attach a `.pdf`/`.txt`/`.md` — it's chunked, embedded, and
  indexed in Qdrant for that conversation; ask questions about it any time,
  even after a page reload. Scanned/image-only PDFs are not supported.
- **Images**: attach an image (max 4MB) and the vision agent describes/answers
  questions about it.
- **Code artifacts**: assistant code blocks have Copy / "Open in editor"
  buttons — the editor panel includes a live HTML preview tab.

## Notes

- The `backend/docker-compose.yml` runs a local Redis if you prefer it over
  Upstash (`REDIS_URL=redis://localhost:6379`); the cache is best-effort, so
  the app also runs fine with no Redis at all.
- Uploaded files land in `backend/services/agent/uploads/` (gitignored).
  Qdrant holds the indexed vectors, so the files themselves are disposable.
