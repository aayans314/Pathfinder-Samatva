"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CheckCircle2, Lock, Loader2, PauseCircle } from "lucide-react";
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

const statusStyles: Record<
  MilestoneStatus,
  { icon: React.ComponentType<{ className?: string }>; classes: string }
> = {
  completed: {
    icon: CheckCircle2,
    classes: "border-foreground/20 bg-background",
  },
  in_progress: {
    icon: Loader2,
    classes: "border-foreground/30 bg-background ring-1 ring-foreground/10",
  },
  locked: {
    icon: Lock,
    classes: "border-border bg-muted/40 opacity-50",
  },
  paused: {
    icon: PauseCircle,
    classes:
      "border-muted-foreground/30 bg-muted/60 text-muted-foreground opacity-75 grayscale",
  },
};

function MilestoneNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as MilestoneNodeData;
  const config = statusStyles[nodeData.status];
  const StatusIcon = config.icon;

  const taskPercent =
    nodeData.taskCount > 0
      ? Math.round((nodeData.completedTaskCount / nodeData.taskCount) * 100)
      : 0;

  return (
    <div
      className={cn(
        "rounded-lg border px-3.5 py-2.5 min-w-[180px] max-w-[240px] transition-all hover:shadow-sm cursor-pointer",
        config.classes
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      <div className="flex items-start gap-2.5">
        <StatusIcon
          className={cn(
            "h-4 w-4 mt-0.5 shrink-0",
            nodeData.status === "completed" && "text-foreground",
            nodeData.status === "in_progress" &&
              "text-foreground/70 animate-spin",
            nodeData.status === "locked" && "text-muted-foreground",
            nodeData.status === "paused" && "text-muted-foreground/80"
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{nodeData.label}</p>
          {nodeData.description && nodeData.status !== "locked" && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {nodeData.description}
            </p>
          )}
        </div>
      </div>

      {nodeData.taskCount > 0 && nodeData.status !== "locked" && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground/60 transition-all duration-500"
              style={{ width: `${taskPercent}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {nodeData.completedTaskCount}/{nodeData.taskCount}
          </span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-border"
      />
    </div>
  );
}

export const MilestoneNode = memo(MilestoneNodeComponent);
