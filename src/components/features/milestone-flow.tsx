"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useReactFlow,
  useNodesState,
  useEdgesState,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MilestoneNode } from "@/components/features/milestone-node";
import { HubNode } from "@/components/features/hub-node";
import { useFlowGraph } from "@/hooks/use-flow-graph";
import { useRadialGraph } from "@/hooks/use-radial-graph";
import { useGoals, useGoalsByCategory } from "@/hooks/use-goals";
import type { Milestone, Task } from "@/types/database";

const nodeTypes: NodeTypes = {
  milestone: MilestoneNode,
  hub: HubNode,
};

function FlowLegend() {
  return (
    <div className="absolute left-3 bottom-3 z-10 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card/95 backdrop-blur-xl px-5 py-3 text-base font-medium shadow-lg max-w-[calc(100%-1.5rem)]">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
        <span className="text-muted-foreground">Active</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-emerald-500 dark:bg-emerald-400" />
        <span className="text-muted-foreground">Done</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-muted-foreground/30 border border-muted-foreground/20" />
        <span className="text-muted-foreground">Upcoming</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-amber-500 dark:bg-amber-400" />
        <span className="text-muted-foreground">Paused</span>
      </div>
      <div className="h-4 w-px bg-border hidden sm:block" />
      <div className="flex items-center gap-2">
        <span className="h-1 w-6 rounded-full bg-amber-400" />
        <span className="text-muted-foreground">Completed path</span>
      </div>
    </div>
  );
}

/**
 * Zoom-in intro: start zoomed out on the full graph, then animate closer into
 * the first three milestones. (A single fit to the nodes alone can read as zoom-out
 * if the default viewport was already tight.)
 */
function FlowIntroZoom({ focusIdsKey }: { focusIdsKey: string }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!focusIdsKey) return;
    const nodeIds = focusIdsKey.split("|").filter(Boolean);
    if (nodeIds.length === 0) return;

    let cancelled = false;

    const run = async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (cancelled) return;

      // Wide starting frame (zoomed out) — instant, no visible “fit view” animation
      await fitView({
        padding: 0.1,
        maxZoom: 0.48,
        minZoom: 0.04,
        duration: 0,
      });
      if (cancelled) return;

      // Zoom in toward the first three boxes
      await fitView({
        nodes: nodeIds.map((id) => ({ id })),
        padding: 0.16,
        duration: 1100,
        maxZoom: 1.45,
        minZoom: 0.04,
        ease: (t) => 1 - Math.pow(1 - t, 2),
      });
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [fitView, focusIdsKey]);

  return null;
}

function FlowOverlay() {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  return (
    <div className="absolute right-3 top-3 z-10 flex flex-wrap items-center justify-end gap-2">
      <span className="text-sm text-muted-foreground mr-1 select-none hidden sm:inline">
        Drag to move around →
      </span>
      <button
        type="button"
        onClick={() => zoomOut({ duration: 300 })}
        className="rounded-lg border border-border bg-card/90 backdrop-blur-xl w-10 h-10 flex items-center justify-center text-foreground hover:bg-accent transition-colors text-base font-bold shadow-sm"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => zoomIn({ duration: 300 })}
        className="rounded-lg border border-border bg-card/90 backdrop-blur-xl w-10 h-10 flex items-center justify-center text-foreground hover:bg-accent transition-colors text-base font-bold shadow-sm"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => fitView({ padding: 0.15, duration: 500 })}
        className="rounded-lg border border-border bg-card/90 backdrop-blur-xl px-4 h-11 flex items-center text-base font-semibold text-foreground hover:bg-accent transition-colors shadow-sm"
      >
        Fit view
      </button>
    </div>
  );
}

interface MilestoneFlowProps {
  milestones: Milestone[];
  tasks: Task[];
  accentColor?: string;
  layout?: "linear" | "radial";
  onNodeClick?: (milestoneId: string) => void;
}

export function MilestoneFlow({
  milestones,
  tasks,
  accentColor,
  layout = "linear",
  onNodeClick,
}: MilestoneFlowProps) {
  const categoryStats = useGoalsByCategory();
  const goals = useGoals();

  const linearData = useFlowGraph(milestones, tasks, accentColor);
  const radialData = useRadialGraph(milestones, tasks, categoryStats, goals);
  const graphData = layout === "radial" ? radialData : linearData;

  const introFocusKey = useMemo(() => {
    return graphData.nodes
      .filter((n) => n.type === "milestone")
      .slice(0, 3)
      .map((n) => n.id)
      .join("|");
  }, [graphData.nodes]);

  const [nodes, , onNodesChange] = useNodesState(graphData.nodes);
  const [edges, , onEdgesChange] = useEdgesState(graphData.edges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string; type?: string }) => {
      if (node.type !== "hub" && node.id) {
        onNodeClick?.(node.id);
      }
    },
    [onNodeClick]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView={false}
      fitViewOptions={{ padding: 0.12, maxZoom: 0.75 }}
      minZoom={0.04}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
      panOnScroll
    >
      <FlowIntroZoom focusIdsKey={introFocusKey} />
      <FlowOverlay />
      <FlowLegend />
      <Background gap={32} size={1} color="rgba(148,163,184,0.08)" />
      <Controls showInteractive={false} className="hidden!" />
    </ReactFlow>
  );
}
