# Pathfinder

Pathfinder is a life-and-career dashboard that turns goals into structured paths and day-to-day actions. An agentic AI pipeline breaks each goal into **seven time horizons** (today through 3+ years), personalizes the plan to your background, and can **autonomously reschedule** your milestones when capacity changes.

## Key features

### Agentic AI

- **7-horizon path generation** — DeepSeek builds exactly **seven milestones** per goal (today, this week, this month, ~90 days, 6–12 months, 1–3 years, 3+ years). Each milestone contains 3–5 short, actionable substeps (≤90 characters). Missing horizons are auto-padded; duplicates are merged.
- **Personalization** — The AI uses your name, bio, and optional resume to write a `personalizedPathIntro` per path and a `personalizedNote` per milestone—visible during onboarding review and stored in milestone descriptions.
- **Agentic reschedule** — A tool-calling flow (`/api/agent/reschedule`) accepts a capacity slider (0–100%), loads your full path data, and calls DeepSeek with a `reallocate_timeline` function tool. The agent decides which milestones to **pause** and returns a strict priority order for all tasks. Academic/career/visa milestones are protected from pause.
- **Navigator chat** — A persistent AI coach on the dashboard (`/api/chat`) with prompt-injection guards and context-aware system prompt.
- **Resume parse** — Upload a PDF on onboarding; text is extracted via `unpdf` and optionally structured by DeepSeek to sharpen path recommendations.
- **Weekly report** — An authenticated endpoint generates a short motivational progress report with stats.

### Dashboard & visualization

- **Focus today** — Smart-ranked list of top next actions (not your entire path). Deprioritizes far-horizon items, milestone-sized duplicates, and paused milestones. User-facing hints ("Due today", "Active phase", "Unblocks next step").
- **Proactive strip** — Nudge banner with one-click **`.ics` export** to add a focus block to your calendar.
- **My Path (React Flow)** — Branching milestone graphs by category; **All** tab uses a radial layout with a central hub; individual categories use a linear tree. Paused milestones render in greyscale.
- **Daily goals** — Quick ring tracker alongside the focus list.
- **Decisions** — Weighted criteria scoring to compare choices (client-only; DB persistence planned).
- **Peers** — Discover others with overlapping goals and visa context.

### Infrastructure

- **Auth** — Supabase: Google/LinkedIn OAuth, email sign-up, forgot password with magic link.
- **Data hydration** — `DataProvider` loads profiles, goals, milestones, tasks, daily goals, and decisions into Zustand on login.
- **Theme** — Light/dark toggle; `next/script` + `beforeInteractive` for flash-free init.
- **Build safety** — AI client (`getDeepSeekClient()`) is lazy (no top-level `new OpenAI()`); Supabase env helper returns placeholders at build time so `next build` works without credentials.

## Tech stack

| Layer | Choice |
|--------|--------|
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui |
| State | Zustand |
| Graphs | `@xyflow/react` |
| Backend / auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| AI | DeepSeek via OpenAI-compatible SDK (`openai`) |

## API routes

| Route | Purpose |
|-------|---------|
| `POST /api/generate-paths` | Build 7-horizon paths from goals (+ optional resume) |
| `POST /api/agent/reschedule` | Agentic reschedule with tool calling (capacity-aware) |
| `POST /api/chat` | Navigator coach chat |
| `POST /api/parse-resume` | PDF → text + optional AI structured parse |
| `POST /api/weekly-report` | AI weekly progress report (authenticated) |
| `POST /api/calendar/sync` | Google Calendar free-slot sync (not AI) |

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` (see `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

Find the URL and anon key in Supabase **Settings → API**. Without valid values, auth and data calls will fail.

3. Apply the database schema (`supabase_schema.sql`) in the Supabase SQL editor.

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Repo layout

```
src/
├── app/
│   ├── (dashboard)/     # sidebar-wrapped pages: home, my-path, decisions, peers, settings
│   ├── api/             # generate-paths, chat, parse-resume, weekly-report, agent/reschedule, calendar/sync
│   ├── onboarding/      # multi-step goal + resume onboarding
│   ├── login/           # auth UI
│   └── auth/            # callback, update-password
├── components/features/ # dashboard widgets, milestone nodes, proactive strip, dialogs
├── components/providers/# DataProvider (Supabase → Zustand hydration)
├── hooks/               # use-goals, use-flow-graph, use-radial-graph, use-smart-priority
├── lib/
│   ├── ai/              # generated-path.ts (7-horizon normalization)
│   ├── supabase/        # browser.ts, server.ts, env.ts, middleware.ts
│   ├── store.ts         # Zustand (all client state + Supabase side-effects)
│   ├── openai-deepseek.ts # lazy DeepSeek client factory
│   ├── calendar-ics.ts  # .ics builder
│   └── focus-task-display.ts # task label helpers
└── types/               # database.ts (Goal, Milestone, Task, etc.)
```

For implementation status, known issues, and backlog, see **`PROGRESS.md`**.
