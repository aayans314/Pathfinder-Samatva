"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { User } from "lucide-react";

export type HubNodeData = {
  completionPercent: number;
  totalXP: number;
  level: number;
};

function HubNodeComponent({ data }: NodeProps) {
  const { completionPercent } = data as unknown as HubNodeData;

  return (
    <div className="relative flex items-center justify-center w-[80px] h-[80px] rounded-full bg-background border-2 border-foreground/15 shadow-sm z-50">
      <Handle type="source" id="top" position={Position.Top} className="opacity-0" />
      <Handle type="source" id="bottom" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" id="left" position={Position.Left} className="opacity-0" />
      <Handle type="source" id="right" position={Position.Right} className="opacity-0" />

      <div className="flex flex-col items-center">
        <User className="h-5 w-5 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground mt-1 tabular-nums">
          {completionPercent}%
        </span>
      </div>
    </div>
  );
}

export const HubNode = memo(HubNodeComponent);
