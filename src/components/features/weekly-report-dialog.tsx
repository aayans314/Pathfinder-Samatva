"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ReportStats {
  tasksCompletedThisWeek: number;
  totalCompleted: number;
  totalTasks: number;
  milestonesCompleted: number;
  totalMilestones: number;
  totalXP: number;
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
            size="sm"
            className="text-muted-foreground gap-1.5"
          />
        }
        onClick={() => {
          if (!report) generateReport();
        }}
      >
        <FileText className="h-4 w-4" />
        <span className="hidden sm:inline">Weekly report</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Weekly Report</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Analyzing your week...
            </p>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={generateReport}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {stats && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">
                    {stats.tasksCompletedThisWeek}
                  </span>{" "}
                  tasks this week
                </span>
                <span className="text-border">·</span>
                <span>
                  <span className="font-medium text-foreground">
                    {stats.milestonesCompleted}/{stats.totalMilestones}
                  </span>{" "}
                  milestones
                </span>
              </div>
            )}

            {report && (
              <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                {report.split("\n").map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={generateReport}
            >
              Regenerate
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
