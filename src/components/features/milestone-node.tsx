"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CheckCircle2, Lock, Loader2, PauseCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MilestoneStatus } from "@/types/database";

export type MilestoneNodeData = {
  label: string;
  description: string | null;
  status: MilestoneStatus;
  taskCount: number;
  completedTaskCount: number;
  accentColor?: string;
  stepIndex?: number;
  totalSteps?: number;
};

const STATUS_META: Record<
  MilestoneStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    badge: string;
    dotColor: string;
    borderColor: string;
    bgColor: string;
    glowClass: string;
    barColor: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  completed: {
    icon: CheckCircle2,
    badge: "Done",
    dotColor: "bg-emerald-400",
    borderColor: "border-emerald-400/50",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    glowClass: "shadow-[0_0_20px_rgba(52,211,153,0.12)]",
    barColor: "bg-emerald-500 dark:bg-emerald-400",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-100 dark:bg-emerald-500/20",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
  in_progress: {
    icon: Loader2,
    badge: "In progress",
    dotColor: "bg-cyan-400 animate-pulse",
    borderColor: "border-cyan-400/50",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
    glowClass: "shadow-[0_0_24px_rgba(34,211,238,0.15)] animate-node-breathe",
    barColor: "bg-cyan-500 dark:bg-cyan-400",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    badgeBg: "bg-cyan-100 dark:bg-cyan-500/20",
    badgeText: "text-cyan-700 dark:text-cyan-300",
  },
  locked: {
    icon: Lock,
    badge: "Upcoming",
    dotColor: "bg-muted-foreground/40",
    borderColor: "border-border",
    bgColor: "bg-muted/50",
    glowClass: "",
    barColor: "bg-muted-foreground/30",
    iconColor: "text-muted-foreground",
    badgeBg: "bg-muted",
    badgeText: "text-muted-foreground",
  },
  paused: {
    icon: PauseCircle,
    badge: "Paused",
    dotColor: "bg-amber-400",
    borderColor: "border-amber-400/40",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    glowClass: "",
    barColor: "bg-amber-500 dark:bg-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-100 dark:bg-amber-500/20",
    badgeText: "text-amber-700 dark:text-amber-300",
  },
};

function MilestoneNodeComponent({ data }: NodeProps) {
  const d = data as unknown as MilestoneNodeData;
  const meta = STATUS_META[d.status];
  const StatusIcon = meta.icon;
  const accent = d.accentColor || "#60a5fa";
  const isLocked = d.status === "locked";

  const pct =
    d.taskCount > 0
      ? Math.round((d.completedTaskCount / d.taskCount) * 100)
      : 0;

  return (
    <div className="flex items-center gap-0">
      <Handle
        type="target"
        position={Position.Left}
        className="opacity-0! w-1! h-1!"
      />

      {/* Station dot */}
      <div className="flex flex-col items-center -mr-px z-10">
        <div
          className={cn(
            "h-8 w-8 rounded-full border-[3px] border-background shrink-0",
            meta.dotColor
          )}
          style={
            !isLocked
              ? { boxShadow: `0 0 14px ${accent}70` }
              : undefined
          }
        />
      </div>

      {/* Card */}
      <div
        className={cn(
          "relative ml-4 rounded-2xl border-2 w-[360px] transition-all cursor-pointer select-none",
          "hover:scale-[1.02] hover:shadow-md",
          meta.borderColor,
          meta.bgColor,
          meta.glowClass,
          isLocked && "opacity-55"
        )}
      >
        <div
          className="absolute top-0 left-5 right-5 h-1 rounded-b-full"
          style={{ backgroundColor: isLocked ? "transparent" : accent }}
        />

        <div className="px-6 pt-5 pb-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              {d.stepIndex != null && (
                <span
                  className="inline-flex items-center justify-center h-11 w-11 rounded-xl text-base font-bold text-white shadow-md"
                  style={{ backgroundColor: isLocked ? "var(--color-muted-foreground)" : accent }}
                >
                  {d.stepIndex}
                </span>
              )}
              <StatusIcon
                className={cn(
                  "h-7 w-7",
                  meta.iconColor,
                  d.status === "in_progress" && "animate-spin"
                )}
              />
            </div>
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full",
                meta.badgeBg,
                meta.badgeText
              )}
            >
              {meta.badge}
            </span>
          </div>

          {/* Title */}
          <p
            className={cn(
              "text-lg font-semibold leading-snug",
              isLocked ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {d.label}
          </p>

          {/* Description */}
          {d.description && !isLocked && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
              {d.description}
            </p>
          )}

          {/* Progress */}
          {d.taskCount > 0 && !isLocked ? (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Tasks
                </span>
                <span className="text-sm tabular-nums font-bold text-foreground">
                  {d.completedTaskCount}/{d.taskCount}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    meta.barColor
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ) : isLocked ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Complete previous step first</span>
            </div>
          ) : null}

          {/* Tap hint */}
          {!isLocked && (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Tap for details</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="opacity-0! w-1! h-1!"
      />
    </div>
  );
}

export const MilestoneNode = memo(MilestoneNodeComponent);
