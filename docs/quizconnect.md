---
rag:
  id: quizconnect
  type: project
  title: QuizConnect
  aliases: [quiz connect, multiplayer quiz, QuizzConnect, real-time quiz]
---

# QuizConnect

> Portfolio knowledge source. Facts about Frederick Aurelio Halim's QuizConnect project only.

## 1. At a glance
<!-- rag-section: at-a-glance -->
QuizConnect is a real-time multiplayer quiz platform by Frederick Aurelio Halim.
- **Summary:** Users create and host live quiz games with shareable codes. Players join, answer timed questions in synchronized phases, and see a live leaderboard. After a game, history is saved for review — including LLM-generated explanations and session analytics.
- **Category:** Full-stack web app — React SPA, Express API, Socket.IO, BullMQ worker.
- **Status:** Active prototype — live on a VPS, deployed via GitHub Actions.
- **Repo:** https://github.com/FrederickAurelio/QuizConnect
- **Live demo:** http://120.26.45.50:3221/ (Docker Compose stack on VPS)

## 2. Problem & purpose
<!-- rag-section: 2-problem-purpose -->
- **Who it's for:** Learners, teachers/hosts, and quiz participants in classroom or training settings.
- **Problem:** Many live quiz tools lose learning value after the session — results aren't preserved or reused.
- **Solution:** Synchronized live gameplay plus durable game history and LLM-assisted review (explanations, analytics, quiz generation from uploaded material).

## 3. Features
<!-- rag-section: 3-features -->
**Quizzes & authoring**
- Create, edit, publish, and duplicate quiz sets with validation (≥3 questions, 4 options each).
- Client-side draft auto-save; AI quiz generation from uploaded PDF/TXT.

**Live games**
- Host sessions with game codes; join lobby over WebSockets.
- Server-driven phases: Cooldown → Question → Result, with early skip when everyone answers.
- Configurable settings: player count, timers, shuffle questions/answers, host-can-play mode.
- Speed-based scoring with live leaderboard.

**History & AI**
- Frozen game snapshots saved to MongoDB (summary, quiz detail, per-player results).
- AI answer explanations (optional Tavily web grounding) and session analytics.
- AI quiz generation pipeline: upload → text extraction → chunked LLM calls → editable draft.

**Auth**
- Email/password with verification, guest sessions, guest→user history migration on signup.

## 4. Tech stack
<!-- rag-section: 4-tech-stack -->
- **Frontend:** React 19, Vite, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS 4, Radix/shadcn UI, Socket.IO client.
- **Backend:** Node.js, Express 5, TypeScript, Mongoose (MongoDB), Redis, Socket.IO, BullMQ.
- **Auth:** Session cookies (`express-session` + `connect-mongo`), bcrypt passwords.
- **AI / external:** OpenRouter (LLM), Tavily (web search), Brevo (email).
- **Infra:** Docker Compose — MongoDB, Redis, Node backend, Nginx (serves React build, proxies REST + Socket.IO). GitHub Actions workflow deploys to VPS over SSH on push to `main`.

## 5. Architecture
<!-- rag-section: 5-architecture -->
Monorepo: `frontend/` (React SPA) + `backend/` (Express + Socket.IO + in-process BullMQ worker).

- **REST:** SPA → Nginx → Express → Mongoose/Redis.
- **Real-time:** Socket.IO with session auth; lobby state in Redis; broadcasts to game rooms.
- **Game timing:** Phase transitions scheduled as BullMQ delayed jobs (survives restarts).
- **AI generation:** Upload → prepare materials → queue job → per-chunk LLM fan-out → finalize → draft quiz.
- **History:** Three MongoDB collections — query summary, frozen quiz snapshot, per-player answers.

**Deployment (Docker + CI/CD)**
- **Containers:** `mongodb`, `redis`, `app` (Express + Socket.IO + BullMQ worker), `web` (Nginx on port 3221).
- **Nginx:** Serves the Vite-built SPA; reverse-proxies `/api` to the backend and `/socket.io` for WebSocket upgrades — one public port for the whole app.
- **CI/CD:** `.github/workflows/deploy.yml` — on push to `main` (or manual trigger), GitHub Actions SSHes into the VPS, `git fetch` + `git reset --hard origin/main`, then `docker compose up -d --build`. Secrets: `VPS_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`.
- **Why it matters:** Not just localhost — the same compose file runs locally and in production; deploy is automated after merge.

## 6. Notable technical decisions & trade-offs
<!-- rag-section: 6-notable-technical-decisions-trade-offs -->
- **Redis for live state, MongoDB for durable data** — fast game state vs. persistent records.
- **BullMQ for game timers** — crash-resilient phase transitions instead of in-memory `setTimeout`.
- **Three-layer history model** — immutable post-game review even if the quiz is edited later.
- **AI finalize returns indexes, not rewritten questions** — smaller LLM output, fewer parse failures.
- **Singleflight + caching for AI explain/analytics** — coalesce concurrent requests, cut redundant LLM calls.
- **At-most-one active AI generation per user** — MongoDB partial unique index + Redis lock.

## 7. Interesting / hard problems solved
<!-- rag-section: 7-interesting-hard-problems-solved -->
- **Server-authoritative synchronized game phases** with early-advance when all players answer.
- **PDF text reconstruction** from structured `unpdf` output using geometry heuristics (row grouping, CJK-aware joining, hyphenation repair).
- **Adaptive chunking for LLM cost control** with bounded-concurrency chunk fan-out.
- **Speed-based scoring via Redis atomics** — order bonus from a decrementing per-question counter.
- **Guest→user history migration** on registration without blocking signup.
- **Push-to-deploy pipeline** — containerized stack + GitHub Actions SSH deploy so WebSocket games and BullMQ timers run on a real server, not only in dev.
