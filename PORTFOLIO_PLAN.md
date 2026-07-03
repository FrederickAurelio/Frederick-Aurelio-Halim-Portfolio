# Portfolio Update Plan

Working document for updating Frederick's portfolio (2024 → 2026).  
Use this file to pick tasks one by one — check items off as we complete them.

**Agent guide:** [AGENTS.md](./AGENTS.md) · **Cursor rules:** `.cursor/rules/`  
**Writing style:** Follow [PORTFOLIO_WRITING_RULES.md](./PORTFOLIO_WRITING_RULES.md) (full examples) + `.cursor/rules/portfolio-writing.mdc`

**Live sites:**
- Intl: https://frederick-aurelio-halim.vercel.app/
- China: http://120.26.45.50/

---

## Current State (Baseline)

### Tech stack
- Next.js 16, React 19, TypeScript, Tailwind CSS 4, GSAP
- Single-page layout, bilingual (EN / 中文)
- Deployed on Vercel (intl) + China VPS

### Page sections (in order)
1. **Hero** — name, title, subtitle, scroll CTA
2. **Tech Stack** — 12 technology icons
3. **Projects** — 5 project cards
4. **Project Details** — bullet lists of what was learned per project
5. **Footer / Contact** — avatar, email, GitHub, WeChat QR

### Current projects (5)
| # | Project | Stack | Notes |
|---|---------|-------|-------|
| 1 | Memories | Next.js / Express | Social canvas editor |
| 2 | FXTrade | Next.js | Forex trading simulator |
| 3 | Bookling | React | Book-sharing app — live link uses IP `120.26.45.50:8080` |
| 4 | The Wild Oasis | React | Hotel admin — known course/tutorial project |
| 5 | Promis Chain | HTML/CSS/JS | Company profile site |

### What already works well
- [x] Clean UI with GSAP animations
- [x] Bilingual EN / 中文
- [x] Project screenshots + live demo links
- [x] VPN note for China users
- [x] GitHub links per project
- [x] Dual deployment (Vercel + China)

---

## Research Summary (2025–2026 Best Practices)

### Work experience
- **Yes**, most portfolios include it — but selectively (2–4 relevant roles, not full CV)
- Format: timeline with role, company, dates, 1–3 **impact** bullets
- Company logos: sometimes; screenshots of work: rare (more common in project case studies)
- Focus on outcomes/metrics, not task lists or library names

### Project count
- **Sweet spot: 3–5** featured projects on the homepage
- Fewer than 3 feels thin; more than 5 → recruiters skim
- Quality and depth beat quantity

### Project content structure (target)
Each project should tell a story:
1. **Problem** — what needed solving
2. **Your role** — what you specifically built
3. **Solution** — technical approach
4. **Results** — metrics or outcomes where possible
5. **Links** — live demo + GitHub

Current Details section is close but framed as *"things I learned"* instead of *"problem → solution → result"*.

### Recommended full section order (target)
```
1. Hero
2. About          ← NEW
3. Tech Stack
4. Experience     ← NEW
5. Projects       (3–4 curated)
6. Case Studies   (reframed Details)
7. Contact
```

---

## Task List

### 🔴 High priority — content updates

- [x] **H1. Update hero copy**
  - ~~Current: *"Equipped with 1 years of learning experience in Nextjs/React..."*~~
  - Done (user-approved): EN: "I build and deploy full-stack web applications with React, Next.js, and Express." 中文: "我用 React, Next.js, and Express 构建并部署全栈 Web 应用。" No years in hook (moved to About M1). Highlight span updated in `Hero.tsx`.
  - File: `src/utils/data.ts` → `hero`

- [x] **H2. Curate projects to 3–4 best**
  - Done: kept 4 — QuizConnect (new), Memories, FXTrade, Promis Conveyor Chain (new Next.js version)
  - Removed: Bookling and Wild Oasis
  - Rewrote all copy (EN + 中文) from project docs — plain, specific, no buzzwords; titles show real stack
  - QuizConnect: `/quizconnect.png`, live `http://120.26.45.50:3221/`
  - Promis: live link updated to `https://promis-web.vercel.app/` (was promischain.com; also now Next.js not HTML/CSS/JS)
  - File: `src/utils/data.ts` → `projects`
  - ⚠️ "Learn more" anchors (#quizconnect, #promis) + Details/case studies still point at old set — deferred to H3

- [x] **H3. Reframe project details (case study format)**
  - Done: rewrote all case studies (EN + 中文) from the `projects/*.md` docs in engineer voice — decisions and trade-offs, not "I learned X"
  - Curated to the same 4 as H2: QuizConnect, Memories, FXTrade, Promis (removed Bookling + Wild Oasis)
  - Shared heading changed from "things I learned" → "What I built, and the decisions behind it"
  - QuizConnect: custom gamepad+wordmark logo (dark card, added `dark` flag to `DetailItem` + dark text handling in `Details.tsx`), repo `.../QuizConnect`
  - Promis repo link fixed to `.../promis-web`
  - Added "More projects on my GitHub" link (→ github.com/FrederickAurelio) at the bottom of the section
  - Files: `src/utils/data.ts` → `details`, `src/components/Logo.tsx`, `src/components/sections/Details.tsx`

- [ ] **H4. Add recent / updated projects**
  - Waiting on user docs with new project content
  - Add screenshots to `public/`
  - Update `projects` and `details` in `data.ts`

- [ ] **H5. Fix broken / fragile links**
  - [ ] Bookling: `http://120.26.45.50:8080/` — replace or remove if dead
  - [ ] Verify all live demo links still work (FXTrade, Wild Oasis, Promis Chain, Memories)

---

### 🟡 Medium priority — new sections & content

- [x] **M1. Add About section**
  - Done: new `About.tsx` (SpotlightCard, avatar, status pill, focus tags, GSAP entrance, slate-50→100 gradient), added after Hero in `page.tsx`, navbar entry "About/关于", `about` data in `data.ts`.
  - Content (EN + 中文): frontend→full-stack (React/Next/Express), self-taught + B.Sc. Honours ZUST 2026, enjoys logic/problem-solving, exploring AI agents, gaming, wants a product team. No location.

- [x] **M2. Add Work Experience section**
  - Done: single role — Frontend Developer @ Zhiliao Siyuan (Mufy AI), Hangzhou, on-site. Text-only card timeline, 3 impact bullets + stack tags, GSAP stagger, EN/中文.
  - Component: `src/components/sections/Experience.tsx` (SpotlightCard style, matches About)
  - Data: `experience` export in `src/utils/data.ts`
  - Wired into `page.tsx` (Tech Stack → Experience → Projects) + navbar entry (both langs)
  - Dates: May 2025 — June 2026 (role ended; bullets in past tense)

- [ ] **M3. Add resume download**
  - PDF in `public/resume.pdf`
  - Button in Hero and/or navbar

- [ ] **M4. Add LinkedIn link**
  - Footer + optionally navbar
  - File: `src/components/sections/Footer.tsx`

- [x] **M5. Update copyright year**
  - `Math.max(2026, new Date().getFullYear())` in `Footer.tsx`
  - Update to 2026
  - File: `src/components/sections/Footer.tsx`

- [ ] **M6. Update page metadata**
  - Richer description, Open Graph tags
  - File: `src/app/layout.tsx`

---

### 🟢 Lower priority — polish & fixes

- [ ] **L1. Fix React Query ↔ React Router icon swap**
  - `React Query` uses `/react-router.svg`, `React Router` uses `/query.svg` — swapped
  - File: `src/utils/data.ts` → `stacks`

- [ ] **L2. Group tech stack by category**
  - e.g. Languages / Frameworks / Tools — instead of flat icon wall
  - File: `src/utils/data.ts` + `TechStack.tsx`

- [ ] **L3. Add "Now" section** *(optional)*
  - "Currently working on X, open to Y roles"
  - Small dated snippet, updated periodically

- [ ] **L4. Add project metrics where true**
  - e.g. user counts, performance gains — only if accurate

- [ ] **L5. Contact form instead of raw mailto** *(optional)*
  - Reduces spam exposure; lower priority

---

## Things to Avoid

- Skill percentage bars ("JavaScript 85%")
- 10+ projects on homepage
- Generic phrases ("passionate problem solver")
- Tutorial clones without clear original contribution
- "Coming soon" placeholders
- Copy-pasting full CV into the portfolio

---

## Project Curation Notes

| Project | Recommendation | Reason |
|---------|----------------|--------|
| Memories | **Keep — featured** | Original, full-stack, technically strong |
| FXTrade | **Keep — featured** | Original, auth + real-time, good demo |
| Bookling | **Evaluate** | Fragile IP link; may feel dated |
| Wild Oasis | **Consider removing** | Well-known Jonas course project |
| Promis Chain | **Keep if relevant** | Real company/client work |
| *(new projects)* | **Add when docs ready** | Replace weaker entries |

---

## Content Waiting On

- [ ] User docs for recent / updated projects
- [ ] Work experience details (companies, dates, bullets)
- [ ] About section bio text
- [ ] Updated hero positioning (years, title, focus)
- [ ] Resume PDF
- [ ] LinkedIn URL

---

## How to Use This File

Tell me the task ID to work on, e.g.:
- *"Let's do H1 — update hero copy"*
- *"Fix L1 icon swap"*
- *"Here's my work experience for M2"*

I'll check off items here as we complete them.
