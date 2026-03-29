# Pathfinder — progress & coordination

## System state

- **Stack:** Next.js 16, TypeScript, Tailwind v4, shadcn/ui, Supabase, Zustand, React Flow, DeepSeek (`openai` SDK), date-fns
- **Path alias:** `@/*` → `./src/*`
- **Global UI:** Fonts and theme variables in `src/app/globals.css`; root `layout.tsx` uses `next/script` + `beforeInteractive` for dark-mode class init (no raw `<script>` in JSX)
- **Client data:** `src/lib/store.ts` + `DataProvider` hydration from Supabase
- **AI client:** All API routes use `getDeepSeekClient()` from `src/lib/openai-deepseek.ts` — lazy factory, no top-level `new OpenAI()` (safe for `next build` without env vars)

## Completed (recent + core)

### Product & AI

- [x] **Seven time horizons** — Each generated path has **7 milestones** (fixed slots: today, this week, this month, ~90 days, 6–12 months, 1–3 years, 3+ years) with short substeps (≤90 chars). Normalization in `src/lib/ai/generated-path.ts` (`finalizeSevenTimeframes`, `TIME_FRAME_IDS`); missing slots padded, duplicates merged.
- [x] **Personalized generation** — API prompt requests `personalizedPathIntro` (per path) and `personalizedNote` (per milestone) using name, bio, and resume; onboarding review shows "For you" callout and horizon badges (`getTimeFrameLabel`).
- [x] **Generate paths API** — `POST /api/generate-paths` (DeepSeek, JSON mode, temp 0.42). Accepts `name`, `bio`, `goals[]`, `resumeContext`, `resumeStructured`.
- [x] **Onboarding** — Multi-step: About You → Goals → AI Analysis → Review. Optional resume upload (PDF → `/api/parse-resume`). Batch inserts goals/milestones/tasks to Supabase, then `clearAndSetPaths` for immediate UI.
- [x] **Add Path** — Same generate-paths pipeline; persists via Zustand store only (avoids duplicate Supabase inserts that caused 23505 errors).
- [x] **Navigator** — Dashboard AI chatbot (`/api/chat`). Prompt-injection guard, context-aware system prompt, conversation history trimming.
- [x] **Resume parse** — `POST /api/parse-resume`: PDF text extraction via `unpdf`, optional DeepSeek structured parse. Graceful fallback (returns raw text if no API key).
- [x] **Proactive strip & calendar** — Top-focus messaging; **export focus to `.ics`** (`src/lib/calendar-ics.ts`, `export-focus-ics-button`). Minimal VEVENT builder with Blob download.
- [x] **Focus today** — `useSmartPriority`: deduping, deprioritize milestone-sized duplicates and **far-horizon** phrasing (`looksLikeFarHorizonTask`), user-facing **focus hints** ("Due today", "Active phase", "Unblocks next step") instead of internal scoring strings.
- [x] **Weekly report** — `POST /api/weekly-report`: authenticated, loads user's goals/milestones/tasks, generates a short AI report with stats.

### Agent & path ops

- [x] **Agent reschedule** — `POST /api/agent/reschedule`: tool-calling flow with DeepSeek (`reallocate_timeline` function tool). Accepts `capacityPercent` (0–100), loads user's full path data, calls AI with 55s timeout + AbortController, sanitizes tool response (filters invalid IDs, protects academic/career/visa milestones from pause). Store action `applyAgentReschedule` persists `sort_order` + milestone `paused` status to Supabase. UI trigger on My Path page.
- [x] **Milestone `paused`** — `MilestoneStatus` type includes `paused`; `milestone-node.tsx` and `milestone-detail-panel.tsx` render paused state (greyscale icon + muted styling). Smart priority penalizes paused milestone tasks (−200 score).

### Foundation (historical)

- [x] Scaffolding, SQL schema (`supabase_schema.sql` / `src/lib/supabase/schema.sql`), RLS, types in `src/types/database.ts`
- [x] Auth middleware, login flows (OAuth + email), `DataProvider`
- [x] Dashboard, My Path (linear + radial), decisions UI, peers UI, XP/level hooks, task CRUD patterns
- [x] Browser reminder scheduler (`reminder-scheduler.tsx`): `setInterval` checks profile notification prefs + fires browser `Notification` once per day at configured time (requires tab open)

## Known issues & gaps

### Functional bugs

- [ ] **Task ID mismatch after onboarding** — `clearAndSetPaths` regenerates task IDs with `crypto.randomUUID()`, but onboarding already inserted tasks with different UUIDs into Supabase. Subsequent task updates/deletes from the dashboard may target wrong DB rows. **Fix:** pass stable IDs into `clearAndSetPaths` or skip DB insert when using `clearAndSetPaths`.
- [ ] **Focus ranking ignores agent `sort_order`** — `useSmartPriority` uses its own scoring heuristics; after agent reschedule, `sort_order` is written to tasks but not consumed by the focus hook. The two orderings can disagree.
- [ ] **`/api/chat` doesn't validate `messages`** — if `messages` is missing or not an array, the route throws 500 instead of 400.
- [ ] **`/api/weekly-report` doesn't check Supabase errors** — goals query ignores `.error`; a DB failure silently looks like "empty progress."

### Product gaps

- [ ] **Decisions** — Not persisted to Supabase (store-only).
- [ ] **Peers** — Matches by goal title string; should match by ID/tag when available.
- [ ] **Realtime** — No cross-device live subscriptions for tasks/milestones.
- [ ] **Mobile** — Complex React Flow graphs need polish on small viewports.

## API route summary

| Route | Method | Purpose | AI? | Auth? |
|-------|--------|---------|-----|-------|
| `/api/generate-paths` | POST | Build 7-horizon paths from goals | DeepSeek | No (client sends user context) |
| `/api/chat` | POST | Navigator coach chat | DeepSeek | No (session optional) |
| `/api/parse-resume` | POST | PDF → text + optional structured parse | DeepSeek (optional) | No |
| `/api/weekly-report` | POST | AI weekly progress report | DeepSeek | Yes (Supabase auth) |
| `/api/agent/reschedule` | POST | Agentic reschedule with tool calling | DeepSeek (tools) | Yes (Supabase auth) |
| `/api/calendar/sync` | POST | Google Calendar free-slot sync | No | Yes (OAuth token) |

## Near-term backlog

1. Fix task ID mismatch in onboarding → `clearAndSetPaths`
2. Wire agent `sort_order` into `useSmartPriority` as a boost/tiebreaker
3. Validate `messages` array in `/api/chat`
4. Check Supabase `.error` in weekly-report queries
5. Persist decisions in Supabase with RLS
6. Optional: home UI that surfaces all seven horizons in an accordion (data already exists on the path)

## Architecture notes

- **Route group:** `(dashboard)` wraps sidebar shell; root layout is minimal (fonts, global CSS, theme script).
- **Milestone tree:** `parent_milestone_id` supports branching; flow layout in `use-flow-graph` / radial variant.
- **Focus vs path:** **Focus today** is intentionally a **small ranked slice** of tasks; the **full 7-horizon plan** lives on the path and in onboarding review.
- **AI client:** `src/lib/openai-deepseek.ts` exports `getDeepSeekClient()` — instantiated per-request, not at module scope. Prevents build failures when `DEEPSEEK_API_KEY` is unset.
- **Supabase env:** `src/lib/supabase/env.ts` returns placeholder credentials at build time so `next build` succeeds without env vars; real deployments must set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **shadcn Select:** `@base-ui/react` may pass `null` to `onValueChange`—handlers should accept it.
