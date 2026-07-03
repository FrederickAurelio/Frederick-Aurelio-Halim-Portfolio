# Nextjs-FXTrade

## 1. At a glance
- **One-line summary (factual):** A forex-trading demo web app where users sign up, receive ¥100,000 of virtual money, and practice buying/selling foreign-exchange currencies against live and historical exchange rates.
- **Category:** Full-stack web app (Next.js App Router) with a marketing landing page + an authenticated trading dashboard.
- **Solo or team:** Solo. Git shows 43 commits, all by a single author, `Frederick Aurelio Halim <frederick.ah88@gmail.com>`.
- **My role (this developer):** Sole developer — built the entire app end to end (auth, Supabase backend, server actions, API routes, trading logic, charts, landing page, responsive UI). Inferred from 100% single-author commit history.
- **Status:** Demo / portfolio project (README calls it a "Forex Trade Demo App"). Last commit 2024-08-16; no commits since, so appears inactive/complete (inferred). No evidence of production traffic in the repo.
- **First commit / last commit / total commits:** 2024-08-08 / 2024-08-16 / 43 commits.
- **Repo URL:** `git@github.com:FrederickAurelio/Nextjs-FXTrade.git` (GitHub: `FrederickAurelio/Nextjs-FXTrade`).
- **Live/demo URL:** None found in README or configs. `NEXT_PUBLIC_BASE_URL` in the local `.env.local` is `http://localhost:3000/` (no deployed URL committed). (unverified whether a live deployment exists)

## 2. Problem & purpose
- **Who it's for:** People who want to learn/practice forex trading without risking real money (README: "users can learn to trade foreign exchange currency in real-time").
- **What problem it solves / why it exists:** Provides a risk-free sandbox to practice buying and selling currencies using real exchange-rate data and fake money. It is a rebuild of the author's earlier React project (`FrederickAurelio/FXTrade`), migrated to Next.js and from LeanCloud to Supabase.
- **What it does, in plain language:** New users register (email/password or GitHub OAuth) and are credited ¥100,000 in virtual balance. They search a currency, view its historical price chart (1m/6m/1y/3y) plus a live rate that refreshes every 60s, then buy or sell quantities. The app tracks holdings, average buy price, and remaining balance per user. All balance/transaction mutations run on the server against Supabase.

## 3. Features
- **Authentication (email/password + GitHub OAuth + password reset):** Server actions in `app/_lib/action.js` (`CreateAccount`, `LoginWithPassword`, `SignInWithGitHub`, `ResetPassowrd`, `ChangePassword`, `SignOutAcount`). OAuth callback in `app/auth/callback/github/route.ts`; password-reset callback in `app/auth/callback/route.ts`; OTP confirm in `app/auth/confirm/route.ts`.
- **Login by username OR email:** `LoginWithPassword` detects if the input is not an email (regex) and looks up the email by username in the `userBalance` table.
- **Virtual balance on signup:** Both email signup and GitHub signup insert a `userBalance` row with `balance: 100000`.
- **Buy / Sell trading with server-side balance checks:** `BuyTransactions` / `SellTransactions` in `app/_lib/action.js`. Computes average buy price on repeat buys; deletes the transaction row when a position is fully sold; updates balance atomically-ish via `Promise.all`.
- **Historical price chart:** `app/_app_components/Chart.js` uses MUI X `LineChart`, fed by `/api/currency` (Frankfurter API) with selectable time ranges (`TimeSeries.js`: 1m/6m/1y/3y).
- **Live latest rate polling:** `useLatestCurrency.js` (React Query) polls `/api/latestcurrency` every 60s, incl. in background.
- **Currency search:** `SearchCurrency.js` with a hardcoded 29-currency list in `app/_lib/helpers.js` (`currencyList`).
- **Holdings table & total assets:** `Table.js`, `TablePage.js`, `TotalAsset.js`.
- **Responsive desktop/mobile layouts:** Separate `DesktopPage.js` and `PhonePage.js` + `PhoneNav.js`; a Tab context (`_components/TabContext.js`) toggles chart/table on mobile.
- **Animated landing page:** GSAP + ScrollTrigger animations in `_components/Animation.js` (runs only on `/`). Landing sections: `Hero`, `About`, `Features`, `Testimonial`, `Footer`.
- **Toast notifications:** `react-hot-toast` configured in `app/layout.js`.
- **Reusable compound Modal:** `app/_app_components/Modal.js` (context + `Modal.Open`/`Modal.Window`, React portal, outside-click hook).
- **Half-built / notable gaps:**
  - `console.log("testt")` left in `SignOutAcount` (`action.js`).
  - Typos in identifiers/messages surfaced to users: `ResetPassowrd`, `SignOutAcount`, `"Sufficients Balance"` error string.
  - Bug (inferred): the "insufficient balance" check throws with `if (totalPrice > balance)` but the message reads "Sufficients Balance" — misleading.
  - No automated tests, no CI, no Dockerfile, no `vercel.json`.

## 4. Tech stack
- **Languages:** JavaScript (majority; `.js` components, actions, API routes) and TypeScript (auth routes, middleware, Supabase utils — `.ts`). JSX/React. CSS via Tailwind + `globals.css`.
- **Frontend:** Next.js `14.2.5` (App Router), React `^18` / react-dom `^18.3.1`, Tailwind CSS `^3.4.1`, MUI Material `^5.16.7` + MUI X Charts `^7.12.1`, Emotion (`@emotion/react` / `@emotion/styled` `^11.13.0`), GSAP `^3.12.5` + `@gsap/react` `^2.1.1`, `react-icons` `^5.2.1`, `react-hot-toast` `^2.4.1`, `@tanstack/react-query` `^5.51.23`, `date-fns` `^3.6.0`.
- **Backend:** Next.js server actions + Route Handlers (`app/api/*`). Supabase JS `@supabase/supabase-js` `^2.45.1` and `@supabase/ssr` `^0.4.0`. `sharp` `^0.33.4` (image optimization).
- **Database / storage:** Supabase (Postgres). Tables referenced in code: `userBalance` and `transactions`. No SQL migrations/schema files committed.
- **Auth:** Supabase Auth — email/password, GitHub OAuth, password reset, OTP confirm. SSR session handling via `@supabase/ssr` cookies.
- **Third-party services / APIs:** Supabase; GitHub OAuth; Frankfurter API (`api.frankfurter.app`) for historical rates; CurrencyBeacon API (`api.currencybeacon.com`) for latest rates.
- **Infra / deployment / CI:** None committed. `.gitignore` includes `.vercel` (Vercel intended — inferred). No Dockerfile, no GitHub Actions.
- **Notable dev tooling:** ESLint `^8` with `eslint-config-next` `14.2.5` (`.eslintrc.json`), PostCSS `^8`, `@types/react` `18.3.3`. Path alias `@/*` in `jsconfig.json`.

## 5. Architecture
- **High level:** Next.js App Router monorepo-style single app. Public marketing routes (`/`, `/login`, `/signup`, `/forgot`, `/reset`) and a protected app route (`/app`). Middleware guards routes and refreshes Supabase sessions. Server actions handle mutations; Route Handlers proxy external currency APIs and read user data.
- **Key directories:**
  - `app/` — App Router pages (`page.js` landing, `app/page.js` dashboard, `login`, `signup`, `forgot`, `reset`, `error.js`, `not-found.js`, `loading.js`, `layout.js`).
  - `app/_components/` — landing-page + shared UI (Hero, About, Features, Footer, Navbar, Spinner, buttons, `TabContext`, `Animation`).
  - `app/_app_components/` — the authenticated trading UI (Chart, Table, Buy, Sell, Modal, SearchCurrency, TimeSeries, TotalAsset, Phone/Desktop pages, nav).
  - `app/_lib/` — server actions (`action.js`), data fetching (`data-service.js`), helpers/currency list (`helpers.js`), React Query provider + hooks (`useCurrency`, `useLatestCurrency`).
  - `app/api/` — Route Handlers: `currency` (historical), `latestcurrency` (live), `transactions` (per-user data).
  - `app/auth/` — OAuth/reset/OTP callback route handlers.
  - `utils/supabase/` — `client.ts` (browser), `server.ts` (server component), `middleware.ts` (session refresh).
  - `public/` — static images (landing/about/features/phone backgrounds).
- **Data flow / request lifecycle (inferred):** Request → `middleware.ts` → `updateSession` refreshes Supabase cookies and redirects unauthenticated users off `/app` to `/login` (and authenticated users off `/login` to `/app`). `/app` server component calls `getTransactions()` → fetches `/api/transactions?user_id=...` (service-role Supabase read) → passes data to Chart/Table. Client hooks poll `/api/currency` and `/api/latestcurrency`. Buy/Sell trigger server actions that re-fetch the latest rate, validate balance server-side, mutate Supabase with the service-role key, then `revalidateTag("transactions")`.
- **Diagrams present?** None found.

## 6. Notable technical decisions & trade-offs
- **Two Supabase clients — anon (RLS-bound) vs. service-role:** Reads/session use the anon key via `@supabase/ssr` (`utils/supabase/*`); all writes to `userBalance`/`transactions` use a service-role client (`CreateClientServer` in `action.js`, `/api/transactions`). Rationale (inferred + README): RLS locks the tables so only the server (service role) can mutate them, preventing client-side balance tampering. Trade-off: correctness/security over simplicity; requires careful key handling.
- **Server-side price + balance validation on every trade:** Buy/Sell re-fetch the live rate server-side and check balance/holdings before writing (`action.js`). Rationale (README, "Server-Side Data Validation"): prevent exploits from client-supplied prices/quantities.
- **Compound-component Modal pattern:** `Modal` uses context + `Modal.Open`/`Modal.Window` + `createPortal` + an outside-click hook (`Modal.js`). Rationale (inferred): reusable, declarative modal composition for Buy/Sell.
- **React Query for polling external rate APIs:** `useLatestCurrency` polls every 60s with background refetch; `useCurrency` keyed by `[cur, time]`. Rationale (inferred): caching + auto-refresh of volatile rate data without manual effects.
- **Two separate external rate providers:** Frankfurter for historical time series, CurrencyBeacon for the latest rate. Rationale (inferred): Frankfurter provides date-range series; CurrencyBeacon used for real-time latest quotes.
- **Router-cache tag revalidation:** trades call `revalidateTag("transactions")` and `getTransactions` fetches with `next: { tags: ['transactions'] }`. Trade-off/known pain: commit history repeatedly mentions "Get some bugs on caching."

## 7. Interesting / hard problems solved
- **Preventing client-side cheating in a money app:** Combines RLS + a server-only service-role client + server-side re-fetch of prices, so balances and holdings can't be forged from the browser (`action.js`, README).
- **Average-cost accounting on repeat buys:** On buying more of an owned asset, recomputes weighted average buy price: `(avg*qty + price*buyQty)/(qty+buyQty)` and deletes the row when fully sold (`BuyTransactions`/`SellTransactions`).
- **Unified username-or-email login:** Regex-detects email vs. username and resolves username → email via `userBalance` before `signInWithPassword`.
- **GitHub OAuth username collision handling:** On OAuth signup, if the GitHub display name already exists, appends `#` + first 5 chars of the user id (`auth/callback/github/route.ts`).
- **Next.js cache invalidation after mutations:** Tag-based revalidation to keep the dashboard fresh (acknowledged as buggy in commits).
- **React migration:** Rebuilt an existing React app on Next.js App Router and migrated the backend from LeanCloud to Supabase (README).

## 8. Auth & security
- **AuthN/AuthZ:** Supabase Auth (email/password, GitHub OAuth, reset, OTP). `middleware.ts` (matcher: `/app`, `/login`) runs `updateSession` to refresh cookies and redirect based on auth state. Server code identifies the user via `supabase.auth.getUser()` and scopes queries by `user_id`.
- **Security measures found:**
  - Row Level Security on Supabase tables so only the service role can write (README; enforced by using anon vs. service-role clients).
  - Server-side balance/quantity validation before every mutation.
  - Session handling per Supabase SSR guidance (no logic between client creation and `getUser()`).
- **Security concerns / observations (flag for human):**
  - The service-role key env var is named `NEXT_PUBLIC_SUPABASE_SECRET_KEY`. The `NEXT_PUBLIC_` prefix marks a variable as client-exposable in Next.js; it is currently only referenced server-side (`action.js`, `/api/transactions`, `auth/callback/github`), but the naming is risky — if ever used in client code it would leak the service_role key. (flag)
  - `/api/latestcurrency` and `/api/transactions` are unauthenticated Route Handlers; `/api/transactions` accepts an arbitrary `user_id` query param and returns that user's balance/holdings using the service-role client — no auth check on the endpoint (potential IDOR). (flag, inferred)
  - `next.config.mjs` sets `Access-Control-Allow-Origin: *` on all `/api/*` routes.
  - A local `.env.local` file exists in the working tree containing real-looking Supabase URL/keys and a CurrencyBeacon API key. It is **not** committed (`.gitignore` excludes `.env*.local`, and `git ls-files` shows no env file tracked). Values are NOT reproduced here. (flag: rotate keys if this file was ever shared)
- **Required env vars (names only):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_CUR_API_KEY`. (No `.env.example` committed.)

## 9. Data model
- **Source:** No migration/schema/ORM files in the repo. Entities are inferred from Supabase queries in `app/_lib/action.js`, `app/api/transactions/route.js`, and `app/auth/callback/github/route.ts`.
- **`userBalance`** (columns referenced): `user_id` (FK to Supabase `auth.users`), `username` (max 20 chars on insert), `email`, `balance` (numeric, initialized to `100000`).
- **`transactions`** (columns referenced): `id`, `user_id`, `asset` (currency code), `avgBuyPrice`, `quantity`.
- **Relationships:** One `userBalance` per auth user (1:1, keyed by `user_id`); many `transactions` per user (1:N by `user_id`), typically one row per owned `asset`.
- Supabase Auth's `auth.users` table is the identity source (managed by Supabase, not defined in repo).

## 10. APIs & integrations
- **Internal endpoints (Route Handlers):**
  - `GET /api/currency?cur=&time=` — historical rates from Frankfurter (`{date}..?to={cur}&base=CNY`), `revalidate: 3600`; time maps 1m→30d, 6m→183d, 1y→366d, 3y→1096d.
  - `GET /api/latestcurrency` — latest rates from CurrencyBeacon (`base=CNY`, `cache: 'no-store'`).
  - `GET /api/transactions?user_id=` — returns `{ transactions, username, balance }` via service-role Supabase.
  - `GET /auth/callback` — password-reset code exchange → redirect to `/reset?link=true`.
  - `GET /auth/callback/github` — OAuth code exchange + `userBalance` row creation → `/app`.
  - `GET /auth/confirm` — OTP verification (`verifyOtp`).
- **Server actions (`app/_lib/action.js`):** `CreateAccount`, `LoginWithPassword`, `SignInWithGitHub`, `ResetPassowrd`, `ChangePassword`, `SignOutAcount`, `BuyTransactions`, `SellTransactions`.
- **External services:** Supabase (DB + auth), GitHub OAuth, Frankfurter API (historical FX, base CNY), CurrencyBeacon API (latest FX, base CNY, API-key auth).

## 11. Deployment & running it
- **Scripts (`package.json`):** `dev` = `next dev`, `build` = `next build`, `start` = `next start`, `lint` = `next lint`, `prod` = `next build && next start`.
- **Run locally (inferred, no explicit README instructions):** `npm install`, create a `.env.local` with the 5 env vars above (Supabase project, GitHub OAuth app, CurrencyBeacon key), set up Supabase `userBalance`/`transactions` tables with RLS, then `npm run dev` (default `http://localhost:3000`).
- **Deployment:** No deploy config committed. `.gitignore` referencing `.vercel` suggests Vercel was intended (inferred). No live URL found. (unverified)
- **Env/config requirements:** See §8. Note `NEXT_PUBLIC_BASE_URL` is used to build absolute fetch/redirect URLs, so it must be set correctly per environment.

## 12. Testing & quality
- **Tests:** None found. No test framework in dependencies; no test files. `.gitignore` has a `/coverage` entry but no coverage tooling present.
- **Linting:** ESLint via `eslint-config-next` (`.eslintrc.json` extends `next/core-web-vitals`). `reactStrictMode: false` in `next.config.mjs`.
- **CI:** None found (no `.github/workflows`, no other CI config).
- **Quality gaps:** leftover debug `console.log`, several identifier/message typos, no input schema validation library, unauthenticated data endpoint (see §8).

## 13. Metrics & scale
- **Commits:** 43 total (git). **Contributors:** 1 (git).
- **Supported currencies:** 29 (hardcoded `currencyList` in `helpers.js`).
- **Starting virtual balance:** ¥100,000 per user (code + README).
- **Live-rate poll interval:** 60,000 ms; historical cache: 3600 s.
- **Dependencies:** 16 runtime + 5 dev (package.json).
- **Real-world usage (users, traffic, uptime, performance gains):** No evidence in repo.
- **Bundle size / build output metrics:** No evidence in repo.

## 14. Timeline
- **Build period:** 2024-08-08 → 2024-08-16 (~9 days).
- **Milestones from commit history:**
  - 2024-08-08: First commit; Supabase auth + GitHub OAuth working; React→Next.js migration "half done."
  - 2024-08-09 to 08-10: Data fetching wired up; data displayed in UI; Create/Update/Delete transactions via server actions completed.
  - 2024-08-11: Added not-found page; multiple bug-fix and README-update commits; chart bug fixes.
  - 2024-08-14–08-15: Caching bug fixes; "Improve UX."
  - 2024-08-16: Final README update (last commit).

## 15. Assets
- **Images in `public/`:** `about.jpg`, `about2.png`, `bg.jpg`, `features.png`, `features1.png`, `features2.png`, `features4.png`, `features5.png`, `Phoneback.jpg`, `profile.jpeg`, `vite.svg` (leftover from the original Vite/React project — inferred).
- **App icon:** `app/icon.svg`.
- **README screenshots:** Hosted on GitHub user-attachments URLs (4 images embedded in `README.md`), not stored in-repo.
- **Design files/links:** None found.

## 16. Resume bullet candidates (factual, no invented metrics)
- Built a full-stack forex-trading demo app with Next.js 14 (App Router), React, and Supabase, letting users practice trading 29 currencies with ¥100,000 of virtual money using live and historical exchange-rate data. [add metric? users/sessions]
- Implemented multi-method authentication (email/password, username login, GitHub OAuth, password reset, OTP) on Supabase Auth with route-guarding middleware and SSR session handling.
- Enforced tamper-resistant trading by combining Supabase Row Level Security with a server-only service-role client and server-side price/balance validation in Next.js server actions.
- Integrated two external FX APIs (Frankfurter for historical series, CurrencyBeacon for live rates) with React Query polling and Next.js tag-based cache revalidation to keep dashboards current. [add metric? refresh cadence impact]
- Designed a responsive trading dashboard with MUI X line charts, a GSAP-animated landing page, and a reusable compound-component modal (context + portals). [add metric? Lighthouse/perf]

## 17. Nice-to-know
- The app is a Next.js rewrite of the author's earlier React app `FrederickAurelio/FXTrade` (backend also migrated LeanCloud → Supabase).
- Base currency for all pricing is CNY (`base=CNY`), and currency formatting uses the `zh-CN` locale (`helpers.js`) — quantities/prices are shown in yuan.
- `public/vite.svg` is a leftover from the original Vite-based React project (inferred).
- Naming quirks/typos: `ResetPassowrd`, `SignOutAcount`, error string `"Sufficients Balance"`, and a `console.log("testt")` still in `SignOutAcount`.
- Chart color logic flips red/green based on whether the currency rose or fell over the selected window.
- `reactStrictMode` is disabled, likely to avoid double-invocation side effects during development (inferred).

## 18. Open questions for the human
- Is there a live/deployed version (Vercel or otherwise)? What is the URL and is it still up?
- Was this ever used by real users? Any user counts, sessions, or feedback? (repo shows none)
- Is `NEXT_PUBLIC_SUPABASE_SECRET_KEY` (service-role) being kept server-only in the deployed build, and have those keys been rotated since the local `.env.local` was created?
- Was the `/api/transactions` endpoint intended to be auth-protected? (currently trusts a `user_id` query param)
- Are the Supabase tables (`userBalance`, `transactions`) and RLS policies documented anywhere outside the repo? Can the schema/migrations be exported?
- Is the project considered finished/archived, or paused? (no commits since 2024-08-16)
- Was this a personal/portfolio project or built for a client/course?
- Any performance, accessibility, or Lighthouse results worth citing?

## 19. Evidence & confidence notes
- **Strongest claims** (auth flow, trading logic, RLS/service-role split, external APIs, env var names, data model, tech versions) come directly from source files: `app/_lib/action.js`, `app/api/*/route.js`, `app/auth/**`, `utils/supabase/*`, `middleware.ts`, `package.json`, and `README.md`.
- **Git facts** (43 commits, single author, 2024-08-08→2024-08-16, remote URL) come from `git log`/`git shortlog`/`git remote`.
- **Inferred items** (deployment target, request lifecycle details, some rationale, "vite.svg leftover") are marked `(inferred)`; unconfirmed items marked `(unverified)`.
- **Data model confidence: medium** — no schema/migrations committed; tables/columns reconstructed from queries only.
- **Overall confidence: high** for what the code does; **low** for real-world usage, deployment status, and outcomes (no evidence in repo).
