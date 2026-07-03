# QuizConnect

## 1. At a glance
- **One-line summary (factual):** A real-time multiplayer quiz platform where authenticated users create/edit quizzes, host live game sessions joined via a game code, play synchronized rounds over WebSockets, review persistent game history, and use LLM-assisted features (quiz generation from PDF/text, answer explanation, and session analytics).
- **Category:** Full-stack web application (real-time multiplayer game + REST API + AI features). Frontend is a React single-page app; backend is an Express API with Socket.IO and a BullMQ worker.
- **Solo or team:** Solo. Git shows a single contributor across all 125 commits: Frederick Aurelio Halim (`frederick.ah88@gmail.com`).
- **My role:** Sole author of the entire codebase — frontend, backend, real-time layer, data models, AI integration, Docker/CI, and accompanying thesis/slide documentation (inferred from being the only committer).
- **Status:** Actively developed prototype. Last commit `2026-07-02`, ongoing for ~7 months. Deployment tooling exists (GitHub Actions → VPS). Whether a public production instance is currently live: No evidence in repo (unverified). The associated thesis explicitly calls it a "prototype, not a commercial-scale platform."
- **First commit / last commit / total commits:** First `2025-11-28`, last `2026-07-02`, `125` commits total.
- **Repo URL:** `git@github.com:FrederickAurelio/QuizConnect.git` (from `git remote -v`).
- **Live/demo URL:** None found in `README.md` or configs. The `slides/` deck has a `netlify.toml` and `vercel.json` (slides hosting config), but no concrete deployed app URL is present in the repo (unverified).

## 2. Problem & purpose
- **Who it's for:** Learners, teachers/hosts, and quiz participants in classroom, training, or informal learning settings. It is an academic thesis project (inferred from `zthesis/` chapters and `slides/` defense deck), so the primary audience also includes the author's thesis supervisors.
- **What problem it solves / why it exists:** Per the thesis abstract (`zthesis/1. Abstract.md`) and Chapter 1, many live quiz systems provide in-the-moment participation (codes, timers, scores, leaderboards) but lose learning value because detailed results are not preserved or reused after the session. QuizConnect combines synchronized live gameplay with durable per-game history and LLM-assisted review/generation to extend the session into a reusable learning resource.
- **What it does, in plain language:** Users sign up (or play as an auto-created guest), build multiple-choice quizzes (manually or by having an LLM generate a draft from uploaded PDF/TXT material), and host a live game with a shareable code. Players join, answer timed questions in synchronized Cooldown → Question → Result phases, and see a live leaderboard. When the game ends, a frozen snapshot of the quiz, settings, and every player's answers is saved to MongoDB. Players can later review a game, request an AI explanation for any question, and generate AI session analytics summarizing strengths, weaknesses, and recommendations.

## 3. Features
Quizzes & authoring
- Create, edit, delete, and list quiz sets (`backend/src/api/quiz/`, routes in `router.ts`).
- Draft vs published dual-state model; publishing enforces rules in `Quiz.ts` `pre("save")`: ≥3 questions, each question titled, a correct key set, exactly 4 options, no empty option text.
- Quiz duplication/copy (`POST /api/quiz/copy/:id`) and draft revert (`DELETE /api/quiz/draft/:id`).
- Client-side auto-save draft hook (`frontend/src/hooks/use-auto-save-draft.ts`) with `throttle-debounce`.

Live games (real-time)
- Host a session and get a game code (`POST /api/sessions/host`).
- Join/lobby, start game, submit answers, kick players, close lobby, update settings, update profile — all over Socket.IO (`backend/src/sockets/lobby-socket.ts`).
- Configurable settings: `maxPlayers`, `questionCount`, `shuffleQuestions`, `shuffleAnswers`, `timePerQuestion`, `cooldown`, `hostCanPlay` (`GameSettings` in `redis/lobby.ts`).
- Game phases: Cooldown → Question → Result, server-driven; "everyone answered" early skip (`skipGameFlow`).
- Server-side per-question shuffling of questions and answer options at game start.
- Host dashboard: live view of who has answered (`question-dashboard` socket event) when `hostCanPlay` is false.
- Scoring: correct answers earn a base score (`ceil(playerCount/2)`) plus a speed/order bonus derived from a decrementing Redis counter (`lobby-socket.ts` `submit-answer`).

History
- On game end, three MongoDB documents are written: `HistoryQuery` (summary), `HistoryDetail` (frozen quiz snapshot + settings), and `HistoryPlayerResult` (per-player answers/scores/rank).
- Browse history list and per-game detail (`GET /api/history`, `GET /api/history/:gameId`).

AI-assisted features (OpenRouter LLMs)
- **AI quiz generation** from prepared PDF/TXT: upload → text extraction/cleaning/chunking (`ai-quiz-materials/material-text.ts`), then a chunk→finalize LLM pipeline (`ai-quiz-generations/orchestrator.ts`) producing an editable draft quiz.
- **AI answer explanation** for a completed question, with optional Tavily web grounding and cached results (`api/history/explain/`).
- **AI session analytics** summarizing strengths/weaknesses/recommendations from stored answers (`api/history/analytics/`).

Auth & accounts
- Email + password sign-up with emailed 6-digit verification code (Brevo), login, logout, password reset, profile editing.
- Guest auto-session bootstrap and guest→user history migration on registration (`migrate-guest-history.service.ts`).

Half-built / TODO / notes
- `NOTES.txt` lists "AI QUESTION CREATION.." as a missing feature and an optional "List of running session" feature — but AI quiz generation is in fact implemented (see `ai-quiz-generations/`), so `NOTES.txt` appears stale.
- Root `README.md` documents auth/quiz/sessions/history but does **not** mention the AI features that exist in code (README appears partially outdated).
- Several `.backup` files exist under `.github/workflows/` (`deploy.yml.backup`, `deploy-direct.yml.backup`) — prior deployment approaches kept as backups.

## 4. Tech stack
- **Languages:** TypeScript (frontend and backend), with HTML/CSS. Some SQL/none. Markdown for docs.
- **Frontend (versions from `frontend/package.json`):** React `^19.2.0`, Vite `^7.2.2`, React Router `^7.9.5`, TanStack React Query `^5.90.10`, React Hook Form `^7.66.0` + `@hookform/resolvers` `^5.2.2`, Zod `^4.1.12`, Axios `^1.13.2`, `socket.io-client` `^4.8.1`, `dayjs`, `uuid`, `throttle-debounce`, `react-intersection-observer`.
- **UI:** Tailwind CSS `^4.1.17` (`@tailwindcss/vite`), Radix UI primitives (avatar, dialog, popover, progress, radio-group, select, switch, tooltip, label, slot), shadcn-style components (`components.json`, `frontend/src/components/ui/*`), `lucide-react` icons, `sonner` toasts, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animated`, `next-themes`.
- **Backend (versions from `backend/package.json`):** Node.js (Docker uses `node:20-alpine`), Express `^5.1.0`, TypeScript `^5.9.3`, run in dev via `tsx watch`. `express-session` `^1.18.2` + `connect-mongo` `^5.1.0`, `cookie-parser`, `bcryptjs` `^3.0.3`, `multer` `^2.1.1`, `unpdf` `^1.6.2`, `zod` `^4.1.12`, `axios`, `date-fns`, `uuid`, `dotenv`.
- **Database / storage:** MongoDB via Mongoose `^8.19.3` (durable data: users, quizzes, drafts, history, AI records, prepared materials, verification codes; also session store via `connect-mongo`). Redis `^5.10.0` for transient lobby/game/answer state. Uploaded files are held in memory (`multer.memoryStorage`), not persisted to disk/object storage.
- **Auth:** Session-cookie auth (`express-session`, MongoDB-backed store, signed cookies, rolling expiry). Passwords hashed with bcrypt (salt rounds 12).
- **Third-party services / APIs:** OpenRouter (LLM chat completions), Tavily (web search for answer explanation), Brevo (transactional email for verification codes).
- **Real-time & jobs:** Socket.IO `^4.8.1` (server) for live updates; BullMQ `^5.71.0` for delayed game-step timers and lobby cleanup, backed by Redis.
- **Infra / deployment / CI:** Docker + Docker Compose (MongoDB, Redis, backend `app`, Nginx `web`); GitHub Actions deploy-over-SSH to a VPS (`.github/workflows/deploy.yml`); Nginx serves the SPA and proxies `/api` and `/socket.io` (`frontend/nginx.conf`).
- **Notable dev tooling:** ESLint `^9` + `typescript-eslint`, Prettier `^3.7.3` with `prettier-plugin-tailwindcss`, Vitest `^4.1.8` + `jsdom` (frontend tests), `tsx`/`nodemon` (backend). Slidev `@slidev/cli ^52.15.2` for the thesis defense deck (`slides/`).

## 5. Architecture
- **High-level structure:** Monorepo with two deployable apps plus infra and documentation.
  - `backend/` — Express REST API + Socket.IO server + in-process BullMQ worker (single Node service).
  - `frontend/` — React SPA built by Vite, served by Nginx in production.
  - Root — `docker-compose.yml` (+ `.dev-db.yml`, `.ci.yml`), `.github/workflows/`, `DOCKER.md`, `DEPLOY.md`, `README.md`.
  - `zdoc/`, `zthesis/`, `slides/` — design notes, thesis chapters, and defense slides (git-ignored working docs; see §15/§19).
- **Key backend directories (`backend/src/`):**
  - `api/` — feature modules each with `router.ts` + `controller.ts`: `auth`, `quiz`, `sessions`, `history` (+ `explain/`, `analytics/`), `ai-quiz-materials`, `ai-quiz-generations`.
  - `models/` — Mongoose schemas: `User`, `Quiz` (+ shared `questionSchema`), `QuizDraft`, `History` (three models: `HistoryQuery`, `HistoryDetail`, `HistoryPlayerResult`), `Verify`, `AiPreparedMaterial`, `AiQuizGenerationRecord`.
  - `redis/` — Redis client (`index.ts`) and lobby/game state helpers (`lobby.ts`).
  - `queues/` — BullMQ queues: `lobby-timer-queue.ts` (game-step + close-lobby jobs), `ai-quiz-generation-queue.ts` (generation worker).
  - `sockets/` — `index.ts` setup + `lobby-socket.ts` (all in-game events).
  - `utils/` — `openrouter.ts`, `tavilySearch.ts`, `brevo.ts`, `singleflight.ts`, `tools.ts` (e.g. `shuffleArray`), `handle-control-error.ts`, `ai-explain-log.ts`, `constant.ts` (avatar list).
  - `app.ts` (wiring/middleware/session), `server.ts` (entry).
- **Key frontend directories (`frontend/src/`):** `api/` (Axios + React Query hooks), `components/ui/` (shadcn-style), `contexts/` (login, edit-profile), `hooks/`, `lib/` (`axios`, `socket`, constants, utils), `pages/` (home, quiz-set, create, edit, game, lobby, history, ai-quiz-generation, loading), `layout.tsx`, `main.tsx` (router).
- **Data flow / request lifecycle (inferred):**
  - REST: SPA → Axios (`baseURL "/api"`) → Nginx proxy → Express → `isAuthenticated` middleware (session check) → controller → Mongoose/Redis → JSON response `{ message, data, errors }`.
  - Real-time: client connects Socket.IO → Express session middleware wrapped for sockets validates `req.session.userId` (rejects unauthenticated) → `setupLobbySocket` handles events → state read/written in Redis → `io.to(gameCode).emit("lobby-updated", ...)` broadcasts to the room.
  - Game timing: phase transitions are scheduled as delayed BullMQ jobs (`scheduleNextGameFlowJob`) so timers survive process restarts; on fire, `handleNextGameFlow` advances phase and reschedules or ends+persists.
  - AI generation: create record (unique per user via partial index) → BullMQ job → orchestrator loads prepared materials, runs per-chunk LLM calls with bounded concurrency → finalize LLM → persist a draft `Quiz` → delete prepared materials + release Redis lock.
- **Diagrams in repo:** No committed image diagrams in the tracked repo. Mermaid-based architecture diagrams exist in the git-ignored `slides/` deck (rendered assets under `slides/dist/assets/`, e.g. `architecture-*.js`) and thesis chapters in `zthesis/` (unverified as tracked artifacts).

## 6. Notable technical decisions & trade-offs
- **Split transient vs durable state (Redis vs MongoDB):** Live lobby/players/answers/scores live in Redis with TTL (`EXPIRY_SECONDS`), while users, quizzes, and completed histories live in MongoDB. Rationale (documented in thesis Ch.1 problem statement): fast-changing game state needs a different store than durable records.
- **Durable game timers via BullMQ instead of `setTimeout`:** Phase transitions are delayed jobs in Redis-backed BullMQ (`lobby-timer-queue.ts`), so timers survive deploys/crashes rather than being lost with an in-memory timer. (README and `zdoc/BullMQ_Worker_Orchestrator_Approach.md` reference this decision.)
- **Three-layer history model:** `HistoryQuery` (list summary), `HistoryDetail` (frozen quiz snapshot + settings, so later quiz edits don't alter past games), and `HistoryPlayerResult` (per-player answer traces, separately indexed). Trade-off: write amplification (three docs on game end) for cheap, purpose-fit reads and immutable review.
- **AI finalize returns indexes, not rewritten questions:** The finalize LLM returns `selectedQuestionIndexes` + metadata; the backend validates count/uniqueness/range with Zod and remaps to original chunk candidates (`zdoc/4 Added Features Beyond Requirements.md` §3.10). Rationale: smaller model output → fewer truncation/parse failures and lower cost; question text/`correctKey` stay as emitted.
- **Singleflight + caching for AI explain/analytics:** A Redis-lock singleflight (`utils/singleflight.ts`, Lua-based lock release) coalesces concurrent identical requests, and results are cached on the history documents (`hostAiExplanations`, `hostAiAnalytics`, `aiSessionAnalytics`). Rationale (documented): reliability under concurrency and lower repeated API cost.
- **At-most-one active AI generation per user:** Enforced with a MongoDB partial unique index on `{ userId, status }` where `status: "PROCESSING"` (`AiQuizGenerationRecord.ts`) plus a Redis lock. Trade-off: simplicity/safety over allowing parallel generations per user.
- **Prepared materials auto-expire:** `AiPreparedMaterial` has a TTL index (`expiresAt`) and is also deleted after a generation job finishes. Rationale (inferred): uploaded content is transient input, not long-term storage.

## 7. Interesting / hard problems solved
- **Server-authoritative synchronized game phases:** Single server drives Cooldown/Question/Result for all clients, with an early-advance path when everyone has answered (`someUnanswered` check → `skipGameFlow`), avoiding per-client timing drift.
- **PDF text reconstruction without a heavy parser:** `material-text.ts` reconstructs reading order from `unpdf` structured text items using geometry heuristics — row grouping by `y` tolerance, token spacing thresholds, CJK-aware joining, hyphenation repair, page-marker normalization, and stripping runs of standalone line-number margins — then falls back to high-level `extractText` if structured extraction yields nothing.
- **Chunking strategy for LLM cost control:** Paragraph-first packing with sentence/line/fixed-window fallbacks, small-chunk merging, configurable target/max/overlap/min char sizes, and a 12 MB clean-text cap to stay under MongoDB's 16 MB document limit.
- **Bounded-concurrency chunk fan-out:** Custom `runWithConcurrency` worker pool (default 5, capped 10) runs per-chunk LLM calls in parallel, tolerating partial failures (SKIPPED/FAILED) and still finalizing if ≥1 candidate exists.
- **Speed-based scoring via Redis atomics:** Correct-answer order bonus computed from `DECR` on a per-question `correct` counter plus a player-count base, using Redis `MULTI` pipelines to initialize per-question/per-player answer state at game start.
- **Guest→user history migration:** On registration from a guest session, prior guest game history is reassigned to the new `userId` in a non-blocking manner (failure is swallowed so signup still succeeds).

## 8. Auth & security
- **Authentication:** Session-cookie based. `express-session` with `connect-mongo` store, signed cookies (`cookie-parser` + `COOKIE_SECRET`), `httpOnly`, `secure` gated by `COOKIE_SECURE === "true"`, `rolling: true`, `saveUninitialized:false`, default 2-day max age (configurable). Passwords hashed with `bcryptjs` (`genSalt(12)`).
- **Authorization:** `isAuthenticated` middleware requires `req.session.userId` and `req.session.type === "auth"` (guests are rejected from protected routes). Socket.IO connections are rejected unless the wrapped session has a `userId`. Host-only socket actions (`start-game`, `update-settings`, `kick-player`, `close-lobby`) re-check that the caller is the lobby host.
- **Guest sessions:** Unauthenticated `GET /api/auth/initial` mints a `guest_<uuid8>` identity for gameplay entry.
- **Input validation:** Zod schemas validate auth payloads (`registerSchema`, `loginSchema`, etc.) and AI generation bodies/outputs; Mongoose schema constraints (enums, min/max, required) provide a second layer; upload MIME restricted to `application/pdf`/`text/plain` with a per-file size limit and single-file limit (`multer`).
- **Rate limiting / abuse controls:** Verification-code sending has a 2-minute per-email cooldown and 5-minute code expiry (`sendCode`). No general HTTP rate limiter found (unverified/none).
- **Notable security observations (neutral):** `SESSION_SECRET` falls back to `"defaultFallbackSecret"` if unset (`app.ts`); `backend/.env` is intentionally committed as a template (git-ignored otherwise via `!backend/.env` exception) and contains only placeholders, not secrets.
- **Required/used env vars (names only):**
  - Backend required: `SESSION_SECRET`, `COOKIE_SECRET`.
  - Backend optional/used: `PORT`, `MONGODB_URI`, `REDIS_URL`, `COOKIE_SECURE`, `SESSION_COOKIE_MAX_AGE_MS`, `SESSION_STORE_TTL_SECONDS`, `BREVO_API_KEY`, `SENDER_EMAIL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_WEB_DECIDER_MODEL`, `OPENROUTER_WEB_DECIDER_FALLBACK_NEED_WEB`, `OPENROUTER_HTTP_REFERER`, `OPENROUTER_APP_TITLE`, `TAVILY_API_KEY`, `AI_QUIZ_CHUNK_CONCURRENCY`, `AI_MATERIAL_CHUNK_TARGET_CHARS`, `AI_MATERIAL_CHUNK_MAX_CHARS`, `AI_MATERIAL_CHUNK_OVERLAP_CHARS`, `AI_MATERIAL_CHUNK_MIN_CHARS`, `NODE_ENV`.
  - CI/CD secrets: `VPS_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` (GitHub Actions).

## 9. Data model
Source: Mongoose schemas in `backend/src/models/`. No SQL migrations (MongoDB/Mongoose; schema is code-defined).
- **User** (`User.ts`): `username`, `email` (unique, indexed), `password` (bcrypt hash), `avatar`, timestamps.
- **Verify** (`Verify.ts`): `email` (unique), `verificationCode`, `verificationCodeExpires` — email verification/reset codes.
- **Quiz** (`Quiz.ts`): `title`, `description`, `questions[]` (embedded `questionSchema`: `id`, `question`, `options[]` {key A–D, text}, `correctKey`, `done`), `creatorId → User` (indexed), `draft`, `hasQuizDraft`; publish-time validation in `pre("save")`.
- **QuizDraft** (`QuizDraft.ts`): mirror of a quiz's editable draft; `quizId → Quiz` (unique), `creatorId → User`.
- **History (three collections, `History.ts`):**
  - `HistoryQuery`: `gameCode`, embedded `quiz` summary, `host → User` (indexed), `players[] → User` (indexed), `playerCount`, `winner` (player snapshot), `sessionCreatedAt`.
  - `HistoryDetail`: `_id` shared with `HistoryQuery`, frozen `quiz` (title/description + full `questions[]`), `host`, `players[]` (snapshots), `settings`, plus cached AI fields `hostAiExplanations[]` and `hostAiAnalytics`.
  - `HistoryPlayerResult`: `gameId → HistoryQuery` (indexed), `player` snapshot (userId or guestId), `totalScore`, `rank`, `answers[]` (`questionIndex`, `optionIndex`, `key`, `score`, `answeredAt`, optional cached `aiExplanation`), optional `aiSessionAnalytics`; compound index on `{gameId, player.userId, player.guestId}`.
- **AiPreparedMaterial** (`AiPreparedMaterial.ts`): `userId → User`, `originalFileName`, `mimeType` (pdf/plain), `fileSizeBytes`, `cleanTexts[]` (chunked text), `rawCharCount`, `cleanCharCount`, `status: READY`, `expiresAt` (TTL index).
- **AiQuizGenerationRecord** (`AiQuizGenerationRecord.ts`): `userId → User`, `preparedFileIds[]` (1–3, → AiPreparedMaterial), `status` (PROCESSING/DONE/FAILED, partial-unique per user while PROCESSING), `promptText`, `settings` (`questionCount` 1–50, `difficulty` easy/medium/hard, `language`), `model`, `progress` (stage + chunk counters), `chunks[]`, `output` (`quizId`, title, description, count), `error`, `lockKey`.
- **Session store:** `connect-mongo` writes session documents to MongoDB (not a hand-written model).
- **Redis (non-Mongo, transient) keys** (`redis/lobby.ts`): `game:{code}`, `game:host:{code}`, `game:players:{code}`, `game:secret:questions:{code}`, `game:answer:answers:{code}:{qIndex}`, `game:answer:score:{code}`, `game:answer:correct:{code}`, `game:started:{code}`, `activeHostLobby:{userId}:{quizId}`.

## 10. APIs & integrations
Base path `/api` (Express, `app.ts`). All list/detail unless noted require `isAuthenticated` session; some public reads exist (e.g. `GET /api/sessions/:gameCode`, `GET /api/history/:gameId`).
- **Health:** `GET /api/health`.
- **Auth (`/api/auth`):** `POST /register`, `POST /login`, `POST /logout`, `POST /code` (send verification code), `POST /reset`, `POST /edit-profile`, `GET /initial` (returns current user or mints a guest).
- **Quiz (`/api/quiz`):** `POST /create`, `PUT /update/:id`, `DELETE /delete/:id`, `POST /copy/:id`, `GET /`, `DELETE /draft/:id`, `GET /:id`.
- **Sessions/lobbies (`/api/sessions`):** `POST /host`, `GET /:gameCode`, `GET /answer/:gameCode`, `POST /check/:gameCode`.
- **History (`/api/history`):** `GET /`, `POST /:gameId/explain` (AI answer explanation), `POST /:gameId/analytics` (AI session analytics), `GET /:gameId`.
- **AI quiz materials (`/api/ai-quiz-materials`):** `POST /prepare` (multipart upload → extract/clean/chunk), `DELETE /:preparedFileId`.
- **AI quiz generations (`/api/ai-quiz-generations`):** `POST /validate-prepared`, `GET /`, `GET /:generationId`, `DELETE /:generationId`, `POST /` (start generation).
- **Socket.IO events (server, `lobby-socket.ts`):** inbound `join-game`, `update-settings`, `update-profile`, `close-lobby`, `submit-answer`, `kick-player`, `leave-game`, `disconnect`, `start-game`; outbound `lobby-updated`, `question-dashboard`, `kicked`, `error`.
- **External integrations:**
  - **OpenRouter** (`utils/openrouter.ts`): LLM chat completions for quiz generation, answer explanation, analytics; default model `stepfun/step-3.5-flash:free`, configurable, with a separate optional cheaper "web decider" model.
  - **Tavily** (`utils/tavilySearch.ts`): optional web search (max 3 results, basic depth, 20s timeout) to ground answer explanations; no-ops if key unset.
  - **Brevo** (`utils/brevo.ts`): transactional email for verification/reset codes.

## 11. Deployment & running it
- **Local dev (from `README.md`):**
  - `npm install --prefix backend && npm install --prefix frontend`.
  - Copy `backend/.env` → `backend/.env.local`; set `SESSION_SECRET` (≥32 chars) and `COOKIE_SECRET`.
  - Start Mongo + Redis: `docker compose -f docker-compose.yml -f docker-compose.dev-db.yml up -d mongodb redis`.
  - Backend: `cd backend && npm run dev` (tsx watch, port `2000`). Frontend: `cd frontend && npm run dev` (Vite, port `3221`, proxies `/api` + `/socket.io`).
- **Scripts:** backend `dev`/`build` (`tsc`)/`start` (`node dist/server.js`); frontend `dev`/`build` (`tsc -b && vite build`)/`preview`/`lint` (`eslint .`)/`test` (`vitest run`).
- **Docker (full stack):** `docker compose up --build -d` runs `mongodb` (mongo:7), `redis` (redis:7-alpine), `app` (backend, node:20-alpine, port 2000, health-checked at `/api/health`), and `web` (Nginx serving SPA + proxy, published on host port `3221`). Overrides: `docker-compose.dev-db.yml` (expose DB ports), `docker-compose.ci.yml` (pre-built images).
- **Deployment (evidence):** `.github/workflows/deploy.yml` — on push to `main` (or manual dispatch), GitHub Actions SSHes (appleboy/ssh-action) into a VPS at `~/QuizConnect`, runs `git fetch` + `git reset --hard origin/main` + `docker compose up -d --build`. Secrets: `VPS_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`. `DEPLOY.md` and `DOCKER.md` document the flow in detail. (Note: `README.md` describes an earlier GHCR image-build flow; the active workflow builds on the VPS — README slightly out of sync, matched by `deploy.yml.backup`.)
- **Env/config requirements:** See §8. Docker compose sets `MONGODB_URI`/`REDIS_URL`/`PORT`; secrets and optional AI keys come from `backend/.env.local`.

## 12. Testing & quality
- **Framework:** Vitest (`frontend` has a `test` script; backend has `*.test.ts` run via Vitest/tsx — no dedicated backend `test` script in `backend/package.json`).
- **Test files present (5):** `backend/src/utils/singleflight.test.ts`, `backend/src/api/history/analytics/singleflight.test.ts`, `backend/src/api/history/explain/singleflight.test.ts`, `backend/src/api/auth/migrate-guest-history.service.test.ts`, `frontend/src/pages/ai-quiz-generation/storage.test.ts`.
- **What's covered:** Singleflight/concurrency coalescing logic, guest→user history migration service, and frontend AI-generation local storage helper. No coverage report or coverage config found.
- **Gaps:** No tests found for controllers/routes, socket game flow, scoring, PDF extraction, or the AI orchestrator (unverified beyond file listing).
- **Linting/CI:** ESLint 9 + typescript-eslint (frontend `eslint.config.js`), Prettier configured. The only GitHub Actions workflow is deployment (`deploy.yml`); no CI test/lint job is wired up (a `docker-compose.ci.yml` exists but is a compose override, not a test pipeline).

## 13. Metrics & scale
- **Repo activity:** 125 commits, 1 contributor, ~7-month span (2025-11-28 → 2026-07-02).
- **Test count:** 5 test files.
- **Code size:** No line-count/bundle-size metric measured here (unverified).
- **Config constants (evidence, not performance claims):** default chunk sizes — target 4200 / max 6800 / overlap 400 / min 1000 chars; max clean text 12 MB; chunk concurrency default 5 (cap 10); AI generation `questionCount` 1–50; prepared files per generation 1–3; Tavily max 3 results; verification code 5-min expiry / 2-min resend cooldown; session default max age 2 days.
- **Static assets:** 40 food-themed avatar PNGs + `gamepad.svg` in `frontend/public/`.
- **Real-world usage numbers (users, games played, uptime, performance gains):** No evidence in repo. The thesis states it is a prototype and explicitly avoids performance/educational-outcome claims.

## 14. Timeline
- **Build period:** 2025-11-28 (first commit `460f370`) to 2026-07-02 (latest commit `c27e128`), all by a single author.
- **Milestones (inferred from code/docs; exact commit-dated milestones not individually verified):**
  - Core real-time multiplayer + session auth + Redis/BullMQ game state (reflected in README and base modules).
  - History persistence (three-layer model) for post-game review.
  - AI feature buildout: answer explanation, session analytics, then quiz generation from PDF/TXT (design notes dated in `zdoc/`, e.g. AI analytics design and AI quiz generation docs).
  - Docker Compose + GitHub Actions VPS deployment (multiple deploy workflow iterations, evidenced by `.backup` files).
  - Thesis documentation and Slidev defense deck authored alongside the code (`zthesis/`, `slides/`).
- Note: the git history begins 2025-11 while some working-doc file timestamps read earlier in the year; git commit dates are treated as authoritative here.

## 15. Assets
- **Avatars/icons:** `frontend/public/` — 40 food-themed PNGs (e.g. `apple.png`, `avocado.png`, `broccoli.png`, `watermelon.png`, …) used as random user avatars (`backend/src/utils/constant.ts` avatar list), plus `frontend/public/gamepad.svg`.
- **Screenshots / demo media:** None found in the tracked repo.
- **Design files / presentation:** `slides/` — a Slidev thesis-defense deck (`slides.md`, `pages/`, `SPEAKER-SCRIPT.md`, `THESIS-SLIDE-MAP.md`, prebuilt `dist/` with Mermaid diagram assets). `zthesis/` — full thesis chapters (Abstract → Conclusion + References). `zdoc/` — design/spec docs (AI analytics design, AI quiz generation, BullMQ orchestrator approach, prompt design, added-features log). These three folders are git-ignored (present in the working tree, not committed).

## 16. Resume bullet candidates (factual, no invented metrics)
- Built a full-stack real-time multiplayer quiz platform (React 19 + Vite SPA, Express 5 + Socket.IO backend) with server-authoritative synchronized game phases and a live leaderboard for [add metric?] concurrent players.
- Engineered crash-resilient game timing by scheduling phase transitions as Redis-backed BullMQ delayed jobs instead of in-memory timers, so live games survive server restarts and deploys.
- Designed a three-collection MongoDB history model with frozen quiz snapshots and per-player answer traces, enabling immutable post-game review unaffected by later quiz edits.
- Implemented an LLM quiz-generation pipeline (PDF/TXT ingestion, geometry-based text reconstruction, adaptive chunking, bounded-concurrency chunk→finalize LLM calls via OpenRouter) that outputs editable draft quizzes.
- Added AI answer explanations and session analytics with Redis singleflight request coalescing and result caching to cut redundant LLM calls by [add metric?] under concurrent load.
- Containerized the stack with Docker Compose (MongoDB, Redis, Node backend, Nginx frontend) and automated push-to-`main` deployment to a VPS via GitHub Actions.

## 17. Nice-to-know
- **Food-avatar theme:** New users get a random food-icon avatar from a 40-item list; playful visual identity.
- **Naming inconsistency:** UI/repo name is "QuizConnect", but the database defaults to `QuizzConnect` (double-z) in `MONGODB_URI`, compose files, and container names — a persistent typo baked into config.
- **Stale docs quirk:** `NOTES.txt` lists AI question creation as "missing" though it's implemented; README omits the AI features entirely — the `zdoc`/`zthesis` docs are the most current description of scope.
- **Cost-aware AI design:** Default model is a `:free` OpenRouter tier (`stepfun/step-3.5-flash:free`), with an optional cheaper "should we web-search?" decider model and a configurable cost-vs-correctness fallback flag.
- **Thesis artifact:** This is an academic thesis project with a full written thesis and a Slidev defense deck that maps slides to thesis chapters (`slides/THESIS-SLIDE-MAP.md`), including a speaker script.
- **Cursor rule present:** `.cursor/rules/thesis-writing-style.mdc` encodes the author's preferred thesis writing tone.

## 18. Open questions for the human
- Is there a currently live/public deployment URL (VPS domain), and is it still running? None is committed to the repo.
- Confirm this is a solo bachelor's/master's thesis project (the git history shows one author; the thesis chapters imply an academic context but the degree/institution isn't stated in tracked files).
- Institution, supervisor, course, and submission date (referenced in `slides/slides.md` cover per README of slides, but should be confirmed).
- Any real usage numbers — number of games hosted, users, or a demo/user-testing cohort? The thesis Chapter 6 (Evaluation) may contain these; confirm what evaluation was actually performed.
- Which OpenRouter model was used for real evaluation runs, and were Step 3.5 Flash / DeepSeek / GPT-4o mini actually compared (thesis says no formal comparison)?
- Should the resume framing emphasize the AI features or the real-time engine? (Both are substantial.)
- Are `zdoc/`, `zthesis/`, and `slides/` intended to stay private (git-ignored) — should they be excluded from any public portfolio version?
- Is the `QuizzConnect` vs `QuizConnect` naming intentional or a typo to fix before showcasing?

## 19. Evidence & confidence notes
- **Strongest, code-grounded claims** (high confidence): tech stack and versions (`package.json` files), data models (`models/*.ts`), REST endpoints (`router.ts` files), socket events and game logic (`sockets/lobby-socket.ts`, `redis/lobby.ts`), AI pipeline (`ai-quiz-generations/orchestrator.ts`, `ai-quiz-materials/material-text.ts`), auth/security (`auth/controller.ts`, `app.ts`), Docker/CI (`docker-compose.yml`, `.github/workflows/deploy.yml`), git stats (`git log`/`shortlog`).
- **Medium confidence:** purpose/audience and design rationale, which come from `zthesis/` and `zdoc/` — these are git-ignored working docs, not committed source, so treat them as authored context rather than shipped artifacts. README is partially outdated (omits AI features; describes an older GHCR deploy flow), so code was preferred over README where they conflicted.
- **Low confidence / unverified:** live deployment status and URL, real-world usage/evaluation numbers, individual commit-dated milestones, and academic metadata (institution/supervisor/date). These are flagged in §18.
- **Overall confidence in this document:** High for "what the code is and does"; Medium for "why/context"; Low for "real-world outcomes and current live status." No performance, user-count, or scale numbers are asserted because none are evidenced in the repo.
