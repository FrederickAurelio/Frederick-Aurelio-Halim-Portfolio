---
rag:
  id: promis-conveyor-chain
  type: project
  title: Promis Conveyor Chain
  aliases: [Promis, promis-web, conveyor chain, palm oil website]
---

# Promis Conveyor Chain

> Portfolio knowledge source. Facts about Frederick Aurelio Halim's Promis Conveyor Chain project only.

## 1. At a glance
<!-- rag-section: at-a-glance -->
Promis Conveyor Chain is a marketing website for an Indonesian conveyor-chain company, built with Next.js by Frederick Aurelio Halim.
- **Summary:** Multi-page company site (Home, Products, About, Contact) for industrial conveyor chains, sprockets, and transmission components — targeting palm oil mills in Indonesia. Content in Indonesian.
- **Category:** Static marketing site — no backend or database.
- **Status:** Live on Vercel.
- **Repo:** https://github.com/FrederickAurelio/promis-web
- **Live demo:** https://promis-web.vercel.app/

## 2. Problem & purpose
<!-- rag-section: 2-problem-purpose -->
- **Who it's for:** Palm oil mill operators and industrial buyers in Indonesia.
- **What it does:** Online product catalog, company info, gallery, FAQ, and contact — lead capture via WhatsApp and downloadable brochure. Not e-commerce (no cart/checkout).

## 3. Features
<!-- rag-section: 3-features -->
- Four pages: Home, Products (spec tables + image carousels), About (timeline, QC gallery), Contact (hours, Google Maps, FAQ accordion).
- Sticky responsive navbar with mobile menu, scroll styling, active-route highlighting, brochure download.
- Framer Motion scroll-reveal, page transitions, Embla auto-playing carousels.
- SEO: per-page metadata, Open Graph, JSON-LD (Organization, LocalBusiness, FAQPage), sitemap, robots, PWA manifest.
- Floating WhatsApp button; all quote CTAs deep-link to `wa.me`.

## 4. Tech stack
<!-- rag-section: 4-tech-stack -->
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4.
- **UI:** shadcn/Radix primitives, Framer Motion, Embla Carousel, Lucide + Tabler icons.
- **Content:** Hardcoded in components; company constants in `src/constant/index.ts`.
- **External:** Google Maps embed, WhatsApp, Google Fonts.
- **Deployment:** Vercel (inferred from live URL).

## 5. Architecture
<!-- rag-section: 5-architecture -->
Standard Next.js App Router — server components by default, client components for interactivity.

- All product, testimonial, FAQ, and timeline data hardcoded in page files.
- Centralized constants module for contact info reused across pages and structured data.
- No API routes, server actions, or database — purely presentational with external deep links.

## 6. Notable technical decisions & trade-offs
<!-- rag-section: 6-notable-technical-decisions-trade-offs -->
- **Centralized constants file** — one source of truth for contact info, reused in JSON-LD.
- **SEO-first metadata** — Indonesian locale, structured data for local-business discoverability.
- **WhatsApp-as-conversion** — no contact form or backend; zero server maintenance.
- **Framer Motion + Embla** — scroll-reveal and auto carousels for richer UX vs. added client JS.
- **Real viewport height provider** — `--vh` CSS variable for mobile browser 100vh issues.

## 7. Interesting / hard problems solved
<!-- rag-section: 7-interesting-hard-problems-solved -->
- **Scroll-reveal with stable random stagger delays** — randomized but consistent across re-renders.
- **Auto-playing resumable carousels** with optional badge/counter for galleries and testimonials.
- **Responsive navbar** — scroll-triggered styling, touch-outside close, active-route detection.
- **Comprehensive SEO setup** — metadata routes, structured data, documented in `SEO.md`.
