---
rag:
  id: projects-overview
  type: catalog
  title: Frederick's Projects
  aliases: [projects list, portfolio projects, all projects, 项目列表, biggest project, best project, flagship, where to start, other projects, more projects, besides these, GitHub repos]
---

# Frederick's Projects

> Portfolio knowledge source. Catalog of Frederick Aurelio Halim's projects.

## 1. Overview
<!-- rag-section: overview -->
Frederick Aurelio Halim has four portfolio projects documented here:

- **QuizConnect** (`quizconnect`) — Real-time multiplayer quiz platform with WebSockets, LLM-assisted quiz generation, and live hosting. Stack: React SPA, Express, Socket.IO, BullMQ. **Docker Compose on a VPS** with **GitHub Actions auto-deploy** on push to `main`. Live: http://120.26.45.50:3221/
- **Memories** (`memories`) — Digital scrapbook/collage app on a Konva canvas with sharing and friendship privacy. Stack: Next.js + Express API. In-development demo (localhost in repo).
- **Nextjs-FXTrade** (`nextjs-fxtrade`) — Forex trading demo with virtual money and live/historical rates. Stack: Next.js App Router, Supabase. Live: https://nextjs-fx-trade.vercel.app/
- **Promis Conveyor Chain** (`promis-conveyor-chain`) — Indonesian marketing site for a conveyor-chain company. Stack: Next.js App Router. Live: https://promis-web.vercel.app/

For biographical info see `about-me`. For work experience see `work-experience`.

## 2. Where to start
<!-- rag-section: where-to-start -->
**If someone asks what to look at first, the best starting point is QuizConnect.**

- **Repo:** https://github.com/FrederickAurelio/QuizConnect
- **Live demo:** http://120.26.45.50:3221/
- **Why start here:** Largest scope in the portfolio — WebSockets multiplayer, BullMQ workers, LLM features, plus real **ops**: full stack containerized with Docker Compose (MongoDB, Redis, Node API, Nginx) and **CI/CD** that SSH-deploys to a VPS on every push to `main`.
- **Good second looks:** Nextjs-FXTrade (polished deployed demo, Supabase + charts) or Memories (deep canvas/editor work) depending on whether they care about fintech UI or creative tooling.

## 3. Why QuizConnect stands out
<!-- rag-section: why-flagship -->
QuizConnect is the most developed project in Frederick's portfolio — by feature surface and depth, not commercial scale.

**Technical breadth:**
- Full-stack: React SPA, Express REST API, MongoDB, Socket.IO real-time game phases, BullMQ worker.
- Real-time multiplayer: synchronized Cooldown → Question → Result phases, live leaderboard, game codes.
- LLM integration: quiz generation from PDF/text, answer explanations, session analytics.
- **Docker & deploy:** `docker compose` runs MongoDB, Redis, backend, and Nginx (SPA + `/api` + `/socket.io` proxy). GitHub Actions SSHes into the VPS, pulls `main`, and runs `docker compose up -d --build` — push-to-deploy without manual steps. Live at http://120.26.45.50:3221/

**What it shows about Frederick:**
- Can own a feature end-to-end — UI, API, WebSockets, queues, AI hooks, **containerization, and deployment pipeline**.
- Comfortable with stateful real-time systems, not only CRUD apps.
- Ships a working demo, not just repo code.

**Caveat:** QuizConnect is a **prototype**, not a commercial-scale platform.

## 4. Project comparison
<!-- rag-section: project-scale -->
Quick comparison for "biggest" or "which project" questions — by scope and what each demonstrates.

| Project | Live demo? | Standout scope |
|---------|------------|----------------|
| QuizConnect | Yes (VPS, Docker + CI/CD) | WebSockets multiplayer + LLM + BullMQ + auto-deploy |
| Memories | No (localhost) | Konva canvas editor, auth, sharing |
| Promis Conveyor Chain | Yes (Vercel) | Marketing site, SEO, animations |
| Nextjs-FXTrade | Yes (Vercel) | Trading UI, Supabase, charts |

"Biggest" in this portfolio usually means **QuizConnect** by feature surface — unless the visitor cares about a specific domain (canvas editor → Memories, forex demo → FXTrade).

## 5. Other projects & GitHub
<!-- rag-section: other-projects-github -->
**If someone asks whether there are other projects besides the four above:**

These four — QuizConnect, Memories, Nextjs-FXTrade, and Promis Conveyor Chain — are the **main projects Frederick showcases on this portfolio**. Each is polished enough to present and shows a different side of his skills (real-time + LLM + deploy, canvas editor, fintech demo, marketing/SEO).

Frederick has built **smaller things during university or for learning** — tutorials, experiments, half-finished repos — but nothing else he would call a standalone portfolio project yet.

**Where to look for more:**
- **GitHub profile:** https://github.com/FrederickAurelio — browse all public repos for side experiments, coursework, and older work not featured here.
- **This chat** can go deep on the four documented projects, work experience (Mufy), or background — ask about a stack or app type and Frederick can explain how he approached something similar.

**How to answer (tone guide):** Be honest that the site focuses on four projects; don't invent other flagship apps. Point curious visitors to GitHub for the long tail; offer to talk about the four or match their interest (e.g. "if you care about WebSockets, QuizConnect is the one").

