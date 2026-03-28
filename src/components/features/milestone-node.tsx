"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CheckCircle2, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MilestoneStatus } from "@/types/database";

export type MilestoneNodeData = {
  label: string;
  description: string | null;
  status: MilestoneStatus;
  taskCount: number;
  completedTaskCount: number;
};

const statusConfig: Record<
  MilestoneStatus,
  { icon: React.ComponentType<{ className?: string }>; bg: string; border: string; text: string }
> = {
  completed: {
    icon: CheckCircle2,
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  in_progress: {
    icon: Loader2,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-500",
    text: "text-blue-700 dark:text-blue-400",
  },
  locked: {
    icon: Lock,
    bg: "bg-muted/50",
    border: "border-muted-foreground/30",
    text: "text-muted-foreground",
  },
};

function MilestoneNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as MilestoneNodeData;
  const config = statusConfig[nodeData.status];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border-2 px-4 py-3 shadow-sm min-w-[200px] max-w-[260px]",
        config.bg,
        config.border
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      <div className="flex items-start gap-2">
        <StatusIcon
          className={cn(
            "h-4 w-4 mt-0.5 shrink-0",
            config.text,
            nodeData.status === "in_progress" && "animate-spin"
          )}
        />
        <div className="min-w-0">
          <p className={cn("text-sm font-semibold leading-tight", config.text)}>
            {nodeData.label}
          </p>
          {nodeData.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {nodeData.description}
            </p>
          )}
          {nodeData.taskCount > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${(nodeData.completedTaskCount / nodeData.taskCount) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {nodeData.completedTaskCount}/{nodeData.taskCount}
              </span>
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  );
}

export const MilestoneNode = memo(MilestoneNodeComponent);
