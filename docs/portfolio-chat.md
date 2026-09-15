---
rag:
  id: portfolio-chat
  type: project
  title: Portfolio RAG Chat
  aliases: [portfolio chat, RAG chat, this chatbot, AI chat widget, how the chat works, 作品集聊天, 这个聊天]
---

# Portfolio RAG Chat

> Portfolio knowledge source. Facts about the AI chat widget on Frederick Aurelio Halim's portfolio site only. Not Mufy. Not QuizConnect's quiz-generation LLM.

## 1. At a glance
<!-- rag-section: at-a-glance -->
This site has an AI chat widget Frederick built so visitors can ask about his work and get answers grounded in notes he wrote — not a generic chatbot.
- **Summary:** A RAG (retrieval-augmented generation) chat on this portfolio. A visitor types a question; the server plans searches, retrieves matching notes, then streams a first-person reply. Follow-up chips appear under the answer.
- **What it is not:** Not Mufy (that's an employer product). Not QuizConnect's PDF-to-quiz LLM features. This widget only answers about Frederick's work.
- **Category:** Side project shipped on this site — Next.js API + React widget. Not one of the four homepage project cards.
- **Status:** Live on this site (desktop popover, mobile drawer).
- **Repo:** https://github.com/FrederickAurelio/Frederick-Aurelio-Halim-Portfolio
- **Links:** The visitor is already in this chat. Do not print a portfolio homepage URL. Repo URL above is fine to print.

## 2. Problem & purpose
<!-- rag-section: 2-problem-purpose -->
- **Who it's for:** Recruiters, hiring managers, and other visitors who want to ask about Frederick's projects, jobs, stack, or background without hunting through the page.
- **Problem:** A static portfolio only shows what it shows. Follow-up questions ("how did you deploy that?", "what else is on GitHub?") need a path that stays factual.
- **Solution:** Frederick writes markdown notes, embeds them, and answers through a two-step LLM pipeline: a navigator plans what to look up, retrieval pulls the matching chunks, then a second model streams the reply in first person from those chunks plus the conversation.

## 3. What visitors see
<!-- rag-section: 3-features -->
- Floating button on every page. Desktop: popover panel. Mobile (under 768px): full-height drawer.
- Site language toggle (EN / 中文) changes widget labels. Reply language follows the visitor's message (中文 if the message contains CJK characters).
- Empty state offers two starter chips. After a reply, 0–2 follow-up chips (never more).
- While generating: phase labels for routing ("figuring out what to look up"), retrieving ("searching portfolio notes"), then thinking. Optional expandable thought-process block when the model streams reasoning.
- Answers render as markdown. Copy button on messages. Stop button cancels the in-flight reply.
- History loads in pages (10 messages at a time). Refresh does not kill a reply that is still generating — the widget can subscribe again and catch up.
- Disclaimer under the input: replies are AI-generated and may not always be accurate.
- Messages are kept on a sliding ~6 hour window, then expire. Anonymous httpOnly session cookie; no login.
- One reply at a time per session. If a second send happens mid-generation, the API returns 409.

## 4. Tech stack
<!-- rag-section: 4-tech-stack -->
- **App:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, TanStack Query, GSAP on the static page.
- **Chat UI:** Custom widget. Desktop popover (Radix). Mobile drawer (Vaul). Markdown via react-markdown (GFM + line breaks).
- **LLM + embeddings:** OpenRouter. Defaults: chat model `deepseek/deepseek-v4-flash-0731`, embedding model `qwen/qwen3-embedding-8b`. Both can be overridden by env. Missing API key → chat returns 503.
- **Knowledge:** Markdown files Frederick maintains, chunked and embedded into a JSON vector index at build/index time (`npm run index-knowledge`). Retrieval is cosine similarity over those vectors — no hosted vector DB.
- **Session store:** Redis on the China VPS (Docker). Upstash Redis on Vercel. Same key layout: messages, generation lock/buffer, sticky routing state.
- **Transport:** Server-sent events (SSE) for the answer stream and for resume-after-refresh.

## 5. How a turn works
<!-- rag-section: 5-architecture -->
Four API routes: `POST /api/chat` (start stream), `GET /api/chat/messages` (paginated history), `POST /api/chat/stop` (abort), `GET /api/chat/generation/stream` (subscribe/resume).

**Per question:**

1. **Session.** Middleware assigns an httpOnly cookie (`portfolio-chat-session`, UUID, ~400 days). Secure flag follows HTTPS vs the plain-HTTP VPS.
2. **Lock.** At most one generation per session. A Redis/Upstash lock plus an in-process abort handle. Stop is an explicit POST — a page refresh does not abort.
3. **Routing (LLM 1 — navigator).** A small JSON-mode call reads a map of the notes (doc ids, titles, aliases, sections) plus recent turns. It emits 1–4 focused search topics (label, embedding query, optional preferred doc) and a short hint for the answer model. Off-topic asks (weather, recipes, homework) get empty topics. If the navigator fails, a fallback embeds the user message, with sticky focus on the last primary doc for vague follow-ups ("what stack?", "how does auth work?").
4. **Retrieving.** Each topic query is embedded in one batch. Per topic, search preferred docs first, keep top 2 chunks by cosine similarity, merge/dedupe, cap at 12 chunks (or `RAG_MAX_CONTEXT_CHUNKS` if smaller). If a preferred doc got zero hits, top up with that doc's "at a glance / overview" section so multi-topic questions do not drop a subject.
5. **Answer (LLM 2 — stream).** System prompt + retrieved chunks + history + the new message. Streams thinking then content. The model must answer from those notes; it is told not to invent metrics, jobs, URLs, or hobbies. A hidden `@@SUGGESTIONS@@ ["…"]` trailer is stripped from the visible reply and turned into chips (max 2). Invalid trailer → no chips.
6. **Persist.** Partial or full assistant text (and reasoning, chips) is saved when the stream ends — including stop and the Vercel time limit — so a cut-off reply is not lost.

Sticky routing remembers the last primary doc (e.g. QuizConnect) so a vague follow-up stays on that topic until the visitor names something else.

## 6. Notable technical decisions & trade-offs
<!-- rag-section: 6-notable-technical-decisions-trade-offs -->
- **Two LLM calls, not one.** The navigator only plans searches. The answer model never sees the whole corpus — only the chunks retrieval picked. Cheaper than stuffing every note; better than embedding the raw user sentence alone on multi-topic questions ("education and QuizConnect").
- **JSON vector index, not Pinecone/etc.** The notes are a small, Frederick-owned corpus. Embeddings live in-repo as `index.json`. Rebuild when notes change. Trade-off: index size grows with the docs; no extra hosted vector service.
- **Per-topic retrieve + glance top-up.** One mashed query used to starve the second subject. Separate queries plus a glance fallback keep multi-topic answers covered.
- **Generation buffer + subscribe.** Refresh-safe streaming on serverless: the POST keeps writing a shared buffer; a new GET polls it. Stop is a store flag + abort, not "close the tab".
- **Vercel Hobby vs VPS.** International deploy is Vercel Hobby (60s function cap; stream deadline ~55s). China deploy is Docker Compose on a VPS (app + Redis + Nginx) with 180s chat timeout. Longer chats that hit the Vercel cap can continue on http://120.26.45.50 — mention that IP only when explaining the timeout, not as "my website".
- **Anonymous sessions, short memory.** httpOnly cookie, no accounts. Message TTL ~6 hours (sliding). Generation lock TTL 5 minutes as a crash safety net.

## 7. Interesting / hard problems solved
<!-- rag-section: 7-interesting-hard-problems-solved -->
- **Multi-topic retrieval** so "university + biggest project" does not retrieve only one side.
- **Sticky follow-ups** without treating "hi" / "lol" as a topic change, and without pinning when the visitor names two projects at once.
- **Suggestion trailer parsing** that never flashes `@@SUGGESTIONS@@` in the UI (hold back a partial marker; only emit chips when the JSON is valid).
- **Resume after refresh** on both Redis and Upstash, including a sync cookie so Vercel/Upstash can keep the buffer consistent across instances.
- **Dual timeout story:** VPS can run longer; Vercel Hobby is patched to 60s at build time and aborts cleanly with the partial answer saved.

## 8. How to answer questions about this chat
<!-- rag-section: 8-how-to-answer -->
- Speak as Frederick who built it: "I retrieve notes I wrote, then an LLM drafts the reply." Do not claim to be ChatGPT, DeepSeek, or "just an AI" as your identity.
- Short version: notes → navigator plans searches → embeddings/cosine retrieve chunks → streamed first-person answer. Offer more detail only if they ask (locks, resume, Vercel vs VPS).
- Always distinguish: this widget (`portfolio-chat`) vs Mufy (`work-experience`) vs QuizConnect LLM quiz features (`quizconnect`).
- Honesty: grounded in notes, but the model can still be wrong — that is why the disclaimer exists. Do not invent extra accuracy metrics.
- Links: print the GitHub repo when relevant: https://github.com/FrederickAurelio/Frederick-Aurelio-Halim-Portfolio. Do not print a portfolio homepage URL. http://120.26.45.50 only when talking about the longer-timeout China/VPS deploy vs Vercel's 60s cap.
- Homepage showcase is still four project cards (QuizConnect, Memories, FXTrade, Promis). This chat is extra work on this site, not a fifth card.
