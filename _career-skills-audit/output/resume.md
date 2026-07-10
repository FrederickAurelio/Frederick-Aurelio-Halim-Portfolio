# Master Resume — Frederick Aurelio Halim

Source of truth synced from `Resume.pdf` (Jul 2026).

---

Frederick Aurelio Halim  
Frontend Developer  
Open to remote · Open to relocate  
frederick.ah88@gmail.com | +62 85370374189  
Portfolio: https://frederick-aurelio-halim.vercel.app/  
GitHub: https://github.com/FrederickAurelio  
LinkedIn: https://www.linkedin.com/in/frederick-aurelio-halim-0b6a19261/

## Summary

Frontend Developer with a CS degree (2026) and ~1 year develop React/TypeScript product at Mufy AI. Also builds full-stack apps with Next.js and Express, including a live multiplayer quiz platform deployed with Docker and GitHub Actions. Indonesian, English, and Mandarin Chinese.

## Professional Experience

### Frontend Developer | Mufy AI (杭州智聊思远互联网科技有限公司)
Hangzhou, China | 05/2025 – 06/2026  
Product: https://chat.mufy.ai/

- Built and shipped new features and pages for an AI roleplay chat web app (React 18, TypeScript, Vite) as the product grew to hundreds of characters across romance, fantasy, and game genres.
- Delivered core surfaces including homepage, details, settings, shop, plus supporting features such as comments and fan badges.
- Extracted reusable hooks and components to cut duplicated UI logic and speed up feature work across the frontend team.
- Managed server state and data fetching with TanStack React Query and Axios; handled forms with React Hook Form and Zod.
- Tested features, fixed bugs as they appeared, and refactored logic that had grown messy over time.
- Used AI coding tools in the daily workflow; collaborated day to day with designers, backend, and other frontend developers to ship.

## Education

**B.Eng. in Computer Science (with Honours)**  
Zhejiang University of Science and Technology (浙江科技大学), Hangzhou, China  
07/2022 – 07/2026

## Skills

**Languages:** TypeScript, JavaScript  

**Frontend:** React, Next.js, Vite, React Router, TanStack React Query, Zustand, Redux, Tailwind CSS, React Hook Form, shadcn UI  

**Backend / Data:** Express, Node.js, MongoDB, Redis, Supabase, Socket.IO  

**Auth / APIs:** Session auth, JWT Token, GitHub OAuth, Axios, OpenRouter (LLM APIs)  

**Infra / Tooling:** Docker Compose, Nginx, GitHub Actions (CI/CD), Git  

## Languages

**Indonesian:** Native  
**English:** IELTS 6.5  
**Chinese:** HSK 4  

## Projects

### QuizConnect | React, Express, Socket.IO, Redis, BullMQ, MongoDB, Docker, GitHub Actions
Repo: https://github.com/FrederickAurelio/QuizConnect | Live: http://120.26.45.50:3221/

- Built a real-time multiplayer quiz platform: host opens a room with a game code, players answer in sync through server-driven Cooldown → Question → Result phases, with a live leaderboard.
- Made the server authoritative over each round and ran question timers as Redis-backed BullMQ jobs so a live game can continue even if the server restarts mid-match.
- Added LLM features via OpenRouter: draft a quiz from an uploaded PDF/TXT, explain answers, and generate session analytics.
- Containerized the stack with Docker Compose (MongoDB, Redis, Node API, Nginx) and set up GitHub Actions to SSH-deploy to a VPS on every push to main.

### Nextjs-FXTrade | Next.js, Supabase, React Query, GSAP
Repo: https://github.com/FrederickAurelio/Nextjs-FXTrade | Live: https://nextjs-fx-trade.vercel.app/

- Built a forex trading simulator where users get ¥100,000 virtual money and trade against live and historical rates (Frankfurter + CurrencyBeacon APIs).
- Validated every trade on the server and locked writes with Supabase row-level security so balances cannot be edited from the browser.
- Polled live rates on a 60s interval with React Query and cached historical series to cut repeat API calls; built with Next.js + Supabase.

### Memories | Next.js, Express, MongoDB, React Konva, GitHub OAuth
Repo: https://github.com/FrederickAurelio/Memories

- Built a digital scrapbook app with a from-scratch Konva canvas editor (drag, resize, layers, undo/redo) for photos, text, shapes, and freehand drawing.
- Served private images through an ownership check so only the owner and friends can load them; accounts via GitHub OAuth and server-side sessions (friend requests / some screens still in progress; no public deploy yet).

---

## Notes

- Synced from user PDF. Summary kept as in PDF (including `develop` wording).
- PDF first Mufy bullet looked truncated by layout (`…as the product`); restored full sentence from prior draft so the markdown stays readable.
- PDF typos normalized in Languages: Indonesia → Indonesian, Chineese → Chinese; scores kept (IELTS 6.5, HSK 4).
