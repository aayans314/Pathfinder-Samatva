"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { CheckSquare, FileText, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ReportStats {
  tasksCompletedThisWeek: number;
  totalCompleted: number;
  totalTasks: number;
  milestonesCompleted: number;
  totalMilestones: number;
  totalXP: number;
}

/** Renders `**bold**` segments as <strong>; leaves other text unchanged. */
function renderInlineBold(text: string): ReactNode {
  const re = /\*\*(.+?)\*\*/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }
    parts.push(
      <strong
        key={`s-${k++}`}
        className="font-semibold text-foreground"
      >
        {m[1]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts.length > 0 ? parts : text;
}

function ReportParagraph({ children }: { children: string }) {
  const lines = children.split("\n");
  return (
    <p className="text-base leading-relaxed text-muted-foreground [&_strong]:text-foreground">
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderInlineBold(line)}
        </Fragment>
      ))}
    </p>
  );
}

function ReportBody({ report }: { report: string }) {
  const blocks = useMemo(
    () =>
      report
        .trim()
        .split(/\n\s*\n+/)
        .map((b) => b.trim())
        .filter(Boolean),
    [report]
  );

  return (
    <div className="space-y-4 pt-1">
      {blocks.map((block, i) => (
        <ReportParagraph key={i}>{block}</ReportParagraph>
      ))}
    </div>
  );
}

function MilestoneRing({
  completed,
  total,
  accentClass,
}: {
  completed: number;
  total: number;
  accentClass: string;
}) {
  const pct = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative mx-auto h-24 w-24">
      <svg
        className="-rotate-90"
        viewBox="0 0 88 88"
        aria-hidden
      >
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          className="stroke-muted"
          strokeWidth="8"
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          className={cn("transition-[stroke-dashoffset] duration-700", accentClass)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
        <span className="text-2xl font-bold tabular-nums text-foreground leading-none">
          {completed}/{total}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground mt-1">
          milestones
        </span>
      </div>
    </div>
  );
}

function WeeklyStatsStrip({ stats }: { stats: ReportStats }) {
  const milestonePct =
    stats.totalMilestones > 0
      ? Math.round((stats.milestonesCompleted / stats.totalMilestones) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border/80 bg-linear-to-br from-violet-500/8 to-card p-5 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
          <CheckSquare className="h-7 w-7" strokeWidth={2} />
        </div>
        <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
          {stats.tasksCompletedThisWeek}
        </p>
        <p className="mt-1 text-base font-medium text-muted-foreground">
          Tasks this week
        </p>
      </div>

      <div className="rounded-2xl border border-border/80 bg-linear-to-br from-emerald-500/8 to-card p-5 text-center shadow-sm">
        <div className="mb-1 flex justify-center">
          <MilestoneRing
            completed={stats.milestonesCompleted}
            total={stats.totalMilestones}
            accentClass="stroke-emerald-500 dark:stroke-emerald-400"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{milestonePct}%</span>{" "}
          of milestones cleared
        </p>
      </div>

      <div className="rounded-2xl border border-border/80 bg-linear-to-br from-amber-500/8 to-card p-5 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Zap className="h-7 w-7" strokeWidth={2} />
        </div>
        <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
          {stats.totalXP.toLocaleString()}
        </p>
        <p className="mt-1 text-base font-medium text-muted-foreground">
          XP earned
        </p>
      </div>
    </div>
  );
}

export function WeeklyReportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generateReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/weekly-report", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();
      setReport(data.report);
      setStats(data.stats);
    } catch {
      setError("Could not generate your weekly report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="default"
            className="text-muted-foreground gap-1.5 text-base h-10 px-3"
          />
        }
        onClick={() => {
          if (!report) generateReport();
        }}
      >
        <FileText className="h-5 w-5" />
        <span className="hidden sm:inline">Weekly report</span>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl gap-0 p-0">
        <div className="p-6 md:p-8 pb-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-heading text-xl md:text-2xl font-semibold tracking-tight">
              Weekly Report
            </DialogTitle>
            <p className="text-base text-muted-foreground">
              Your week at a glance — then the full story below.
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 md:px-8 pb-8 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-base text-muted-foreground">
                Analyzing your week...
              </p>
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-4">
              <p className="text-base text-destructive">{error}</p>
              <Button variant="outline" size="default" onClick={generateReport}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              {stats && <WeeklyStatsStrip stats={stats} />}

              {report && <ReportBody report={report} />}

              <Button
                variant="outline"
                size="lg"
                className="w-full h-12 text-base font-medium rounded-xl"
                onClick={generateReport}
              >
                Regenerate
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
