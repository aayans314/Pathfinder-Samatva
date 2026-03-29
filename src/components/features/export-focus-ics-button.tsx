"use client";

import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSmartPriority } from "@/hooks/use-smart-priority";
import { buildTaskIcs, downloadIcsFile } from "@/lib/calendar-ics";
import {
  calendarDescription,
  calendarEventTitle,
} from "@/lib/focus-task-display";

export function ExportFocusIcsButton() {
  const top = useSmartPriority(1)[0];

  if (!top) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      className="gap-2 text-base h-11 px-5"
      onClick={() => {
        const start = new Date();
        start.setMinutes(start.getMinutes() + 5, 0, 0);
        const ics = buildTaskIcs({
          title: calendarEventTitle(top.title, top.milestoneName),
          description: calendarDescription(top.goalName, top.focusHint || top.reason),
          start,
          durationMinutes: 45,
          uid: `${top.id}-${start.getTime()}`,
        });
        downloadIcsFile(`pathfinder-focus-${top.id.slice(0, 8)}.ics`, ics);
      }}
    >
      <CalendarPlus className="h-5 w-5" />
      Add top focus to calendar (.ics)
    </Button>
  );
}
