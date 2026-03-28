"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CheckCircle2, Lock, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MilestoneStatus } from "@/types/database";

export type MilestoneNodeData = {
  label: string;
  description: string | null;
  status: MilestoneStatus;
  taskCount: number;
  completedTaskCount: number;
  accentColor?: string;
};

const statusConfig: Record<
  MilestoneStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    border: string;
    text: string;
    glow: string;
    badge: string;
    badgeText: string;
  }
> = {
  completed: {
    icon: CheckCircle2,
    bg: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30",
    border: "border-amber-400",
    text: "text-amber-700 dark:text-amber-400",
    glow: "shadow-[0_0_20px_rgba(251,191,36,0.3)]",
    badge: "bg-amber-500",
    badgeText: "✓ CLEARED",
  },
  in_progress: {
    icon: Loader2,
    bg: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30",
    border: "border-blue-400",
    text: "text-blue-700 dark:text-blue-400",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.25)] animate-pulse",
    badge: "bg-blue-500",
    badgeText: "⚡ ACTIVE",
  },
  locked: {
    icon: Lock,
    bg: "bg-muted/40",
    border: "border-muted-foreground/20",
    text: "text-muted-foreground/60",
    glow: "",
    badge: "bg-muted-foreground/40",
    badgeText: "🔒 LOCKED",
  },
};

function NodeProgressRing({
  percent,
  color,
  size = 36,
}: {
  percent: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90 shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease-in-out" }}
      />
    </svg>
  );
}

function MilestoneNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as MilestoneNodeData;
  const config = statusConfig[nodeData.status];
  const StatusIcon = config.icon;

  const taskPercent =
    nodeData.taskCount > 0
      ? Math.round((nodeData.completedTaskCount / nodeData.taskCount) * 100)
      : 0;

  // XP for this node
  const xpEarned =
    nodeData.completedTaskCount * 10 +
    (nodeData.status === "completed" ? 50 : 0);

  return (
    <div
      className={cn(
        "rounded-xl border-2 px-4 py-3 min-w-[220px] max-w-[280px] transition-all duration-300 hover:scale-105 cursor-pointer",
        config.bg,
        config.border,
        config.glow,
        nodeData.status === "locked" && "opacity-60 grayscale-[30%]"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      {/* Status badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white",
            config.badge
          )}
        >
          {config.badgeText}
        </span>
        {xpEarned > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            +{xpEarned} XP
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        {/* Progress ring or icon */}
        {nodeData.taskCount > 0 && nodeData.status !== "locked" ? (
          <div className="relative flex items-center justify-center">
            <NodeProgressRing
              percent={taskPercent}
              color={
                nodeData.status === "completed" ? "#f59e0b" : "#3b82f6"
              }
              size={36}
            />
            <span className="absolute text-[9px] font-bold">
              {taskPercent}%
            </span>
          </div>
        ) : (
          <StatusIcon
            className={cn(
              "h-5 w-5 mt-0.5 shrink-0",
              config.text,
              nodeData.status === "in_progress" && "animate-spin"
            )}
          />
        )}

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-semibold leading-tight",
              config.text
            )}
          >
            {nodeData.label}
          </p>
          {nodeData.description && nodeData.status !== "locked" && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {nodeData.description}
            </p>
          )}
          {nodeData.taskCount > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {nodeData.completedTaskCount}/{nodeData.taskCount} tasks
              completed
            </p>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-border"
      />
    </div>
  );
}

export const MilestoneNode = memo(MilestoneNodeComponent);
