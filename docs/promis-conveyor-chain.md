# Promis Conveyor Chain

> Raw factual context file for reuse in resume, portfolio, and project write-ups. Grounded in the repository at `promis-web`. Nothing here is polished marketing copy.

## 1. At a glance
- **One-line summary (factual):** A multi-page marketing/company website (Next.js App Router) for "Promis Conveyor Chain", a company selling conveyor chains, sprockets, and transmission components for palm oil mills (pabrik kelapa sawit) in Indonesia. Content is in Indonesian.
- **Category:** Marketing / company profile website (static content, no backend). Brochure-style corporate site.
- **Solo or team:** Team (git shows multiple contributors, see below). Primary author dominant.
- **My role:** Cannot be confirmed from repo alone. Git shows "Frederick Aurelio Halim" as the primary committer (47 of 58 commits) covering nearly all feature/UI work; the two other contributors made mostly copy/text/image edits. If THIS developer is Frederick, the role is effectively lead/sole front-end developer (inferred). Flag: confirm which contributor is the resume owner.
- **Status:** Active development as of last commit. Live demo at https://promis-web.vercel.app/ (portfolio link).
- **First commit date:** 2026-03-02 (`Initial commit from Create Next App`)
- **Last commit date:** 2026-03-20
- **Total commits:** 58
- **Repo URL:** https://github.com/FrederickAurelio/promis-web (portfolio link; git remote: `git@github.com:FrederickAurelio/promis-web.git`).
- **Live/demo URL:** https://promis-web.vercel.app/ (portfolio link).

## 2. Problem & purpose
- **Who it's for:** Palm oil mill operators / industrial buyers in Indonesia who need conveyor chains, roller/transmission chains, sprockets, and connecting links. Also serves SEO/lead-generation purposes for the seller company.
- **What problem it solves / why it exists:** Provides an online presence and product catalog for the company so prospective industrial customers can view products, specs, gallery, FAQ, and contact the company (primarily via WhatsApp) to request a quote. It is a lead-capture funnel, not an e-commerce store (no cart/checkout).
- **What it does, in plain language:** A four-page website (Home, Products, About, Contact) built with Next.js. It presents the company's product lines and specs, a company timeline and gallery, an operational-hours/contact block with an embedded Google Map, and a FAQ. Calls to action route to WhatsApp (`wa.me`) and a downloadable product brochure PDF. All product/testimonial/FAQ data is hardcoded in the page components; there is no database or API backend.

## 3. Features
- **Routing / pages** (`src/app/`): Home (`page.tsx`), Products (`products/page.tsx`), About (`about/page.tsx`), Contact (`contact/page.tsx`), custom 404 (`not-found.tsx`).
- **Home page sections** (`src/app/page.tsx`): Hero, "Spesialisasi Solusi Transmisi" (industry sectors grid), "Mengapa Memilih Promis?" (reasons), "Produk Pilihan Kami" (featured products), "Galeri Operasional", "Testimoni" (auto carousel), and a final CTA section.
- **Products page** (`src/app/products/page.tsx`): Product catalog with spec tables (Conveyor Chain, Roller Chain), image carousels per product, "Cara Pemesanan" (ordering steps), and "Minta Penawaran Harga" WhatsApp CTA.
- **About page** (`src/app/about/page.tsx`): Company intro, vertical timeline (`TIMELINE_ITEMS`), services ("Servis Kami"), Quality Control manufacturing steps with carousel, and a documentation gallery.
- **Contact page** (`src/app/contact/page.tsx`): Contact info block, operational hours, embedded Google Maps iframe, FAQ accordion, and `FAQPage` JSON-LD structured data.
- **Global layout / UX** (`src/app/layout.tsx`): Sticky navbar, footer, floating WhatsApp button, theme provider (`next-themes`, default light), tooltip provider, and a viewport-height provider.
- **Navbar** (`src/components/layout/navbar.tsx`): Responsive with mobile collapse menu, scroll-based style change, active-route highlighting, "Minta Penawaran" WhatsApp button, and a "Brosur" link that downloads `public/brosur-produk.pdf`.
- **Animations / transitions** (`src/components/transitions/`): `reveal-card.tsx` (Framer Motion scroll reveal with blur), `hero-transition.tsx`, `carousel-auto.tsx` (Embla autoplay carousel with optional badge), `CollapseTransition.tsx`, plus page transitions via `src/app/template.tsx`.
- **SEO** (see `SEO.md`, `layout.tsx`, `sitemap.ts`, `robots.ts`, `manifest.ts`): metadata, Open Graph, Twitter cards, JSON-LD (Organization, WebSite, LocalBusiness, FAQPage), dynamic sitemap, robots.txt, and a PWA-style web manifest.
- **PWA manifest** (`src/app/manifest.ts`): name, short_name "Promis Chain", standalone display, icons.
- **Half-built / TODO / disabled / quirks:**
  - Root-level `text` file contains Indonesian to-do notes ("footer ... grid ... ALL MUST RESPONSIVE...") — a scratch dev note, still committed.
  - Root-level `Untitled` file contains `docker compose -f docker-compose.yml -f docker-compose.dev-db.yml up -d mongodb redis` — references MongoDB/Redis and compose files that DO NOT exist in this repo; appears to be an unrelated stray snippet. (inferred stray/unused)
  - Testimonials in `src/app/page.tsx` reference the brand name "IndoChain" in their text, not "Promis" — likely placeholder/copy-paste content. (inferred)
  - Several visible typos in UI copy (e.g. "Lihat Lokasi Kmai", "Infomasi Kontak", "Geleri Dokumentasi", "terbak").

## 4. Tech stack
- **Languages:** TypeScript, TSX/React, CSS (Tailwind). Content in Indonesian.
- **Frontend framework:** Next.js `16.1.6` (App Router, RSC), React `19.2.3`, React DOM `19.2.3`.
- **Key frontend libraries (from `package.json`):**
  - `framer-motion` ^12.34.5 (animations)
  - `embla-carousel-react` ^8.6.0 + `embla-carousel-autoplay` ^8.6.0 (carousels)
  - `radix-ui` ^1.4.3 and shadcn-style UI components (`src/components/ui/`)
  - `lucide-react` ^0.576.0, `@tabler/icons-react` ^3.40.0, `@iconify/react` ^6.0.2, `@iconify/icons-mdi` ^1.2.48 (icons)
  - `next-themes` ^0.4.6 (theme provider)
  - `class-variance-authority` ^0.7.1, `clsx` ^2.1.1, `tailwind-merge` ^3.5.0 (`cn()` in `src/lib/utils.ts`)
- **Styling:** Tailwind CSS v4 (`tailwindcss` ^4, `@tailwindcss/postcss`), `tw-animate-css` ^1.4.0; global styles in `src/app/globals.css`. shadcn config in `components.json` (style "new-york", base color "neutral", icon library lucide).
- **Backend:** None. No server routes, no API handlers, no server actions found. Fully static/marketing site rendered by Next.
- **Database / storage:** None. All data (products, specs, testimonials, FAQ, timeline, gallery) is hardcoded in component files. `src/constant/index.ts` holds contact/company constants.
- **Auth:** None.
- **Third-party services / APIs:** Google Maps (embedded iframe + maps link in `src/constant/index.ts`), WhatsApp (`wa.me` deep links), `tel:`/`mailto:` links, Google Fonts via `next/font` (Geist, Geist_Mono). External SEO tooling (Google Search Console, etc.) is described in `SEO.md` as manual steps, not code.
- **Infra / deployment / CI:** No Dockerfile, no `vercel.json`, no CI workflow (`.github/`) found. README is the default create-next-app README suggesting Vercel deployment. (deployment target = Vercel is inferred/suggested, not configured)
- **Notable dev tooling:** ESLint 9 (`eslint.config.mjs`, `eslint-config-next` 16.1.6), Prettier ^3.8.1 with `prettier-plugin-tailwindcss`, `shadcn` ^3.8.5 CLI (devDependency), TypeScript ^5.

## 5. Architecture
- **High-level structure:** Standard Next.js App Router project. All routes live under `src/app/` as server components by default; interactive/animation pieces are client components (`"use client"`). No backend/API layer — the site is presentational with hardcoded data and external deep links (WhatsApp, Maps).
- **Key directories:**
  - `src/app/` — routes (`page.tsx` per route), root `layout.tsx`, `template.tsx` (page transitions), `globals.css`, and metadata route handlers `sitemap.ts`, `robots.ts`, `manifest.ts`, plus `not-found.tsx`.
  - `src/components/layout/` — `navbar.tsx`, `footer.tsx`, `section-container.tsx`, `viewport-provider.tsx`, `whatsapp-button.tsx`.
  - `src/components/transitions/` — Framer Motion / Embla wrappers (`reveal-card.tsx`, `hero-transition.tsx`, `carousel-auto.tsx`, `CollapseTransition.tsx`).
  - `src/components/ui/` — shadcn/Radix primitives (`accordion`, `badge`, `button`, `carousel`, `separator`, `sheet`, `table`, `tooltip`).
  - `src/constant/index.ts` — single source of truth for company contact info, URLs, social links, WhatsApp/tel/mailto links, Maps embed URL.
  - `src/lib/utils.ts` — `cn()` Tailwind class merge helper.
  - `public/` — all images (product photos, gallery, logos), `brosur-produk.pdf`, `whatsapp.svg`, `favicon.png`, `OG.jpg`.
- **Data flow / request lifecycle (inferred):** Next.js serves pre-rendered pages. Page components render hardcoded arrays (e.g. `PRODUCTS`, `TESTIMONI`, `FAQ_ITEMS`, `TIMELINE_ITEMS`) into UI. Client components hydrate for interactivity (navbar scroll/menu, carousels, scroll-reveal, viewport-height CSS var). User actions (CTAs) navigate to external WhatsApp/tel/mailto links or download the brochure PDF. No client-server data fetching. (inferred from code; consistent throughout)
- **Diagrams present in repo?** None found.

## 6. Notable technical decisions & trade-offs
- **Centralized constants file** (`src/constant/index.ts`): Company name, phone, email, address, social links, WhatsApp/Maps URLs all defined once and imported across pages and JSON-LD. Trade-off: easy to update contact info in one place; used by SEO structured data too. (rationale inferred; commit `feat: contact information and make constant file for truth source ...`)
- **SEO-first metadata & structured data** (`layout.tsx`, per-page `metadata`, `sitemap.ts`, `robots.ts`, plus `SEO.md`): Extensive Open Graph/Twitter/JSON-LD (Organization, WebSite, LocalBusiness, FAQPage) with Indonesian `lang="id"` and `id_ID` locale. Trade-off/rationale: local-business discoverability in Indonesian search (documented in `SEO.md`). One SEO commit came from a `codex/improve-seo-for-codebase` branch (PR #1).
- **WhatsApp-as-conversion instead of forms/backend:** All "request quote" CTAs deep-link to `wa.me`; no contact form, no server, no database. Trade-off: zero backend maintenance and immediate lead contact, at the cost of no on-site lead capture/analytics. (inferred)
- **Framer Motion + Embla for motion UX** (`reveal-card.tsx`, `carousel-auto.tsx`, `template.tsx`): Scroll-reveal (with blur), auto-playing carousels, and page-transition wrapper via `template.tsx`. `RevealCard` uses lazy `useState(() => Math.random()*delay)` to compute a stable random stagger delay once per mount. Trade-off: richer feel vs. added client JS.
- **Real-viewport-height provider** (`viewport-provider.tsx`): Sets a `--vh` CSS variable from `window.innerHeight` to work around mobile browser 100vh issues. (rationale inferred — common mobile viewport fix)
- **shadcn/Radix + Tailwind v4 component system** (`components.json`, `src/components/ui/`): Uses copy-in shadcn components ("new-york" style) rather than a heavyweight UI kit. Trade-off: full control over component code vs. maintaining them in-repo.

## 7. Interesting / hard problems solved
- **Scroll-reveal with staggered, stable random delays** (`src/components/transitions/reveal-card.tsx`): Uses Framer Motion `whileInView` with blur+translate, and lazily initialized `Math.random()` delay so the stagger is randomized but stable across re-renders.
- **Auto-playing, resumable carousels with optional badge/counter** (`src/components/transitions/carousel-auto.tsx`, used on home testimonials and product/QC image galleries). Commit: `feat: auto resume and badge feature one corousel auto`.
- **Mobile viewport height correctness** (`viewport-provider.tsx`) — computing a real `--vh` unit to avoid mobile 100vh jump, used by the hero's height calc.
- **Comprehensive SEO/structured-data setup** across `layout.tsx` + metadata routes, documented step-by-step in `SEO.md` (including external Search Console/Bing/Google Business steps). 
- **Responsive navbar behaviors** (`navbar.tsx`): scroll-triggered blur/shrink, click/touch-outside to close the mobile menu, active-route detection, and a download link mixed with nav links.

Note: These are UI/front-end engineering challenges. No algorithmically complex/backend problems exist in this repo.

## 8. Auth & security
- **Authentication/authorization:** None. There is no login, no user accounts, no protected routes, no session/JWT logic. It is a public static site.
- **Security measures found:**
  - External links use `target="_blank"` with `rel="noopener noreferrer"` (e.g. WhatsApp/Maps/social CTAs).
  - JSON-LD injected via `dangerouslySetInnerHTML` is escaped with `.replace(/</g, "\\u003c")` to mitigate script injection in structured data (`layout.tsx`, `contact/page.tsx`).
  - `referrerPolicy="no-referrer"` / `no-referrer-when-downgrade` on some images and the Maps iframe.
  - No user input is collected/processed, so classic input-validation/rate-limiting concerns largely don't apply.
- **Required env vars (names only):** None found. `.gitignore` ignores `.env*`, but there is no `.env.example` and no `process.env.*` usage in `src/` (the site URL is hardcoded in `src/constant/index.ts`). N/A.

## 9. Data model
- **Database:** None. No migrations, no ORM, no schema files.
- **In-code "data" (hardcoded arrays), for reference:**
  - Products & specs: `products` in `src/app/products/page.tsx`; `PRODUCTS`/`SEKTOR_INDUSTRI` in `src/app/page.tsx`.
  - Testimonials: `TESTIMONI` in `src/app/page.tsx`.
  - FAQ: `FAQ_ITEMS` in `src/app/contact/page.tsx` (also drives FAQ JSON-LD).
  - Company timeline: `TIMELINE_ITEMS` in `src/app/about/page.tsx`.
  - Galleries: `GALLERY_OPERATIONAL` (home), `GALLERY_ITEMS` (about).
  - Contact/company constants: `src/constant/index.ts`.
- **Relationships:** N/A (no relational data).

## 10. APIs & integrations
- **Internal endpoints:** None (no `route.ts`/API handlers, no server actions). Only Next.js metadata routes that emit files: `/sitemap.xml` (`sitemap.ts`), `/robots.txt` (`robots.ts`), `/manifest.webmanifest` (`manifest.ts`).
- **External services / integrations:**
  - **WhatsApp** — `wa.me/6281269708999` deep links as the primary conversion channel (`WHATSAPP_LINK`).
  - **Google Maps** — embedded iframe (`MAPS_EMBED_URL`) and a maps share link (`MAPS_QUERY_URL`) on the Contact page.
  - **Telephone / Email** — `tel:` and `mailto:` links from constants.
  - **Google Fonts** — Geist / Geist Mono via `next/font/google`.
  - **Social profiles** — Facebook, Instagram, LinkedIn URLs in `SOCIAL_LINKS` (also surfaced in JSON-LD `sameAs`).
  - **Brochure download** — static `public/brosur-produk.pdf`.

## 11. Deployment & running it
- **Run locally (from `package.json` scripts):**
  - `npm run dev` — Next dev server (`next dev`)
  - `npm run dev:localhost` — `next dev --hostname localhost`
  - `npm run build` — `next build`
  - `npm run start` — `next start`
  - `npm run lint` — `eslint`
  - Default dev URL: `http://localhost:3000` (per README).
- **How/where it's deployed:** No deployment config committed (no `vercel.json`, Dockerfile, or CI). README is the stock create-next-app README recommending Vercel. Actual hosting is unverified. The `Untitled` file's `docker compose ... mongodb redis` command does not correspond to any file in this repo and appears unrelated. (unverified)
- **Env/config requirements:** No environment variables required by the code. Site URL/contact details are hardcoded in `src/constant/index.ts`.

## 12. Testing & quality
- **Test framework:** None found. No test files, no test runner in `package.json`, no `/coverage` (though `.gitignore` lists it as a convention).
- **What's covered:** Nothing (no automated tests).
- **Linting/CI:** ESLint 9 configured (`eslint.config.mjs` extending `eslint-config-next` core-web-vitals + typescript) and Prettier with Tailwind plugin (`.prettierrc`). No CI pipeline found to run them automatically. TypeScript strict mode is on (`tsconfig.json` `"strict": true`).

## 13. Metrics & scale
- **Repo/code facts:** 58 git commits; 4 user-facing routes (+ 404); 8 shadcn UI components in `src/components/ui/`; ~45 image assets in `public/` plus 1 brochure PDF; 5 hardcoded testimonials; 8 FAQ items; 5 timeline entries.
- **Bundle size / build output:** No evidence in repo (no committed build stats).
- **Test count:** 0 (no tests).
- **Real-world usage numbers (users, traffic, conversions, uptime):** No evidence in repo.
- Note: Marketing numbers in the UI copy ("30 tahun pengalaman", "Garansi hingga 10.000 jam", "umur pakai 30% lebih lama", "sejak 2017") are **company sales claims in page content, not measured project metrics** — do not use as engineering metrics.

## 14. Timeline
- **Build period (from git):** 2026-03-02 to 2026-03-20 (~19 days of active commits).
- **Notable milestones from commit history:**
  - 2026-03-02: `Initial commit from Create Next App`.
  - 2026-03-03: Navbar, routing, floating WhatsApp button.
  - 2026-03-04: Footer, hero section, folder-structure refactor.
  - 2026-03-05–06: Home page sections (produk pilihan, galeri operasional), styling.
  - 2026-03-07: Testimonial carousel, reveal-card animation + `template.tsx` transitions, About page, contact info + constants file, FAQ.
  - 2026-03-08: Product catalog UI, SEO groundwork, WhatsApp quote link.
  - 2026-03-09: Footer copyright / PT name.
  - 2026-03-12: SEO metadata & structured-data improvements (via `codex/improve-seo-for-codebase`, PR #1), local-only dev script.
  - 2026-03-18–20: Copy/text changes ("Ganti Teks", "Ganti Nama Sektor"), photo/quality-control images, brochure download, and fixes (carousel on QC section, icons/images) via PRs #2–#5.

## 15. Assets
- **Images (`public/`):** Product/industrial photos (`Depan*.jpg`, `Conv1–3`, `Trans1–3`, `Banyak*`, `Qu1–8`), gallery images (`Galeri-*`: stok, produksi, kemas, delivery, Palmex 2024/2025, pabrik), operational photos (`Pabrik.jpeg`, `Gudang.jpg`, `Kemasan.jpeg`, `Delivery.jpg`), `about*.jpg`.
- **Logos / branding:** `public/logo.png`, `public/logo-ipp.png`, `public/favicon.png`, `src/app/favicon.ico`.
- **Social / OG:** `public/whatsapp.svg`, `public/OG.jpg` (Open Graph share image, referenced as `DEFAULT_OG_IMAGE`).
- **Documents:** `public/brosur-produk.pdf` (product brochure, linked from navbar "Brosur").
- **Design files/links:** None referenced in the repo.

## 16. Resume bullet candidates (factual, no invented metrics)
- Built a responsive multi-page company/marketing website with Next.js 16 (App Router), React 19, and TypeScript for an industrial (palm-oil-mill) conveyor-chain supplier. [add metric? e.g. page-count already 4; real traffic/leads unknown]
- Implemented an SEO foundation including per-page metadata, Open Graph/Twitter cards, JSON-LD structured data (Organization, LocalBusiness, WebSite, FAQPage), a dynamic sitemap, robots, and a web manifest. [add metric? e.g. search ranking/impressions — no data in repo]
- Developed animated, interactive UI with Framer Motion (scroll-reveal, page transitions) and Embla auto-playing carousels, plus a scroll-aware responsive navbar and mobile menu.
- Built a reusable component system on Tailwind CSS v4 and shadcn/Radix primitives, with a centralized constants module as a single source of truth for company/contact data reused across pages and structured data.
- Integrated lead-generation flows via WhatsApp deep links, click-to-call/email, embedded Google Maps, and a downloadable product brochure. [add metric? conversion/lead numbers — no data in repo]

## 17. Nice-to-know
- Content is entirely in Indonesian; the target market is Indonesian palm oil (kelapa sawit) mills, based in Medan, Sumatera Utara.
- Legal/company entity referenced in content: "PT Inti Perkasa Panca Surya" (About timeline; also `logo-ipp.png`). Brand "Promis" said (in copy) to have formed in 2021.
- Testimonials in code still say "IndoChain" — a placeholder brand name inconsistent with "Promis" (likely template content). (inferred)
- Two stray committed files: `text` (Indonesian to-do notes) and `Untitled` (an unrelated `docker compose ... mongodb redis` command not backed by any file here).
- Some UI copy typos remain (e.g. "Lihat Lokasi Kmai", "Infomasi Kontak", "Geleri Dokumentasi", "penawaran harga terbak").
- `.next/` build cache is present locally but git-ignored.
- Branch names hint at workflow: `copy` (text edits), `fixing-update`, `codex/improve-seo-for-codebase` (an AI-assisted SEO pass), merged via PRs #1–#5.

## 18. Open questions for the human
- Which git contributor is the resume owner? (Frederick Aurelio Halim = 47 commits and nearly all feature work; stevanielim123 / Stevanie = ~11 commits, mostly copy/image edits.) Solo or team, and what was your specific role?
- Is https://promis-web.vercel.app/ still the intended public showcase?
- Any real outcomes to cite: traffic, search impressions/rankings, leads/inquiries generated, conversion, client satisfaction?
- Was this built for a paying client / employer, or is it a personal/spec project? Client/company relationship?
- Were the SEO changes (branch `codex/improve-seo-for-codebase`) AI-generated, and how much did the owner author vs. review?
- Are the company claims in copy (30 years experience, 10,000-hour warranty, "since 2017") client-provided marketing text (they appear to be) — confirm none should be presented as engineering metrics.
- Is there a design source (Figma) or was UI built directly in code?

## 19. Evidence & confidence notes
- **Strongest, highest-confidence claims** (directly from files): tech stack and versions (`package.json`), routes/features (`src/app/**`), SEO setup (`layout.tsx`, `SEO.md`, `sitemap.ts`, `robots.ts`, `manifest.ts`), constants/integrations (`src/constant/index.ts`), no-backend/no-auth/no-tests (absence across repo), git timeline/contributors (`git log`, `git shortlog`), remote URL (`git remote -v`).
- **Medium confidence (inferred):** developer role, deployment target (Vercel suggested by README, not configured), rationale behind decisions, "IndoChain" and stray files being placeholders/leftovers.
- **Low confidence / unverified:** any real-world usage/outcomes — none evidenced in repo.
- **Overall confidence in this document: High** for what the code contains and does; **Low** for real-world deployment status and business outcomes (explicitly marked). No numbers were invented; company marketing claims are flagged as content, not metrics.
