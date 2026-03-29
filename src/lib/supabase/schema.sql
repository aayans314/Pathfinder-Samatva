-- Pathfinder Supabase schema snippets (align with repo root `supabase_schema.sql`).
-- For existing databases that predate `paused` / `sort_order`, run the migration block below.

-- ── Migration: milestone `paused` + task `sort_order` ─────────────────────────
-- Run once in Supabase SQL editor if your DB was created before these fields.

-- 1) Add 'paused' to milestone_status (PostgreSQL has no IF NOT EXISTS for enum values in older versions;
--    duplicate runs may error — ignore or use a DO block per your PG version.)
ALTER TYPE milestone_status ADD VALUE IF NOT EXISTS 'paused';

-- 2) Task ordering for agentic reprioritization
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL;
