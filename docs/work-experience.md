---
rag:
  id: work-experience
  type: experience
  title: Work Experience
  aliases: [Mufy, Mufy AI, work history, jobs]
---

# Work Experience

> Portfolio knowledge source. Facts about Frederick Aurelio Halim's work history. Cabin PMS details live in `cabin-pms`. Personal projects live in `projects-overview`.

---

## Catalog
<!-- rag-section: catalog -->
Frederick Aurelio Halim has two paid roles, newest first. Cabin PMS is current freelance client work. Mufy is previous employer product work. Neither is a homepage project card — QuizConnect, Memories, FXTrade, and Promis are documented separately.

| Role | Product | When | Where | Link |
|---|---|---|---|---|
| Freelance Full-Stack Developer | Cabin PMS | July 2026 – Present | Indonesia · Remote | Repo: https://github.com/FrederickAurelio/property-management-system (no live URL) |
| Frontend Developer | Mufy | May 2025 – June 2026 | Hangzhou, China · On-site | Live: https://chat.mufy.ai/ |

- **Cabin PMS:** Staff property-management system for cabin/apartment hospitality (nightly, monthly, yearly stays; walk-in and OTA desks; on-site money). Paid freelance. Repo: https://github.com/FrederickAurelio/property-management-system. No live/demo URL. Full write-up: `cabin-pms`.
- **Mufy:** Consumer AI roleplay chat with UGC creators. Frontend on the public web app. This file covers that job.
- **Not these:** QuizConnect, Memories, FXTrade, and Promis are personal / portfolio projects, not jobs.

---

## Mufy — Frontend Developer

### 1. At a glance
<!-- rag-section: mufy-at-a-glance -->
Frederick Aurelio Halim worked as a Frontend Developer at [Mufy](https://chat.mufy.ai/) in Hangzhou, China (May 2025 – June 2026).
- **Role:** Frontend Developer. Do not print intern or full-time.
- **Company line:** Mufy — the public product, not a legal entity name.
- **Live product:** https://chat.mufy.ai/
- **Location:** Hangzhou, China · On-site.
- **Period:** May 2025 to June 2026. Ended June 2026.

### 2. The product
<!-- rag-section: mufy-product -->
[Mufy](https://chat.mufy.ai/) is a consumer AI roleplay chat app with UGC creators.
- **Live product:** https://chat.mufy.ai/ — try it in the browser.
- **What it is:** People chat with characters other people made, or create their own for others to play with.
- **My side of it:** Web frontend — discovery, commerce, and account — while the product was in production.
- **Do not invent:** user counts, DAU, revenue, or “hundreds of characters.” Those are not sourced.
- **Not the same as portfolio projects:** QuizConnect, Memories, FXTrade, and Promis are in `projects-overview`. Cabin PMS is paid freelance in `cabin-pms`. Mufy is employer product work.

### 3. What I shipped
<!-- rag-section: mufy-shipped -->
Frederick Aurelio Halim shipped **15+** production pages on chat.mufy.ai for consumers and UGC creators (discovery, commerce, and account). Named surfaces, so the chat does not invent extra pages:

1. Explore / recommend tabs
2. Author / creator feeds
3. Comments
4. Detail modal / panel (explore role intro + chat detail panel; a standalone role-detail page is a stub)
5. Settings
6. Beautification shop
7. Decoration shop
8. Top-up
9. Red packet (cash gift) distribution
10. Fan badge
11. Backpack (partial)
12. Character folders / list
13. History
14. Favorites / collections
15. New-user guide
16. Notifications

That is **16** named surfaces — **15+** is honest. Do not say 100+ pages. Character **create** was partial / assisted, not sole ownership.

**Do not claim:** led the frontend team, owned chat-streaming core, owned payment/auth backend, full create form, DAU or revenue.

### 4. Consumer: feeds and comments
<!-- rag-section: mufy-consumer -->
Consumer discovery and social UI on chat.mufy.ai.
- Role and creator feeds with recommend, latest, following, and trending.
- Threaded comments with author pin and fan-badge display on the comment UI.

### 5. Creator commerce
<!-- rag-section: mufy-commerce -->
Creator-facing money screens on the China product — **frontend UI, not the payment backend**.
- Cosmetic / beautification-code shop and decoration shop.
- Wallet top-up.
- Red-packet (cash gift) distribution.
- These shop / top-up / red-packet / backpack / fan-badge shop surfaces were **not** on the second web client.

### 6. Shared UI and session model
<!-- rag-section: mufy-quality -->
Named frontend refactors on the China web app.
- Pulled fan-badge out of settings into backpack; settings reuses the same component.
- Extracted comment-input as a shared component so settings and backpack stopped shipping duplicate UI.
- **Dual-token session (frontend):** replaced a stored session token with a short-lived access token (Bearer) plus an httpOnly refresh cookie. `POST /users/refresh` with `withCredentials`, no Bearer. One refresh in flight, shared by app boot and 401 responses. Logout hits `/users/logout` to revoke the cookie, then clears local state. Login / register / refresh / logout skip the refresh loop.
- Do **not** claim Frederick built the backend refresh API. This is a session-model change on the client.

### 7. Second web client
<!-- rag-section: mufy-second-client -->
Same company, a second web client that is **not public**. Do not print its product brand. No public URL — do not invent one.
- Migrated it from Ant Design to Radix, Tailwind, React Hook Form, and Zod.
- Added cached profile and character-detail hooks and a responsive panel reused across explore and settings.
- Shop, top-up, red-packet, backpack, and fan-badge shop were **absent** on this client (China-only).
- On this client Frederick led the design-system / forms migration. On China Mufy, TanStack Query + Zustand + React Hook Form + Zod were already the team stack — used, not migrated.

### 8. Tech stack
<!-- rag-section: mufy-stack -->
Tech stack Frederick Aurelio Halim used on the China Mufy web app (chat.mufy.ai).
| Category | Technologies |
|---|---|
| Language | TypeScript, JavaScript |
| Framework | React 18 |
| Build | Vite |
| Routing | React Router v6 |
| State | Zustand |
| Server state / API | TanStack React Query, Axios |
| Styling | Tailwind CSS |
| UI components | Radix UI (shadcn/ui-style) |
| Forms | React Hook Form, Zod |
| Package manager | pnpm |

Query / forms on China: already the team stack. Names belong here, not as a “I introduced React Query” story.
