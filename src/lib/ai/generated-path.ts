import type { GoalCategory } from "@/types/database";

const VALID_CATEGORIES: GoalCategory[] = [
  "daily",
  "academics",
  "research",
  "internships",
  "career",
  "fitness",
  "networking",
  "personal",
];

/** Fixed seven horizons — every generated path uses exactly these, in this order. */
export const TIME_FRAME_IDS = [
  "today",
  "this_week",
  "this_month",
  "next_90_days",
  "six_to_twelve_months",
  "one_to_three_years",
  "three_plus_years",
] as const;

export type TimeFrameId = (typeof TIME_FRAME_IDS)[number];

/** Default labels for UI when the model omits horizonLabel. */
export const DEFAULT_TIME_FRAME_LABELS: Record<TimeFrameId, string> = {
  today: "Today · next 24–48h",
  this_week: "This week",
  this_month: "This month",
  next_90_days: "Next ~90 days",
  six_to_twelve_months: "6–12 months",
  one_to_three_years: "1–3 years",
  three_plus_years: "3+ years · vision",
};

const TF_ALIASES: Record<string, TimeFrameId> = {
  today: "today",
  this_week: "this_week",
  this_month: "this_month",
  next_90_days: "next_90_days",
  next90days: "next_90_days",
  quarter: "next_90_days",
  next_quarter: "next_90_days",
  ninety_days: "next_90_days",
  six_to_twelve_months: "six_to_twelve_months",
  six_to_12_months: "six_to_twelve_months",
  one_to_three_years: "one_to_three_years",
  one_to_3_years: "one_to_three_years",
  three_plus_years: "three_plus_years",
  three_plus: "three_plus_years",
  long_term: "three_plus_years",
  vision: "three_plus_years",
};

export function parseTimeFrameId(raw: unknown): TimeFrameId | undefined {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (!s) return undefined;
  if ((TIME_FRAME_IDS as readonly string[]).includes(s)) return s as TimeFrameId;
  return TF_ALIASES[s];
}

export function getTimeFrameLabel(m: {
  timeFrameId?: TimeFrameId;
  horizonLabel?: string;
}): string {
  if (m.horizonLabel?.trim()) return m.horizonLabel.trim();
  if (m.timeFrameId) return DEFAULT_TIME_FRAME_LABELS[m.timeFrameId];
  return "Horizon";
}

export interface NormalizedMilestone {
  /** Canonical slot — always set after normalization when using 7-frame mode */
  timeFrameId?: TimeFrameId;
  title: string;
  /** Human-readable time slice, e.g. "This week" */
  horizonLabel?: string;
  /** Why this slice matters for this user (highly personalized one-liner). */
  personalizedNote?: string;
  description?: string;
  /** Concrete actions — become tasks under this milestone */
  substeps: string[];
}

export interface NormalizedPath {
  category: GoalCategory;
  goalTitle: string;
  /** Rough total horizon for the goal (e.g. 20 for a 20-year wealth goal) */
  goalHorizonYears?: number | null;
  pathSummary?: string;
  /** One sentence: why this plan fits this user (name, bio, resume). */
  personalizedPathIntro?: string;
  milestones: NormalizedMilestone[];
}

function isGoalCategory(c: string): c is GoalCategory {
  return VALID_CATEGORIES.includes(c as GoalCategory);
}

const MAX_SUBSTEP_LEN = 90;
const MAX_NOTE_LEN = 220;

function clipSubstep(s: string): string {
  const t = s.trim();
  if (t.length <= MAX_SUBSTEP_LEN) return t;
  return `${t.slice(0, MAX_SUBSTEP_LEN - 1)}…`;
}

function clipNote(s: string): string {
  const t = s.trim();
  if (t.length <= MAX_NOTE_LEN) return t;
  return `${t.slice(0, MAX_NOTE_LEN - 1)}…`;
}

function defaultSubsteps(phaseTitle: string): string[] {
  return [
    `Define one success metric for: ${phaseTitle.slice(0, 40)}`,
    `Block 45m this week for the next action`,
    `Review and pick the next step`,
  ].map(clipSubstep);
}

function placeholderMilestone(id: TimeFrameId): NormalizedMilestone {
  const label = DEFAULT_TIME_FRAME_LABELS[id];
  return {
    timeFrameId: id,
    title: `Focus · ${label}`,
    horizonLabel: label,
    substeps: defaultSubsteps(label),
  };
}

/**
 * Ensure exactly seven milestones, one per canonical time frame, in order.
 * Merges duplicate slots; pads missing slots with placeholders.
 */
export function finalizeSevenTimeframes(milestones: NormalizedMilestone[]): NormalizedMilestone[] {
  const byId = new Map<TimeFrameId, NormalizedMilestone>();

  for (const m of milestones) {
    const id = m.timeFrameId ?? parseTimeFrameId(m.horizonLabel);
    if (!id) continue;
    const prev = byId.get(id);
    if (!prev) {
      byId.set(id, { ...m, timeFrameId: id });
    } else {
      const mergedSub = [...prev.substeps, ...m.substeps].map(clipSubstep).filter(Boolean);
      const unique = [...new Set(mergedSub)].slice(0, 8);
      byId.set(id, {
        ...prev,
        title: m.title.length >= prev.title.length ? m.title : prev.title,
        personalizedNote: m.personalizedNote || prev.personalizedNote,
        description: m.description || prev.description,
        substeps: unique.length > 0 ? unique : prev.substeps,
      });
    }
  }

  return TIME_FRAME_IDS.map((id) => {
    const m = byId.get(id);
    if (m) {
      return {
        ...m,
        timeFrameId: id,
        horizonLabel: m.horizonLabel?.trim() || DEFAULT_TIME_FRAME_LABELS[id],
      };
    }
    return placeholderMilestone(id);
  });
}

function normalizeMilestone(m: unknown, index: number): NormalizedMilestone | null {
  if (typeof m === "string") {
    const t = m.trim();
    if (!t) return null;
    const id =
      index < TIME_FRAME_IDS.length ? TIME_FRAME_IDS[index] : "three_plus_years";
    return {
      timeFrameId: id,
      title: t,
      horizonLabel: DEFAULT_TIME_FRAME_LABELS[id],
      substeps: defaultSubsteps(t),
    };
  }
  if (!m || typeof m !== "object") return null;
  const o = m as Record<string, unknown>;
  const title = String(o.title ?? "").trim();
  if (!title) return null;

  const rawSub = o.substeps ?? o.tasks ?? o.steps;
  let substeps: string[] = [];
  if (Array.isArray(rawSub)) {
    substeps = rawSub
      .map((s) => clipSubstep(String(s)))
      .filter(Boolean);
  }
  if (substeps.length === 0) {
    substeps = defaultSubsteps(title);
  }

  const tfRaw = o.timeFrameId ?? o.time_frame_id ?? o.timeframeId ?? o.slot;
  let timeFrameId = parseTimeFrameId(tfRaw);
  if (!timeFrameId) {
    timeFrameId =
      index < TIME_FRAME_IDS.length
        ? TIME_FRAME_IDS[index]
        : "three_plus_years";
  }

  const horizonLabel =
    (o.horizonLabel ?? o.horizon_label ?? o.timeline) !== undefined
      ? String(o.horizonLabel ?? o.horizon_label ?? o.timeline).trim() ||
        undefined
      : undefined;

  const personalizedNoteRaw =
    o.personalizedNote ?? o.personalized_note ?? o.forYou ?? o.whyForYou;
  const personalizedNote =
    personalizedNoteRaw !== undefined
      ? clipNote(String(personalizedNoteRaw))
      : undefined;

  const description =
    o.description !== undefined ? String(o.description).trim() || undefined : undefined;

  return {
    timeFrameId,
    title,
    horizonLabel,
    personalizedNote,
    description,
    substeps,
  };
}

function normalizePath(p: unknown): NormalizedPath | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;

  const goalTitle = String(o.goalTitle ?? o.goal_title ?? "").trim();
  if (!goalTitle) return null;

  const catRaw = String(o.category ?? "personal").toLowerCase();
  const category: GoalCategory = isGoalCategory(catRaw) ? catRaw : "personal";

  let goalHorizonYears: number | null | undefined;
  if (typeof o.goalHorizonYears === "number" && Number.isFinite(o.goalHorizonYears)) {
    goalHorizonYears = Math.max(0.25, Math.min(80, o.goalHorizonYears));
  } else if (typeof o.goal_horizon_years === "number") {
    goalHorizonYears = Math.max(0.25, Math.min(80, o.goal_horizon_years));
  } else {
    goalHorizonYears = null;
  }

  const pathSummary =
    o.pathSummary !== undefined
      ? String(o.pathSummary).trim() || undefined
      : o.summary !== undefined
        ? String(o.summary).trim() || undefined
        : undefined;

  const personalizedPathIntro =
    o.personalizedPathIntro !== undefined
      ? clipNote(String(o.personalizedPathIntro))
      : o.personalized_path_intro !== undefined
        ? clipNote(String(o.personalized_path_intro))
        : undefined;

  const msRaw = o.milestones;
  const milestones: NormalizedMilestone[] = [];
  if (Array.isArray(msRaw)) {
    msRaw.forEach((item, index) => {
      const nm = normalizeMilestone(item, index);
      if (nm) milestones.push(nm);
    });
  }

  if (milestones.length === 0) return null;

  const seven = finalizeSevenTimeframes(milestones);

  return {
    category,
    goalTitle,
    goalHorizonYears,
    pathSummary,
    personalizedPathIntro,
    milestones: seven,
  };
}

/**
 * Normalize arbitrary model output (array, { paths: [] }, legacy string milestones) into stable paths.
 */
export function normalizeGeneratedPaths(raw: unknown): NormalizedPath[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.paths)) list = o.paths;
    else {
      const key = Object.keys(o).find((k) => Array.isArray(o[k]));
      if (key) list = o[key] as unknown[];
    }
  }

  return list.map(normalizePath).filter((p): p is NormalizedPath => p !== null);
}
