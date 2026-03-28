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
import { useFlowGraph } from "@/hooks/use-flow-graph";
import type { Milestone, Task } from "@/types/database";

const nodeTypes: NodeTypes = {
  milestone: MilestoneNode,
};

interface MilestoneFlowProps {
  milestones: Milestone[];
  tasks: Task[];
  onNodeClick?: (milestoneId: string) => void;
}

export function MilestoneFlow({
  milestones,
  tasks,
  onNodeClick,
}: MilestoneFlowProps) {
  const { nodes: initialNodes, edges: initialEdges } = useFlowGraph(
    milestones,
    tasks
  );
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      onNodeClick?.(node.id);
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
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.3}
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
