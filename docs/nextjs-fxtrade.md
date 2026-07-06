---
rag:
  id: nextjs-fxtrade
  type: project
  title: Nextjs-FXTrade
  aliases: [FXTrade, forex trade, forex demo, FX trade demo, nextjs fxtrade]
---

# Nextjs-FXTrade

> Portfolio knowledge source. Facts about Frederick Aurelio Halim's Nextjs-FXTrade project only.

## 1. At a glance
<!-- rag-section: at-a-glance -->
Nextjs-FXTrade is a forex-trading demo web app by Frederick Aurelio Halim.
- **Summary:** Users sign up, receive ¥100,000 virtual money, and practice buying/selling currencies against live and historical exchange rates.
- **Category:** Full-stack Next.js App Router app — marketing landing page + authenticated trading dashboard.
- **Status:** Demo / portfolio project. Deployed on Vercel.
- **Repo:** https://github.com/FrederickAurelio/Nextjs-FXTrade
- **Live demo:** https://nextjs-fx-trade.vercel.app/

## 2. Problem & purpose
<!-- rag-section: 2-problem-purpose -->
- **Who it's for:** People who want to practice forex trading without risking real money.
- **What it does:** Virtual balance on signup, currency search, historical charts (1m/6m/1y/3y), live rate polling, buy/sell with server-side validation. Rebuilt from an earlier React app, migrated LeanCloud → Supabase.

## 3. Features
<!-- rag-section: 3-features -->
- Email/password + GitHub OAuth auth, password reset, login by username or email.
- Virtual ¥100,000 balance on signup.
- Buy/sell with server-side price fetch and balance checks; average-cost tracking on repeat buys.
- Historical price chart (MUI X LineChart) via Frankfurter API; live rates via CurrencyBeacon (60s poll).
- Holdings table, total assets, responsive desktop/mobile layouts.
- GSAP-animated landing page; compound-component modal for buy/sell dialogs.

## 4. Tech stack
<!-- rag-section: 4-tech-stack -->
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, MUI Material + MUI X Charts, GSAP, React Query, react-hot-toast.
- **Backend:** Next.js server actions + Route Handlers; Supabase JS + `@supabase/ssr`.
- **Database:** Supabase Postgres — `userBalance` and `transactions` tables.
- **Auth:** Supabase Auth (email, GitHub OAuth, OTP).
- **External APIs:** Frankfurter (historical FX), CurrencyBeacon (live rates).
- **Deployment:** Vercel.

## 5. Architecture
<!-- rag-section: 5-architecture -->
Single Next.js app: public marketing routes (`/`, `/login`, `/signup`) and protected `/app` dashboard.

- Middleware refreshes Supabase session cookies and redirects unauthenticated users.
- Server actions handle trades with service-role Supabase client; reads use anon key + RLS.
- Client hooks poll currency APIs; trades call `revalidateTag("transactions")` for cache freshness.

## 6. Notable technical decisions & trade-offs
<!-- rag-section: 6-notable-technical-decisions-trade-offs -->
- **Anon vs. service-role Supabase clients** — RLS prevents client-side balance tampering; writes only server-side.
- **Server-side price + balance validation on every trade** — no trusting client-supplied prices.
- **Two FX providers** — Frankfurter for historical series, CurrencyBeacon for latest quotes.
- **Compound-component Modal** — reusable buy/sell dialogs via context + portals.
- **Tag-based cache revalidation** after mutations to keep dashboard data fresh.

## 7. Interesting / hard problems solved
<!-- rag-section: 7-interesting-hard-problems-solved -->
- **Tamper-resistant virtual trading** — RLS + service-role writes + server-side rate re-fetch.
- **Average-cost accounting** on repeat buys; row deleted when position fully sold.
- **Username-or-email login** — regex detects input type, resolves username via `userBalance` lookup.
- **GitHub OAuth username collision** — appends user-id suffix when display name already exists.
- **React → Next.js migration** with backend moved from LeanCloud to Supabase.
