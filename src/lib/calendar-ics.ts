/** Minimal iCalendar (RFC 5545) snippet for importing into Google Calendar, Apple Calendar, etc. */

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Build a single-event .ics file. `start` is UTC; event lasts `durationMinutes`.
 */
export function buildTaskIcs(params: {
  title: string;
  description?: string;
  start: Date;
  durationMinutes: number;
  uid: string;
}): string {
  const end = new Date(
    params.start.getTime() + params.durationMinutes * 60 * 1000
  );
  const stamp = formatIcsUtc(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pathfinder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.uid}@pathfinder.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatIcsUtc(params.start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(params.title)}`,
    params.description
      ? `DESCRIPTION:${escapeIcsText(params.description)}`
      : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

export function downloadIcsFile(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
