# Memories

## 1. At a glance
- **One-line summary (factual):** A full-stack web app for creating digital scrapbook/collage "canvases" of photos and design elements (shapes, text, drawings, stickers, ropes) on an interactive Konva canvas, with accounts, sharing based on friendship/privacy, and per-photo captions.
- **Category:** Web app (canvas-based design/editor tool) with a separate REST API backend.
- **Solo or team:** Solo. Git shows a single contributor: `Frederick Aurelio Halim <frederick.ah88@gmail.com>` (106 commits attributed by `git shortlog`; `git rev-list --count HEAD` = 104).
- **My role (this developer):** Sole author of the entire codebase — frontend (Next.js), backend (Express API), data models, auth, and the canvas editor (inferred from solo git history).
- **Status:** In-development / demo (not production). Evidence: root `README.md` contains only `Currently Developing...`; `NOTE.txt` lists unfinished TODOs; all base URLs are hardcoded to `localhost` (`frontend/app/_lib/const.ts`); no deployment config exists; `.env` files with real-looking secrets are committed. (inferred: never deployed publicly)
- **First commit date:** 2025-02-24
- **Last commit date:** 2025-05-13
- **Total commits:** 104 (`git rev-list --count HEAD`)
- **Repo URL:** https://github.com/FrederickAurelio/Memories.git (from `git remote -v`)
- **Live/demo URL:** None found. All URLs are `http://localhost:3000` (frontend) and `http://localhost:2000` (backend).

## 2. Problem & purpose
- **Who it's for:** Individuals who want to arrange personal photos ("memories") into decorated digital collages/scrapbook pages and optionally share them with friends. (inferred from the name "Memories", the photo + caption model, and the friend/privacy features)
- **What problem it solves / why it exists:** Provides a browser-based canvas editor to compose photos with shapes, text, freehand drawing, "rope"/string connectors, and stickers into a saved design, plus attach a title, date, and description to each photo. Access to another user's design/images is gated by profile privacy and friendship. The explicit product motivation is not documented in the repo. (unverified)
- **What it does, in plain language:** Users sign up (email + password or GitHub OAuth), verify their email, and log in. On the design page they build a canvas by adding photos, shapes, text, freehand pen strokes, line/spline "ropes", and image stickers, with editing tools for fill color, stroke, opacity, arrangement/layering, undo/redo, zoom, and copy/paste. Designs are saved to MongoDB (images stored on disk on the backend). Each photo in a saved design can be given a title, date, and description via an edit-info page. Designs can be viewed read-only; private profiles restrict viewing to the owner or accepted friends.

## 3. Features
Implemented / working:
- **Email+password registration with email verification** — `backend/src/controller/authController.ts` (`registerUserByEmail`, `verifyEmailCallback`, `sendEmailVerification`); verification link emailed via Nodemailer.
- **Login / logout with server-side sessions** — `loginUserByEmail`, `logoutUser`; session regenerated on login (`req.session.regenerate`).
- **Forgot / reset password** — `forgetPassword`, `resetPassowrd` with a 10-minute reset token expiry (`date-fns` `add`/`isPast`).
- **GitHub OAuth sign-in** — `githubOauthAuthentication` (backend) + `signWithGithub` and `frontend/app/auth/github/callback/route.ts`; creates or links a user by GitHub email.
- **Recent-login accounts UI** — cookie `recent-login` stores up to 4 emails (`frontend/app/_lib/helpers.ts` `setCookieRecentLogin`); shown on login page (`RecentLogin.tsx`, `UserLogin.tsx`).
- **Canvas design editor** (`frontend/app/app/design/[canvaId]/`, `frontend/canva_components/`): add/move/transform Photos, Shapes (rect, circle, triangle, star, hexagon, arrow, heart), Text (editable via double-click textarea overlay), freehand Pen + Eraser (Draw), Line rope, Spline rope, and image Stickers.
- **Element editing toolbars:** fill color, stroke color/width/dash, opacity, arrangement (z-order), text formatting (font family, size, bold/italic/underline/strikethrough, align) — `FillColorToolBar.tsx`, `StrokeColorToolBar.tsx`, `StrokeWidthToolBar.tsx`, `OpacityToolBar.tsx`, `ArrangeToolBar.tsx`, `TextToolBar.tsx`.
- **Undo/redo** (state stack capped at 12, `undoRedoStack` in `const.ts`), **zoom in/out** (10%–200%), **copy/paste/delete via keyboard**, **remove-on-drag-outside-canvas** — `ElementContext.tsx`.
- **Autosave to localStorage** with a "load unsaved design?" dialog — `useLocalStorage.ts`, `LoadStateDialog.tsx`.
- **Client-side image compression** before upload — `browser-image-compression` dependency (commit "compressing image from user").
- **Save/update designs to database** with images stored separately on disk — `saveCanvaDesign` (`frontend/app/_lib/canva/action.ts`), `saveCanva`/`updateCanva` (`camvaController.ts`), Multer disk storage (`canvaRoute.ts`).
- **Per-photo metadata (title/date/description)** editing — `updateCanvaPhotoInfo`, edit-info page (`frontend/app/app/edit-info/[canvaId]/`).
- **Read-only canvas viewer** — `frontend/app/app/canva/[canvaId]/`, `ViewOnly*` components; photos support hover popover for view options (commit "Photo image now can be hover for view option").
- **Privacy/friend-gated access** to designs and images — `getCanva` and `getImage` check `isPublicProfile` and an accepted `Friend` record before serving.
- **Authenticated image proxy route** — `frontend/app/api/uploads/[imageId]/route.ts` forwards the session cookie to the backend so `<img>` tags can load protected images.

Half-built / TODO / disabled (evidence):
- **AI Sticker generation:** UI exists (`AISticker.tsx` produces the string `AISticker-<prompt>`), but no code consumes that prefix and no AI/image service is called anywhere (grep found no consumer). `NOTE.txt` lists "AI GENERATED IMAGE" as a pending idea. → Not functionally implemented. Commit history: "Add AI Element Features and Photo Features on Toolbox (ONLY UI)".
- **Friend requests / notifications:** `FriendRequest.tsx` Accept/Decline buttons have no handlers; `Notifications.tsx` renders one hardcoded request for "Frederick Aurelio Halim"; there is a `Friend` model but no route/controller to create, accept, or reject friend requests (backend only reads `Friend` for access checks). → UI mockup only.
- **App home page** (`frontend/app/app/page.tsx`) returns `<div>HELLO WORLD</div>`; the marketing/landing root (`frontend/app/page.tsx`) is an empty `<div>`.
- **Chats:** sidebar links to `/app/chats` (`const.ts`) but no such page exists.
- `NOTE.txt` also flags an unresolved design question about private-image access ("Private doesn't mean only you.. only friend"), which was later partially addressed in `getImage`/`getCanva`.

## 4. Tech stack
- **Languages:** TypeScript (predominant), with a few `.jsx`/`.js` files (`TextEditor.jsx`, `canva_components/guideline.js`).
- **Frontend (framework + key libs + versions):** Next.js `15.1.7` (App Router, `--turbopack` dev), React `19.0.0`, react-dom `19.0.0`; Konva `9.3.20` + react-konva `19.0.3` + react-konva-utils `1.1.0` + use-image `1.1.1` (canvas engine); Tailwind CSS `3.4.1` (+ `tailwindcss-animate`, `tailwindcss-animated`); Radix UI primitives (`react-dialog`, `react-popover`, `react-hover-card`, `react-select`, `react-slider`, `react-slot`, `react-tooltip`); `class-variance-authority`, `clsx`, `tailwind-merge` (shadcn-style UI in `components/ui/`); `lucide-react` `0.477.0` + `react-icons` `5.5.0`; `react-colorful` (color pickers); `react-day-picker` `8.10.1` + `date-fns` `3.6.0`; `sonner` (toasts); `next-themes`; `geist` font; `browser-image-compression` `2.0.2`; `uuid` `11.1.0`; `crypto-js` `4.2.0` + `@types/crypto-js`; `@uidotdev/usehooks`.
- **Backend (framework + key libs + versions):** Node.js + Express `4.21.2` (TypeScript, ESM, run via `tsx`); Mongoose `8.10.1`; `express-session` `1.18.1` + `connect-mongo` `5.1.0` (session store); `cookie-parser` `1.4.7`; `cors` `2.8.5`; `bcrypt-ts` `6.0.0` (password hashing); `zod` `3.24.2` (validation); `nodemailer` `6.10.0` (email); `multer` `1.4.5-lts.2` (file uploads); `date-fns` `4.1.0`; `dotenv` `16.4.7`; `crypto` (token generation). Dev: `nodemon`, `tsx`, `ts-node`, `typescript` `5.7.3`.
- **Database / storage:** MongoDB (local, `mongodb://localhost:27017/Memories` hardcoded in `backend/src/server.ts`) via Mongoose. Uploaded images stored on the backend filesystem in `backend/uploads/` (Multer disk storage). Sessions persisted in MongoDB via `connect-mongo`.
- **Auth:** Session-based (cookie `connect.sid`, `express-session` + `connect-mongo`), passwords hashed with `bcrypt-ts` (salt rounds 12); GitHub OAuth; email verification and password reset via signed random tokens (`crypto.randomBytes`).
- **Third-party services / APIs:** GitHub OAuth (`github.com/login/oauth`, `api.github.com/user`); SMTP email provider via Nodemailer (env-configured `EMAIL_SERVICE`/`EMAIL_HOST`, port 465; a commit references switching email to "QQ"). No payment, no cloud storage, no AI service integrated.
- **Infra / deployment / CI:** None found. No Dockerfile, no CI config (`.github/workflows` absent), no `vercel.json`, no nginx config. `.gitignore` references `.vercel` but nothing is configured.
- **Notable dev tooling:** ESLint `9` (`eslint-config-next` `15.1.7`), Prettier `3.5.2` with `prettier-plugin-tailwindcss` (`.prettierrc`), shadcn `components.json`, Tailwind config (`tailwind.config.ts`), TS project references / build info. A `.vs/` Visual Studio folder is committed.

## 5. Architecture
- **High-level structure:** Two separate apps in one repo (not a formal monorepo — no root workspace/package.json):
  - `frontend/` — Next.js App Router app. Server Actions (`app/_lib/**/action.ts`) and route handlers call the Express backend, forwarding the `connect.sid` session cookie. Middleware guards routes.
  - `backend/` — Express REST API with Mongoose models, controllers, and routers; serves uploaded images from disk.
- **Key directories:**
  - `frontend/app/` — routes: `login/`, `signup/`, `forgot/`, `auth/reset-password/`, `auth/github/callback/`, `auth/verify-email/callback/`, `error/`; app shell under `app/app/` (`design/[canvaId]`, `canva/[canvaId]`, `edit-info/[canvaId]`, sidebar, notifications); `api/uploads/[imageId]` image proxy.
  - `frontend/app/_lib/` — `action.ts` server actions (auth, canva), `const.ts` (base URLs, toolbox/sidebar config), `helpers.ts`, `types.ts`.
  - `frontend/app/_components/`, `_context/` (ElementContext), `_hooks/` (useLocalStorage).
  - `frontend/canva_components/` — Konva element components (`Canva`, `StageNDraw`, `PhotoImage`, `Shapes`, `Text`, `Draw`, `LineRope`, `SplineRope`, `Sticker`, `Heart`, plus `ViewOnly*` counterparts, `LayerGuideline`, `guideline.js`).
  - `frontend/components/ui/` — shadcn/Radix UI wrappers.
  - `backend/src/` — `controller/` (`authController.ts`, `camvaController.ts` [sic]), `model/` (`User.ts`, `Canva.ts`, `Friend.ts`), `router/` (`authRoute.ts`, `canvaRoute.ts`), `helpers.ts`, `types.ts` (Zod element schemas), `server.ts`, `session.d.ts`.
  - `backend/uploads/` — stored images (7 `.jpeg` files committed despite `/uploads` being in `.gitignore`).
- **Data flow / request lifecycle (inferred):**
  1. Browser → Next.js middleware (`middleware.ts`) checks `connect.sid` and calls backend `/api/auth/auth-status` to gate `/`, `/login`, `/app/*`.
  2. Server Actions / route handlers read the `connect.sid` cookie via `next/headers` and forward it to Express (`credentials: "include"`, manual `Cookie` header).
  3. Express validates the session (`req.session.userId`) and Zod-parses input, then reads/writes MongoDB via Mongoose.
  4. Images: client compresses → base64 → server action converts base64 to `File` named `<userId>-<elementId>.<ext>` → POST `/api/canva/save-image` (Multer disk) → element `src` stored as `uploads/<filename>`; reading goes through Next `/api/uploads/[imageId]` → backend `GET /uploads/:imageId` with friend/privacy check.
- **Diagrams present:** None found.

## 6. Notable technical decisions & trade-offs
- **Session cookie manually forwarded from Next.js to Express.** Because the frontend and backend are separate origins, server actions/route handlers read `connect.sid` and set it as a `Cookie` header on every backend fetch (see `_lib/auth/action.ts`, `_lib/canva/action.ts`, `api/uploads/[imageId]/route.ts`). An extra Next route (`/api/uploads/[imageId]`) exists specifically so `<img>` tags can load protected images with the session attached. Rationale evidenced by commits ("bug where backend cannot get the session token from fetching image using img html tag by opening a route in the nextjs"). (documented in commit messages)
- **Session regeneration on login/OAuth** (`req.session.regenerate`) to mitigate session fixation, with `MongoStore` persistence and a rolling `touch()` middleware. (inferred security intent)
- **Discriminated-union element schema shared in spirit across ends.** `backend/src/types.ts` defines a Zod `discriminatedUnion("type", ...)` for all element kinds (photo, shapes, sticker, draw, rope-line, rope-spline, text) validating every saved canvas; `Canva.elements` is stored as `Schema.Types.Mixed`. Trade-off: flexible/heterogeneous elements at the cost of loose Mongoose typing. (from code)
- **Ownership encoded in the image filename** (`<userId>-<uuid>.<ext>`); `getImage` derives the owner by splitting on `-` and checks privacy/friendship before `sendFile`. Trade-off: simple authorization without a separate image table, but couples access control to filename format. (from code)
- **Client-side state stack for undo/redo capped at 12 states** and localStorage autosave with explicit try/catch for quota-exceeded (toasts "Your canvas is full") — chosen over server round-trips for editor responsiveness. (inferred rationale; commit "Handling error when Browser Localstorage reach it's max capacity")
- **Fixed 1200px canvas width** for cross-device consistency (commit "keep the canva width is 1200px so it will consistent for every user and devices"), applying zoom via CSS transform.

## 7. Interesting / hard problems solved
- **Passing an Express session into Next.js image `<img>` requests.** Solved by adding a Next route handler that injects the session cookie and proxies the backend image endpoint (commits 2025-05-07/08 describe the bug and fix).
- **Building a from-scratch canvas editor** on Konva: transform handles, drag/transform end normalization (resetting scale to 1 and recomputing width/height), delete-when-dragged-outside-stage (`isOutsideStage`), guidelines/snapping (`LayerGuideline`, `guideline.js`), and in-canvas text editing via an HTML `<textarea>` overlay (`TextEditor.jsx`; commit "Add text to be editable by just double click, using textarea html in canvas").
- **Undo/redo with branch truncation:** `updateStack` slices the future stack when a new action follows an undo, capping history at `undoRedoStack + 1` (`ElementContext.tsx`).
- **Image pipeline:** browser compression → base64 → `File` reconstruction (`base64ToFileWithName`) → multipart upload separated from the JSON canvas save, so element `src` values reference server paths.
- **Privacy-aware fetching:** `getCanva`/`getImage` populate the owner's `isPublicProfile` and query the `Friend` collection (`status: "accepted"`, bidirectional `$or`) to authorize access.

## 8. Auth & security
- **Authentication:** Server-side sessions via `express-session` stored in MongoDB (`connect-mongo`); cookie `connect.sid` (`httpOnly`, `sameSite: "none"`, `secure` only in production, `maxAge` ~14 days). Passwords hashed with `bcrypt-ts` (salt rounds 12). Email/password login requires a verified email. GitHub OAuth supported (creates/links accounts). Email verification and password reset use random 32-byte hex tokens; reset tokens expire in 10 minutes; verification resend throttled to ~1 minute (`lastSentEmail`).
- **Authorization:** Canvas edit/update restricted to owner (`canva.userId === session.userId`). Viewing/reading images gated by `isPublicProfile` plus accepted `Friend` relationship. `saveCanva`/`updateCanva`/`getCanva`/`getImage` and the `save-image` route return 401 without a session.
- **Security measures found:** Zod validation on all auth and canvas inputs (plus Mongoose schema validators, e.g. email regex, length limits); session regeneration on login; CORS locked to `http://localhost:3000` with `credentials: true`; `cookie-parser` with a `COOKIE_SECRET`; centralized error handler.
- **Security concerns (observed, for the human):**
  - `backend/.env` and `frontend/.env` are committed to the repo with real-looking values (SMTP creds, GitHub OAuth client id/secret, cookie/session secrets). These should be rotated and removed from history. (`.gitignore` does list `.env*`, but the files are already tracked.)
  - Password-reset email link is hardcoded to `http://localhost:3000` in `forgetPassword`.
  - GitHub OAuth `state` (CSRF token `latestCSRFToken`) is set on the client but not verified in the backend callback (unverified — no comparison found).
  - Multer stores uploads under the original filename with a mimetype-based fallback extension; no explicit file-type/size allow-list found in `canvaRoute.ts`.
- **Required env vars (names only):**
  - Backend (`backend/.env`): `PORT`, `COOKIE_SECRET`, `SESSION_SECRET`, `NODE_ENV`, `EMAIL_HOST`, `EMAIL_SERVICE`, `EMAIL`, `EMAIL_PASS`, `FRONTEND_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRETS`.
  - Frontend (`frontend/.env`): `GITHUB_CLIENT_ID`.

## 9. Data model
Source: Mongoose schemas in `backend/src/model/` and element types in `backend/src/types.ts`.
- **User** (`model/User.ts`): `firstName` (2–15), `lastName?` (≤20), `email` (unique, regex-validated), `password` (required only when `provider === "local"`), `isEmailVerified`, `verificationToken`, `lastSentEmail`, `resetToken`, `resetTokenExpiredDate`, `provider` (`"local" | "github"`), `providerId` (indexed), `avatar`, `githubUsername`, `isPublicProfile` (default `true`), timestamps.
- **Canva** (`model/Canva.ts`): `userId` → `User` (ref, required), `title` (3–60), `elements` (`[Mixed]`, validated by Zod on write), `photoDescriptions` (array of `{ imageId, title, date, description }`, `_id: false`), timestamps.
- **Friend** (`model/Friend.ts`): `requesterId` → `User`, `recipientId` → `User`, `status` (`"pending" | "accepted" | "rejected"`, default `pending`), timestamps; compound indexes on `{requesterId, recipientId, status}` and the reverse.
- **Element types** (`types.ts`, Zod discriminated union): `photo`, `shape-*` (rect/circle/triangle/star/hexagon/arrow/heart), `sticker`, `draw`, `rope-spline`, `rope-line`, `text` — each with geometry (`x`, `y`, `rotation`, `width`, `height`, `opacity`) and type-specific fields (stroke, fill, points, font settings, etc.).
- **Relationships:** User 1—N Canva; User N—N User via Friend (with status); PhotoMetadata embedded in Canva keyed by `imageId`. Sessions stored in a `connect-mongo` collection.

## 10. APIs & integrations
Internal endpoints (Express, base `http://localhost:2000`):
- **Auth (`/api/auth`)** — `POST /register-email`, `POST /login-email`, `POST /logout`, `POST /forget-password`, `POST /resend-verification`, `POST /sign-github`, `PUT /reset-password`, `GET /auth-status`, `GET /verify-email/:verificationToken/:userId`, `GET /users-profile?emails=a;b`.
- **Canva (`/api/canva`)** — `POST /save-image` (auth + Multer `upload.array("images")`), `POST /` (create), `GET /:canvaId`, `PUT /:canvaId` (update), `PUT /edit-info/:canvaId` (photo metadata).
- **Images** — `GET /uploads/:imageId` (session + privacy/friend check, `res.sendFile`).
- **Next.js route handlers** — `GET /api/uploads/[imageId]` (authenticated image proxy), `GET /auth/github/callback`, `GET /auth/verify-email/callback`.

External services:
- **GitHub OAuth** — token exchange at `https://github.com/login/oauth/access_token`, profile at `https://api.github.com/user`.
- **SMTP email** (Nodemailer) — sends verification and password-reset emails (provider via env; port 465, secure).

## 11. Deployment & running it
- **Run locally (from `package.json` scripts):**
  - Prerequisite: a local MongoDB at `mongodb://localhost:27017/Memories` (hardcoded in `server.ts`).
  - Backend: `cd backend && npm install && npm run dev` (`tsx watch src/server.ts`; defaults to port 2000). Build/start: `npm run build` (`tsc`) then `npm start` (`node dist/server.js`).
  - Frontend: `cd frontend && npm install && npm run dev` (`next dev --turbopack`, port 3000). Build/start: `npm run build` / `npm start`. Lint: `npm run lint`.
  - Requires `backend/.env` and `frontend/.env` populated (see §8).
- **Deployment:** No evidence of any deployment. No Dockerfile, CI, or hosting config. Base URLs hardcoded to localhost. `frontend/README.md` is the default create-next-app text mentioning Vercel, but nothing is configured.
- **Env/config requirements:** See required env vars in §8; MongoDB connection string is hardcoded (not env-driven).

## 12. Testing & quality
- **Tests:** None found. No test framework (no Jest/Vitest/Playwright/Cypress), no test files, no `test` script. (grep matches for "test"/"spec" were substrings only.)
- **Linting/formatting:** ESLint 9 with `eslint-config-next`; Prettier with Tailwind plugin (`.prettierrc`). Multiple `eslint-disable-next-line react-hooks/exhaustive-deps` comments present.
- **CI:** None found.
- **Type safety:** TypeScript throughout, but `Canva.elements` uses `Schema.Types.Mixed` and some files are plain JS/JSX.

## 13. Metrics & scale
- **Code size (evidenced):** ~104 git commits over ~2.5 months; single contributor. Backend source ≈ 11 TS files; frontend ≈ 60+ TS/TSX/JS source files (plus `.next` build artifacts committed).
- **Seed/sample data:** 7 committed image files in `backend/uploads/` (all `.jpeg`, all prefixed with the same user id `681b3238...`/`6822c4...`).
- **Config constants:** undo/redo stack = 12; fixed canvas width = 1200px; zoom range 10%–200%; recent-login list capped at 4; reset-token TTL = 10 min; email resend cooldown ≈ 55–60 s.
- **Bundle size / performance benchmarks:** No evidence in repo.
- **Real-world usage (users, traffic, uptime):** No evidence in repo.

## 14. Timeline
Build period: 2025-02-24 → 2025-05-13 (from git). Notable milestones (from commit messages):
- **2025-02-24/25:** Project setup; backend converted to TypeScript.
- **2025-03-03/04:** Frontend signup/login/forgot-password UI; recent-login dialog; file-structure changes.
- **2025-03-05/07:** User model + email registration; error handling; email verification flow.
- **2025-03-09/13:** Login endpoint + session auth, logout, session regeneration; forgot/reset password (both ends); resend verification.
- **2025-03-11/12:** Session token successfully passed between Express and the browser/Next client; recent-login end-to-end.
- **2025-03-15:** GitHub OAuth (frontend + backend).
- **2025-03-26:** Switched email provider (to "QQ").
- **2025-03-31 → 04-10:** Middleware/routing; app sidebar/layout; toolbox system.
- **2025-04-14 → 04-30:** Canvas editor — photos, shapes, guidelines, remove-outside-canvas, pen/eraser, spline/line ropes, text + inline editing, Context refactor, zoom, undo/redo, copy/paste/delete, fill/stroke/opacity/arrange toolbars, text customization.
- **2025-04-18:** Started sticker element; **2025-04-11:** AI element (UI only).
- **2025-05-06/09:** Save/load canvas to/from MongoDB with separated image storage; localStorage load dialog; secure owner-only fetch in edit mode; image route session fix; view-only components; edit-image-info page.
- **2025-05-12/13:** View page; photo hover view options; Friend model + private-profile friend check on fetch (last commit).

## 15. Assets
- **Repo images/logos:** `Logo.png` (repo root) and `frontend/public/Logo.png`; `frontend/public/Frederick.jpeg`, `frontend/public/Genshin.jpg`, `frontend/public/Kirby.jpg` (sample avatars/images); default Next SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`); `frontend/app/favicon.ico`.
- **Uploaded sample media:** 7 `.jpeg` files in `backend/uploads/`.
- **Design files/links:** None found.
- **Screenshots / demo media:** None found (no `docs/` or screenshots).

## 16. Resume bullet candidates (factual, no invented metrics)
- Built a full-stack digital scrapbook web app ("Memories") with Next.js 15 / React 19 and an Express + MongoDB API, implementing an interactive canvas editor on Konva supporting photos, shapes, text, freehand drawing, connector "ropes", and stickers. [add metric?]
- Implemented complete session-based authentication with `express-session` + `connect-mongo`, bcrypt password hashing, email verification and password reset (Nodemailer), and GitHub OAuth, including session regeneration to reduce fixation risk. [add metric?]
- Engineered a cross-origin auth flow that forwards the Express session cookie through Next.js server actions and a custom image-proxy route so protected `<img>` requests stay authenticated. [add metric?]
- Designed a Zod discriminated-union schema validating seven canvas element types end-to-end, with client-side undo/redo history, localStorage autosave with quota handling, and disk-based image uploads via Multer. [add metric?]
- Added privacy controls (public/private profiles and a friend relationship model) that gate design and image access to owners and accepted friends. [add metric?]

## 17. Nice-to-know
- Naming quirk: the canvas controller/route file is misspelled `camvaController.ts` and the model is `Canva` (as in the Canva design tool). The app also has `design/`, `canva/` (view), and `edit-info/` route segments for the same underlying entity.
- `NOTE.txt` is an informal dev scratchpad ("idk", "maybe discuss with chatgpt") capturing the friend feature and AI-image ideas mid-thought.
- A Visual Studio `.vs/` folder and the compiled `frontend/.next/` output are committed to the repo.
- `frontend/public/Genshin.jpg` and `Kirby.jpg` suggest personal/sample imagery used during development.
- The `date-fns` version differs across apps (backend `4.1.0`, frontend `3.6.0`).
- The `/api/auth//resend-verification` call in `frontend/app/_lib/auth/action.ts` contains a double slash (works due to Express routing but is a minor smell).

## 18. Open questions for the human
- Was this ever deployed or used by anyone, or is it purely a personal/portfolio learning project? (No deployment evidence.)
- Any real usage metrics (users, saved designs, uptime)? Currently none in repo.
- Is this genuinely solo, or did anyone else contribute (design, testing)? Git shows one author only.
- What was the motivation/target audience — a class project, a product idea, or skill-building?
- Was AI sticker generation ever intended to ship, and with which provider? (Only UI exists.)
- Are the committed `.env` secrets real and in need of rotation? (They should be treated as compromised if so.)
- Is the friend-request/notification UI meant to be completed (no backend wiring exists)?
- Which SMTP/email provider is used in practice (commit mentions "QQ")?
- Intended production URLs / hosting plan (everything is hardcoded to localhost)?
- Desired license (backend says ISC in `package.json`; no root LICENSE file).

## 19. Evidence & confidence notes
- **Strongest claims** come directly from source: Mongoose models (`backend/src/model/*`), controllers (`authController.ts`, `camvaController.ts`), routers, Zod schemas (`types.ts`), Next middleware/actions, and `package.json` dependency versions. Git metadata (dates, commit count, single author, remote URL) came from `git log`/`shortlog`/`remote`.
- **Feature status** (AI stickers, friend requests, notifications, chats, home page) was verified by cross-referencing UI components with the absence of consumers/handlers/routes via grep, plus `NOTE.txt` and commit messages.
- **Inferences** (purpose, audience, "never deployed") are marked; they rest on naming, hardcoded localhost URLs, missing infra, and the `Currently Developing...` README.
- **Overall confidence:** High for tech stack, data model, endpoints, auth mechanics, and timeline. Medium for feature completeness nuances (edit/view UIs are partly stubbed — e.g. `CanvaPage` renders a placeholder `"a"`). Low/unknown for real-world outcomes, usage, and intent — no evidence in repo.
