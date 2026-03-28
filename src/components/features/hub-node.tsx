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
  const { completionPercent, totalXP, level } = data as unknown as HubNodeData;

  const strokeWidth = 4;
  const size = 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completionPercent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-[120px] h-[120px] rounded-full bg-background border-4 border-muted/50 shadow-2xl z-50">
      {/* Handles around the circle for edges to connect to */}
      <Handle type="source" id="top" position={Position.Top} className="opacity-0" />
      <Handle type="source" id="bottom" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" id="left" position={Position.Left} className="opacity-0" />
      <Handle type="source" id="right" position={Position.Right} className="opacity-0" />

      {/* Outer Progress Ring */}
      <div className="absolute inset-[-12px] flex items-center justify-center pointer-events-none">
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
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
            stroke="url(#hubGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
      </div>

      {/* Inner Avatar */}
      <div className="absolute inset-0 m-2 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center text-white shadow-inner overflow-hidden before:absolute before:inset-0 before:bg-white/20 before:animate-spin-slow">
        <User className="h-8 w-8 mb-0.5 relative z-10 drop-shadow-md" />
        <span className="text-[10px] font-bold tracking-widest relative z-10 drop-shadow-md">
          LVL {level}
        </span>
      </div>

      {/* Floating XP Badge */}
      <div className="absolute -bottom-3 px-3 py-1 bg-background border rounded-full text-[10px] font-bold text-muted-foreground shadow-sm whitespace-nowrap">
        {totalXP} XP Total
      </div>
    </div>
  );
}

export const HubNode = memo(HubNodeComponent);
