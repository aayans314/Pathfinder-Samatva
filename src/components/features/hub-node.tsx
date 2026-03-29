"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Compass } from "lucide-react";

export type HubNodeData = {
  completionPercent: number;
  totalXP: number;
  level: number;
};

function HubNodeComponent({ data }: NodeProps) {
  const { completionPercent, level } = data as unknown as HubNodeData;

  return (
    <div className="relative flex items-center justify-center w-[120px] h-[120px] z-50">
      <Handle type="source" id="top" position={Position.Top} className="opacity-0" />
      <Handle type="source" id="bottom" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" id="left" position={Position.Left} className="opacity-0" />
      <Handle type="source" id="right" position={Position.Right} className="opacity-0" />

      <div className="absolute inset-0 rounded-full animate-node-breathe" />

      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 180deg, #22d3ee ${completionPercent}%, rgba(100,116,139,0.25) ${completionPercent}% 100%)`,
        }}
      />

      <div className="relative h-[100px] w-[100px] rounded-full bg-background border-2 border-border flex flex-col items-center justify-center gap-0.5">
        <Compass className="h-6 w-6 text-primary" />
        <span className="text-[11px] font-bold text-foreground tabular-nums">
          {completionPercent}%
        </span>
        <span className="text-[9px] font-semibold text-primary/80 uppercase tracking-widest">
          Lv {level}
        </span>
      </div>

      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        You
      </span>
    </div>
  );
}

export const HubNode = memo(HubNodeComponent);
