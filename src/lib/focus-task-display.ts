/** Normalize task titles for deduping and cleaner UI (legacy Kickoff/Execute/Start prefixes). */

const PREFIX_RE = /^(start|kickoff|execute):\s*/i;

export function stripTaskPrefix(title: string): string {
  return title.replace(PREFIX_RE, "").trim();
}

/** Stable key for deduping near-duplicate tasks from old generators. */
export function taskDedupeKey(title: string): string {
  return stripTaskPrefix(title).toLowerCase().replace(/\s+/g, " ").slice(0, 96);
}

/** Heuristic: task copy sounds like a multi-year outcome, not a next action. */
const FAR_HORIZON_RE =
  /\b(10\s*\+?\s*years?|within\s+10\s*years?|series\s+[ab]\b|strategic\s+acquisition|\$100m|\$10m\s+equity|net\s+worth|decade|ipo\b|unicorn|years\s+establishing)\b/i;

export function looksLikeFarHorizonTask(title: string): boolean {
  return FAR_HORIZON_RE.test(stripTaskPrefix(title));
}

/** One-line label for UI: trim length, strip redundant prefixes. */
export function compactTaskLabel(title: string, maxLen = 72): string {
  const s = stripTaskPrefix(title).replace(/\s+/g, " ").trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1)}…`;
}

/** Short line for calendar event title (Apple/Google). */
export function calendarEventTitle(title: string, milestoneName: string): string {
  const compact = stripTaskPrefix(title);
  if (compact.length <= 56) return compact;
  const fromMilestone = stripTaskPrefix(milestoneName);
  if (fromMilestone.length > 0 && fromMilestone.length <= 48) return fromMilestone;
  return `${compact.slice(0, 52)}…`;
}

/** Short calendar description — avoid walls of text. */
export function calendarDescription(goalName: string, reason: string): string {
  const bits = [goalName, reason !== "backlog" ? reason : ""].filter(Boolean);
  const line = bits.join(" · ");
  if (line.length <= 280) return line;
  return `${line.slice(0, 277)}…`;
}
