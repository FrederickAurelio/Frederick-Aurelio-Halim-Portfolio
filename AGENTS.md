# AGENTS.md — Portfolio Vibe Coding Guide

Instructions for AI agents (and humans) working on this repo.  
Read this first, then use `.cursor/rules/` for in-session enforcement.

---

## What this project is

Frederick Aurelio Halim's personal portfolio — bilingual (EN / 中文), animated single-page site.  
Currently being refreshed from a **2024 student-style** site to **2026 professional** content.

| | |
|---|---|
| **Intl** | https://frederick-aurelio-halim.vercel.app/ |
| **China** | http://120.26.45.50/ |
| **Stack** | Next.js 16, React 19, TypeScript, Tailwind 4, GSAP |

---

## Repo map

```
src/
  app/
    layout.tsx          # metadata, Providers wrapper
    page.tsx            # section order (Hero → Stack → Projects → Details → Footer)
    globals.css
  components/
    sections/           # Hero, TechStack, Projects, Details, Footer (+ future About, Experience)
    Project.tsx         # project card
    Navbar.tsx, Logo.tsx, SpotlightCard.tsx, ...
  context/
    TextContext.tsx     # language: "en" | "ch" (localStorage)
  utils/
    data.ts             # ★ ALL COPY + project/stack/detail data
  hooks/
    useLocalStorageState.ts
  lib/
    gsap-client.ts
public/                 # screenshots, icons, avatar, fonts
```

**Golden rule:** User-facing text lives in `src/utils/data.ts`. Components render data; they don't own copy.

---

## Cursor rules (`.cursor/rules/`)

| Rule file | When it applies |
|-----------|-----------------|
| `portfolio-context.mdc` | Always — project context, workflow, task IDs |
| `portfolio-writing.mdc` | Editing `src/utils/data.ts` — human copy, anti-AI |
| `portfolio-code.mdc` | Editing `src/**/*.{ts,tsx}` — patterns and conventions |

Extended writing reference (examples, research): **`PORTFOLIO_WRITING_RULES.md`**  
Task checklist: **`PORTFOLIO_PLAN.md`**

---

## How we work (vibe coding workflow)

### 1. User picks a task
Tasks use IDs in `PORTFOLIO_PLAN.md`:

| Prefix | Priority |
|--------|----------|
| **H** | High — content, links, projects |
| **M** | Medium — new sections (About, Experience, resume) |
| **L** | Low — polish, bug fixes |

Example: *"Let's do H1"* or *"Fix L1 icon swap"*

### 2. Agent gathers facts before writing
- **Never invent** job titles, dates, metrics, or project outcomes
- User provides rough notes → agent structures, applies writing rules, implements
- If facts are missing, ask — don't fill with generic placeholder copy

### 3. Agent implements minimally
- One task ID per pass when possible
- Match existing code style and file layout
- Update `PORTFOLIO_PLAN.md` checkboxes when task is done
- Don't commit or push unless user explicitly asks

### 4. Copy passes the human test
Before marking content done, verify:
- [ ] No banned AI words (see `portfolio-writing.mdc`)
- [ ] Sounds like a developer talking, not a resume template
- [ ] EN and 中文 share the same facts
- [ ] Links work; no fake stats

---

## Writing content (quick reference)

**Show what you built and why — not adjectives.**

| Section | Format |
|---------|--------|
| Hero | `I build [what] with [stack].` — plain beats clever, ~120 chars, no years in the hook |
| About | 2–4 short paragraphs, first person, one human detail |
| Project card | 1–2 sentences: who it's for, what it does, stack |
| Case study | Problem → decision/trade-off → result; uneven bullets |
| Experience | 2–4 roles, 1–3 impact bullets each |
| Skills | Grouped categories, no % bars |

**Tutorial projects:** frame what *you* decided, not "I learned X from a course."

**Banned words:** leverage, seamless, robust, cutting-edge, passionate, Furthermore, "It is important to note" — full list in `PORTFOLIO_WRITING_RULES.md`.

---

## Code guidelines

### Adding a new section (e.g. About, Experience)
1. Add types + data to `src/utils/data.ts`
2. Create `src/components/sections/YourSection.tsx`
3. Import in `src/app/page.tsx` (sensible order)
4. Add navbar entry in `hero[language].navbar` with matching `id`

### Bilingual content
```ts
// Pattern used everywhere
title: {
  en: "English text",
  ch: "中文文本",
}
```
Access via `content[language]` in client components.

### GSAP
- Import from `@/lib/gsap-client`
- Use `useGSAP` in section components
- Follow existing scroll/entrance patterns in Hero, TechStack, Projects

### Images
- Put assets in `public/`
- Reference as `/filename.png` in data

---

## Known issues (from plan)

- Hero still says "1 year learning experience" — outdated (H1)
- React Query / React Router SVG paths swapped in `stacks` (L1)
- Bookling live URL is IP-based — fragile (H5)
- Wild Oasis is a course project — consider removing (H2)
- Copyright footer says 2024 (M5)
- No About or Experience sections yet (M1, M2)

---

## Commands

```bash
npm install
npm run dev      # local dev
npm run build    # production build
npm run lint     # eslint
```

---

## What agents should NOT do

- Write case studies from scratch without user-provided facts
- Invent metrics ("improved performance by 40%") without confirmation
- Force-push, amend commits, or commit without being asked
- Refactor unrelated files during a content task
- Use AI-slop phrases in any user-facing copy
- Create extra markdown files unless user asks

---

## What agents SHOULD do

- Reference task IDs from `PORTFOLIO_PLAN.md`
- Apply `.cursor/rules/portfolio-writing.mdc` on every `data.ts` edit
- Keep diffs small and focused
- Suggest improvements only when relevant to the current task
- Check off completed items in `PORTFOLIO_PLAN.md`
- Run `npm run build` after structural changes if reasonable

---

## User prompts that work well

- `"Do H1 — here's my updated hero copy: ..."`
- `"Add M2 experience section — [paste jobs]"`
- `"Rewrite FXTrade case study bullets using my notes: ..."`
- `"Implement About section component, I'll paste bio next message"`

---

*Last updated: July 2026 — aligned with PORTFOLIO_PLAN.md refresh.*
