---
rag:
  id: memories
  type: project
  title: Memories
  aliases: [Memories app, scrapbook canvas, Konva canvas, digital collage]
---

# Memories

> Portfolio knowledge source. Facts about Frederick Aurelio Halim's Memories project only.

## 1. At a glance
<!-- rag-section: at-a-glance -->
Memories is a full-stack digital scrapbook/collage canvas app by Frederick Aurelio Halim.
- **Summary:** Users arrange photos, shapes, text, drawings, stickers, and connector ropes on an interactive Konva canvas, save designs, and share with privacy/friend controls.
- **Category:** Web app — canvas editor with separate Express API backend.
- **Status:** In-development demo. No public deployment (localhost URLs in code).
- **Repo:** https://github.com/FrederickAurelio/Memories
- **Live demo:** None (GitHub only).

## 2. Problem & purpose
<!-- rag-section: 2-problem-purpose -->
- **Who it's for:** People who want to compose personal photos into decorated digital collages and optionally share with friends.
- **What it does:** Browser-based canvas editor with accounts, design save/load, per-photo captions (title, date, description), and read-only viewing with privacy gates.

## 3. Features
<!-- rag-section: 3-features -->
**Working**
- Email/password auth with verification, password reset, GitHub OAuth, server-side sessions.
- Canvas editor: photos, shapes, text (inline editing), freehand pen/eraser, line/spline ropes, stickers.
- Toolbars: fill, stroke, opacity, z-order, text formatting; undo/redo, zoom, copy/paste, drag-outside-to-delete.
- Client-side image compression before upload; designs saved to MongoDB with images on disk.
- Privacy/friend-gated access to designs and images; Next.js image proxy route for authenticated `<img>` loads.

**Incomplete / UI only**
- AI sticker generation (UI exists, no backend).
- Friend requests and notifications (mock UI, no API).
- App home page and chats route are placeholders.

## 4. Tech stack
<!-- rag-section: 4-tech-stack -->
- **Frontend:** Next.js 15 (App Router), React 19, Konva/react-konva, Tailwind CSS 3, Radix/shadcn UI, TypeScript.
- **Backend:** Express 4, Mongoose (MongoDB), express-session + connect-mongo, bcrypt, Zod, Nodemailer, Multer.
- **Auth:** Session cookies forwarded from Next.js server actions to Express; GitHub OAuth.
- **Infra:** Local dev only — no Docker, CI, or deployment config.

## 5. Architecture
<!-- rag-section: 5-architecture -->
Two apps in one repo: `frontend/` (Next.js) and `backend/` (Express API).

- Next.js middleware gates routes; server actions forward `connect.sid` cookie to Express on every backend call.
- Canvas elements validated with a Zod discriminated union (photo, shapes, text, draw, ropes, sticker).
- Images: client compress → upload via Multer disk storage → element `src` references server path.
- Protected images served through a Next route handler that injects the session cookie.

## 6. Notable technical decisions & trade-offs
<!-- rag-section: 6-notable-technical-decisions-trade-offs -->
- **Session cookie forwarding across origins** — Next server actions + dedicated image-proxy route so `<img>` tags stay authenticated.
- **Zod discriminated union for canvas elements** stored as Mongoose `Mixed` — flexible element types, loose DB typing.
- **Ownership encoded in image filenames** — simple auth without a separate image table.
- **Undo/redo capped at 12 states** + localStorage autosave — editor responsiveness over server round-trips.
- **Fixed 1200px canvas width** with CSS zoom — consistent layout across devices.

## 7. Interesting / hard problems solved
<!-- rag-section: 7-interesting-hard-problems-solved -->
- **Cross-origin session auth for image requests** via Next.js proxy route.
- **From-scratch Konva editor** — transform handles, scale normalization, guidelines/snapping, in-canvas text editing via HTML textarea overlay.
- **Undo/redo with branch truncation** when new actions follow an undo.
- **Privacy-aware fetching** — public/private profiles plus accepted friend relationship checks before serving designs or images.
