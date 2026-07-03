# Portfolio Writing Rules

Rules for writing portfolio content that sounds **human, specific, and credible** — not generic or AI-generated.

Use this when writing or reviewing: hero copy, About, skills, projects, case studies, and work experience.

**For AI agents:** Cursor loads concise rules from `.cursor/rules/portfolio-writing.mdc`. Start with [AGENTS.md](./AGENTS.md).  
**Tasks:** [PORTFOLIO_PLAN.md](./PORTFOLIO_PLAN.md) — work one task ID at a time.

---

## Core Principle

> **Show what you built and why. Don't describe yourself with adjectives.**

Recruiters spend ~7 seconds on a project card. They remember **specific problems solved**, not "passionate full-stack developer."

Write like you're explaining your work to another developer over coffee — clear, direct, a little personality, zero corporate fluff.

---

## Voice & Tone Rules

### Do

| Rule | Example |
|------|---------|
| **First person** for your own work | "I built the auth flow with GitHub OAuth" |
| **Short sentences mixed with longer ones** | Vary rhythm. Not every sentence the same length. |
| **Contractions** (EN) | "I'm", "I've", "didn't" — sounds natural |
| **Concrete nouns** | "Next.js App Router", "Supabase RLS", "React Konva" |
| **Active voice** | "I reduced load time" not "Load time was reduced" |
| **Specific numbers** (only if true) | "cut latency from 14s to 400ms", "3-month build" |
| **Honest limits** | "No production metrics yet — tested with 100 concurrent requests" |
| **Your actual words** | Read aloud. If you wouldn't say it, rewrite it. |

### Don't

| Rule | Why |
|------|-----|
| Third-person bio ("Frederick is a...") | Feels like a resume, not a person |
| Buzzwords without proof | "Innovative", "robust", "seamless" mean nothing alone |
| Skill percentage bars | "JavaScript 87%" — nobody believes it |
| Listing every library you touched | Shows breadth, hides judgment |
| Tutorial voice | "I followed a course and learned X" — frame what **you** decided |
| Fake metrics | Invented numbers destroy trust instantly |

---

## Banned Words & Phrases

**Zero tolerance** — delete or replace on sight:

### Verbs (replace with plain action)
`delve` · `leverage` · `utilize` · `harness` · `foster` · `underscore` · `embark` · `unveil` · `unlock` · `elevate` · `revolutionize` · `empower` · `navigate` · `showcase` · `facilitate` · `optimize` (unless you mean a real perf fix)

→ Use: **build, use, fix, ship, chose, wrote, deployed, tested**

### Adjectives (replace with specifics)
`seamless` · `robust` · `cutting-edge` · `innovative` · `comprehensive` · `dynamic` · `multifaceted` · `pivotal` · `crucial` · `transformative` · `revolutionary` · `game-changer`

→ Use: **name the actual tech, scale, or outcome**

### Transitions & openers
`Furthermore` · `Moreover` · `Additionally` · `In conclusion` · `It is important to note` · `In today's digital age` · `As we navigate` · `Let's dive in` · `Here's why` · `At its core`

### Phrases & structures
- **"It's not just X, it's Y"** — say what you mean directly
- **"Passionate about coding"** — show projects instead
- **"Synergistic" / "paradigm shift"** — corporate speak
- **"A testament to..."** · **"tapestry"** · **"realm"** · **"landscape"** · **"journey"** (as metaphor)
- **Perfectly balanced "on one hand... on the other"** — take a stance
- **Symmetric 3-item lists** where every bullet is the same length — make lists uneven on purpose

### Punctuation tell
- **Overuse of em dashes (—)** — AI loves them. Use commas or periods. One em dash per paragraph max.

---

## Section-by-Section Rules

### 1. Hero (headline + subtitle)

**Goal:** Stranger knows what you do in under 6 seconds.

**Formula (pick one):**
```
I build [what] for [who] using [stack].
```
```
[Role] — [one specific thing you're good at]
```

**Rules:**
- Max ~120 characters for the hook line
- No job title alone ("Frontend Developer" is not enough)
- No "1 year of learning experience" — state real level
- Mention stack only if it's your actual focus
- Keep years OUT of the hook — put them in About. Leading with "1 year"/"3 years" reads defensive.

**Plain beats clever.** The strongest real hooks are boring on purpose: `I build [what] with [stack].`
Don't force specificity or metaphors into the hook. Trying too hard reads worse than saying it straight.

| Trying too hard (avoid) | Say it straight |
|-------------------------|-----------------|
| I take web apps from empty repo to live — front to back | I build and deploy full-stack web apps with React, Next.js, and Express |
| I turn messy UI problems into apps people actually use | I build accessible web apps with Next.js and TypeScript |

**How real portfolios actually write it** (name → role → one plain value line):
- Brittany Chiang — "I build accessible, pixel-perfect digital experiences for the web."
- Shadmaan Ansari — "I build modern, SEO-friendly websites… using React, Next.js, Tailwind…"
- Saif Rahman — "Front-End Engineer · Building High-Performance Web Applications"

| Bad | Good |
|-----|------|
| Passionate frontend developer who loves creating seamless user experiences | I build fast, accessible web apps with Next.js and TypeScript |
| Equipped with 1 years of learning experience in Nextjs/React | I build and deploy full-stack web apps with React, Next.js, and Express |
| Innovative problem-solver and team player | Frontend developer — I ship full-stack apps from auth to deployment |

---

### 2. About section

**Goal:** "Would I enjoy working with this person?"

**Length:** 2–4 short paragraphs (80–150 words total)

**Structure:**
1. **Hook** — what you build or care about (not your job title)
2. **Proof** — 1–2 specifics (projects, stack, domain)
3. **Human bit** — one real detail (optional: how you got into dev, what you're exploring now)
4. **Forward** — what you want next (role type, kind of work)

**Rules:**
- Write in first person
- One personal detail max — don't overshare hobbies
- No wall of soft skills ("detail-oriented, team player, fast learner")

| Bad | Good |
|-----|------|
| I am a passionate developer with a strong foundation in modern web technologies. I love solving challenging problems and learning new things. | I got into frontend after spending too long fighting bad hotel booking UIs. These days I build React apps end-to-end — auth, APIs, the boring stuff that has to work. Looking for a team where I can own features, not just tickets. |

---

### 3. Skills / Tech Stack

**Goal:** Recruiter finds "React" or "Next.js" in 2 seconds.

**Rules:**
- **Group by category** — Languages / Frameworks / Tools / Backend / Database
- **No percentage bars** — ever
- **No 40-icon wall** — list what you use on real projects
- Optional honest levels: `Primary` · `Comfortable` · `Learning`
- Tie skills to projects when possible: "Next.js (Memories, FXTrade)"

| Bad | Good |
|-----|------|
| JavaScript ████████░░ 85% | **Frameworks:** Next.js, React, Tailwind |
| Expert in 30 technologies | **Backend:** Express, Supabase — used in production side projects |
| Icons with no context | Same icons + "Used in: FXTrade, Memories" |

---

### 4. Project cards (homepage)

**Goal:** Problem + stack + links in one scan.

**Each card needs:**
- **Title** — project name + primary stack (short)
- **One-liner** — what problem it solves (not feature list)
- **Screenshot** — real UI, not stock photo
- **Links** — live demo + GitHub (both must work)

**Length:** 1–2 sentences for description (max ~40 words)

**Formula:**
```
[App name] — [who it's for]. [What it does in plain language]. Built with [stack].
```

| Bad | Good |
|-----|------|
| A creative social media web app that lets users design with a canvas editor inspired by Canva and share their creations through personal profiles, making design more social and interactive. | Memories — a social design app. Users edit on a canvas (React Konva) and share work on their profile. Next.js + Express, full auth with email verification. |
| FXTrade, where users can learn to trade foreign exchange currency in real-time. | FXTrade — practice forex with ¥100k fake money. Real-time prices, GitHub OAuth, balance checks on the server so users can't cheat. |

---

### 5. Case studies / Project details

**Goal:** Show how you **think**, not just what you learned in a tutorial.

**Format:** Problem → Process → Result (300–400 words per project)

#### Problem (why did this exist?)
- Who had the pain?
- What was broken or missing?
- Why existing solutions weren't enough?

#### Process (how did you decide?)
- **Alternatives considered** — "I could have used X, but..."
- **Trade-offs** — what you gained vs gave up
- **One failure or pivot** — honesty beats polish
- **Your role** — "I built..." vs "The team..."

#### Result (what happened?)
- Metric if you have one
- If no metric: qualitative outcome + what you'd measure next
- What you'd do differently

**Rules:**
- Lead with **impact**, then explain how
- Bullets OK, but **uneven length** — not 5 identical bullets
- Replace "I learned how to implement authentication" → "I set up GitHub OAuth + email verification; private designs stay hidden via middleware checks"
- Don't document every step — zoom in on **2–3 decisions that mattered**

| Bad (tutorial voice) | Good (engineer voice) |
|----------------------|------------------------|
| Learned how to implement authentication and OAuth with email verification | Chose Supabase Auth over rolling my own — faster to ship, but I had to configure RLS so balance updates only run server-side |
| Built a functional canvas design editor, supporting drag-and-drop, layering, and basic editing tools | Canvas editor with Konva: drag-drop and layers work, but undo/redo is still on my list — state got messy after ~20 objects |
| Mastered responsive design across multiple platforms using Tailwind CSS | Mobile layout broke on the trading chart — fixed with a separate simplified view under 768px instead of shrinking the desktop UI |

---

### 6. Work experience

**Goal:** 2–4 relevant roles. Impact, not job description.

**Each entry:**
```
Role · Company
Date range
• One impact bullet (metric or concrete outcome)
• Optional second bullet if genuinely different
```

**Rules:**
- Max **2–3 bullets** per role
- Start bullets with **verb + outcome**, not "Responsible for..."
- Skip roles that don't match what you want next (or one line only)
- No images of office work — text timeline is standard
- Company logo optional

| Bad | Good |
|-----|------|
| Responsible for developing and maintaining the company website using React and Node.js | Rebuilt the company landing page in Next.js — load time went from ~4s to under 1.5s on mobile |
| Worked on backend services and database API | Fixed a race condition in the booking API that caused double reservations during peak hours |
| Utilized modern frameworks to deliver robust solutions | *(delete — says nothing)* |

---

## Structural Rules (Anti-AI Patterns)

### Sentence rhythm
- Mix: short punchy line. Then a longer one that explains the why.
- Fragments OK. For emphasis.
- Don't write 5 sentences in a row with the same structure.

### Lists
- Real lists are **lopsided** — one item long, one short
- Avoid intro + exactly 3 perfectly parallel bullets (classic AI shape)
- Max 5 bullets per block unless it's a technical spec

### Openings
- **Don't start with:** "In today's...", "In recent years...", "When it comes to..."
- **Do start with:** the problem, a specific fact, or what you built

### Claims
- Every big claim needs a **specific** behind it
- "Good design converts better" → weak
- "Homepage rebuild got more contact form submits in the first month" → strong (if true)

### Negation parallelism
- ❌ "It's not about the code, it's about the people"
- ✅ "I care about code review — most of my best catches were in someone else's PR"

---

## The 4-Pass Human Edit

Run every piece of content through this before publishing:

### Pass 1 — Kill list
Search for banned words (see above). Replace or delete every hit.

### Pass 2 — Specificity
For each sentence ask: *"Could this appear on someone else's portfolio unchanged?"*  
If yes → add a name, number, tool, or decision only you made.

### Pass 3 — Read aloud
Read it out loud. Stumble = rewrite. Sounds like a LinkedIn post = rewrite.

### Pass 4 — Fact check
- Every link works
- Every metric is real
- Every "I built" is actually yours (not the tutorial's default)

---

## How to Use AI Without Sounding Like AI

**AI is OK for:**
- Outlining structure
- Spotting generic phrases in your draft
- Shorter/clearer rewrites **after** you wrote the facts
- Bilingual translation polish (then re-read in 中文)

**AI is NOT OK for:**
- Writing the first draft of case studies (invents challenges you never had)
- Inventing metrics or job responsibilities
- Choosing your "voice" for you

**Workflow:**
1. You write rough notes in your own words (even messy)
2. AI helps structure or trim — **you** verify every fact
3. Run the 4-pass human edit above
4. Final read in both languages if bilingual

---

## Quick Checklist (per section)

Before marking any content done:

- [ ] No banned words/phrases
- [ ] Read aloud — sounds like me
- [ ] At least one specific detail only I would know
- [ ] No fake metrics
- [ ] First person where appropriate
- [ ] Problem → decision → outcome (for projects)
- [ ] Under word limit for that section
- [ ] EN and 中文 say the same facts (not machine-translated fluff)

---

## Good vs Bad — Full Mini Example

### Project: FXTrade

**❌ Too AI / generic**
> FXTrade is an innovative web application that leverages cutting-edge technologies to provide users with a seamless foreign exchange trading experience. Furthermore, it empowers users to learn trading in a robust, real-time environment. It is important to note that the application works seamlessly across all devices.

**✅ Human / specific**
> FXTrade is a fake-money forex simulator I built to learn real-time data handling. You sign in with GitHub, get ¥100,000 play money, and trade live rates. The tricky part was balance validation — I put all writes on the server with Supabase RLS so nobody could POST their way to a million yen. Works on mobile; chart UI is simplified under 768px.

---

## When Writing Chinese (中文)

- Same rules: concrete, first person (我), no empty 官方腔
- Avoid over-formal connectors: 此外、综上所述、值得注意的是
- Don't translate English buzzwords: "无缝体验" "赋能" "助力"
- Match EN facts — same projects, same numbers, same honesty

---

## Reference Links

Research sources used for these rules:
- [ShowProof — Developer Portfolio 2026 Checklist](https://showproof.io/guides/what-to-include-in-developer-portfolio/)
- [Dev Weekends — Case Study Guide](https://resources.devweekends.com/case-studies/guide)
- [DEV — How Developers Can Show Real Work](https://dev.to/kislay/how-developers-can-show-real-work-1ajo)
- [DEV — Portfolio Bio That Makes People Want to Hire You](https://dev.to/imtaslim/how-to-write-a-portfolio-bio-that-makes-people-want-to-hire-you-2e9l)

---

*When you're ready to write content, reference task IDs in [PORTFOLIO_PLAN.md](./PORTFOLIO_PLAN.md) and apply these rules to each section.*
