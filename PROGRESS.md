# Pathfinder — Team Coordination Hub

## System State
- **Tech Stack:** Next.js 16, TypeScript (strict), Tailwind CSS v4, shadcn/ui, Supabase, Zustand, React Query, React Flow, date-fns
- **Theme:** Goal Intelligence — Career Path & Visa Journey for International Students
- **Global Constants:**
  - Path alias: `@/*` → `./src/*`
  - shadcn/ui config: `components.json` (style: base-nova, RSC: true)
  - CSS variables defined in `src/app/globals.css`
  - Font: Geist Sans (`--font-sans`) + Geist Mono (`--font-geist-mono`)
  - State store: `src/lib/store.ts` (Zustand) — single source of truth for all client state

## Active Tasks (Locking)
- [ ] **Data Sync refactor**: Replace Zustand mock data logic with live Supabase `select/insert/update` API calls across the dashboard components.
- [ ] **Mobile Responsiveness**: Refine the Radial Layout and Flow diagrams for smaller mobile viewports.

## Completed (Sync Log)

### Phase 1: Scaffolding & Database Schema
- [x] **Project Scaffold** — Next.js 16 initialized with Tailwind CSS v4 and TypeScript strict mode
- [x] **shadcn/ui Setup** — Initialized with sidebar, button, separator, tooltip, avatar, badge, dialog, label, select, textarea, checkbox, card, dropdown-menu, progress components
- [x] **Dependency Install** — @supabase/supabase-js, zustand, @tanstack/react-query, @xyflow/react, date-fns, lucide-react
- [x] **TypeScript Interfaces** — `src/types/database.ts` — User, Goal, Milestone, Task types with GoalStatus/MilestoneStatus enums
- [x] **SQL Schema** — `src/lib/supabase/schema.sql` — 4 tables with RLS policies, indexes, cascading FKs
- [x] **Mock Data** — `src/lib/mockData.ts` — H-1B international student scenario with 5 users, 8 goals, 10 milestones, 18 tasks
- [x] **Layout Shell** — Sidebar navigation (Dashboard, My Path, Decisions, Peers) using shadcn/ui Sidebar in `(dashboard)` route group

### Phase 2: Core Features — Visualization & Task Management
- [x] **Zustand Store** — `src/lib/store.ts` — Centralized state with CRUD for tasks, milestone status updates, goal status updates, and decisions
- [x] **Custom Hooks** — `src/hooks/use-goals.ts` — useCurrentUser, useGoals, useMilestones, useTasks, useStats hooks with computed selectors
- [x] **Dynamic Dashboard** — `src/app/(dashboard)/page.tsx` — Live stat cards, progress bar, goal list, upcoming tasks, full task list with CRUD
- [x] **React Flow Visualization** — `src/app/(dashboard)/my-path/page.tsx` — Interactive branching milestone map with:
  - Custom `MilestoneNode` component with status colors (emerald/blue/muted), icons, task progress bars
  - Auto-layout engine via `src/hooks/use-flow-graph.ts` (tree-based recursive positioning)
  - Goal filter dropdown, milestone detail panel with task checkboxes
  - Animated edges for in-progress milestones, completed edges in green
- [x] **Task CRUD** — `src/components/features/task-form-dialog.tsx` + `task-list.tsx` — Create/edit/delete tasks with milestone linking dropdown grouped by goal

### Phase 3: Decision Analyzer
- [x] **Decision Analyzer** — `src/app/(dashboard)/decisions/page.tsx` — Side-by-side comparative UI:
  - `DecisionForm` dialog with weighted scoring grid against user goals
  - `DecisionCard` with total/percentage scores, per-criterion breakdown, winner highlight
  - Create and delete decisions, persisted in Zustand store

### Phase 4: Peer Matching
- [x] **Peer Matching Feed** — `src/app/(dashboard)/peers/page.tsx` — Peer discovery:
  - Filters opted-in users by shared goal titles
  - Goal filter dropdown, visa type badges
  - `PeerCard` with avatar, bio, shared goal badges, goal count
  - Sorted by number of shared goals (most relevant first)

### Phase 5: Gamified Visualization
- [x] **My Path Revamp** — Added category tab pills, progress header banner, and gamified nodes (gold completed, blue pulsing active, locked).
- [x] **Radial Dashboard** — Created `useRadialGraph` for an aesthetic starburst layout centering on the User Hub avatar node. 
- [x] **XP System** — Integrated global Level and XP scaling (+10 XP per task, +50 per milestone)

### Phase 6: AI Onboarding & Supabase Auth
- [x] **Supabase Integration** — Installed `@supabase/ssr`, connected `browser`, `server`, and `middleware` utilities. Real `.env.local` keys initialized!
- [x] **OAuth Login** — Beautiful `/login` page with Google and LinkedIn integration buttons.
- [x] **AI Agent Integration** — Server-side `/api/generate-paths` connected to DeepSeek.
- [x] **Smart Onboarding UI** — Collects user's primary goals and instructs DeepSeek to output exactly 3 personalized JSON "Paths of Life" to inject directly into the user's dashboard.
- [x] **Add Path Dialog** — Wired up My Path's "+ Add Path" to utilize the live DeepSeek API for dynamic gap-filling generation.

## Active Blockers / Warnings
- **Real DB Connected, but State is Local**: Supabase keys are plugged in and Auth works! However, the UI still mostly relies on the initial load of `src/lib/mockData.ts` into Zustand. Next priority is swapping Zustand state for `supabase.from('goals').select()`.
- **Decisions are not persisted to DB.** The `Decision` type lives in `src/lib/store.ts` and is not yet in `supabase_schema.sql`.

## Architecture Decisions
- **Route Group:** All dashboard pages live under `src/app/(dashboard)/` which wraps them in `SidebarProvider` + `TooltipProvider`. The root `layout.tsx` only handles fonts and global styles.
- **State Management:** Zustand store (`src/lib/store.ts`) holds all data and mutations. Custom hooks in `src/hooks/use-goals.ts` provide computed selectors. React Query will replace this for server state once Supabase is connected.
- **Milestone Tree:** `milestones.parent_milestone_id` is self-referential (nullable FK) to support branching paths in React Flow. Layout is computed recursively in `src/hooks/use-flow-graph.ts`.
- **order_index:** Added to milestones for deterministic positioning in the flow diagram.
- **Status Enums:** GoalStatus = active | paused | completed | archived. MilestoneStatus = locked | in_progress | completed. Enforced as CHECK constraints in SQL and union types in TypeScript.
- **shadcn Select API:** Uses `@base-ui/react` — `onValueChange` passes `string | null` (not `string`). All Select handlers must handle null.
- **Peer Matching:** Matches users by shared goal title strings. When Supabase is connected, switch to matching by `goal_id` or a shared tag/category system.

## To-Do (Priority List)
1. Connect Supabase project and configure environment variables
2. Set up Supabase Auth (email/OAuth) and wire RLS
3. Replace Zustand mock state with React Query + Supabase client calls
4. Add `decisions` table to SQL schema and persist to DB
5. Add real-time subscriptions for task/milestone updates
6. Add dark mode toggle
7. Mobile responsive refinements
