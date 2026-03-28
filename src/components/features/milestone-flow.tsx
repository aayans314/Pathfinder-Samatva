"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
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
      fitView
      fitViewOptions={layout === "radial" ? { padding: 0.1, maxZoom: 1 } : { padding: 0.3 }}
      minZoom={0.1}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} size={1} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeStrokeWidth={3}
        className="!bg-background !border-border"
      />
    </ReactFlow>
  );
}

