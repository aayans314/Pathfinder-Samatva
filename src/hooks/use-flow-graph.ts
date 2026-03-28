import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { Milestone, Task } from "@/types/database";
import type { MilestoneNodeData } from "@/components/features/milestone-node";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 140;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 70;

function buildTree(milestones: Milestone[]) {
  const childrenMap = new Map<string | null, Milestone[]>();
  for (const m of milestones) {
    const parentId = m.parent_milestone_id;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(m);
  }
  for (const children of childrenMap.values()) {
    children.sort((a, b) => a.order_index - b.order_index);
  }
  return childrenMap;
}

interface LayoutResult {
  nodes: Node[];
  width: number;
}

function layoutSubtree(
  milestoneId: string,
  milestones: Map<string, Milestone>,
  childrenMap: Map<string | null, Milestone[]>,
  tasksByMilestone: Map<string, Task[]>,
  depth: number,
  offsetX: number,
  accentColor?: string
): LayoutResult {
  const milestone = milestones.get(milestoneId)!;
  const children = childrenMap.get(milestoneId) ?? [];
  const tasks = tasksByMilestone.get(milestoneId) ?? [];

  if (children.length === 0) {
    const node: Node = {
      id: milestoneId,
      type: "milestone",
      position: { x: offsetX, y: depth * (NODE_HEIGHT + VERTICAL_GAP) },
      data: {
        label: milestone.title,
        description: milestone.description,
        status: milestone.status,
        taskCount: tasks.length,
        completedTaskCount: tasks.filter((t) => t.completed).length,
        accentColor,
      } satisfies MilestoneNodeData,
    };
    return { nodes: [node], width: NODE_WIDTH };
  }

  const childResults: LayoutResult[] = [];
  let childOffset = offsetX;

  for (const child of children) {
    const result = layoutSubtree(
      child.id,
      milestones,
      childrenMap,
      tasksByMilestone,
      depth + 1,
      childOffset,
      accentColor
    );
    childResults.push(result);
    childOffset += result.width + HORIZONTAL_GAP;
  }

  const totalChildWidth =
    childResults.reduce((sum, r) => sum + r.width, 0) +
    (childResults.length - 1) * HORIZONTAL_GAP;

  const parentX = offsetX + totalChildWidth / 2 - NODE_WIDTH / 2;

  const parentNode: Node = {
    id: milestoneId,
    type: "milestone",
    position: { x: parentX, y: depth * (NODE_HEIGHT + VERTICAL_GAP) },
    data: {
      label: milestone.title,
      description: milestone.description,
      status: milestone.status,
      taskCount: tasks.length,
      completedTaskCount: tasks.filter((t) => t.completed).length,
      accentColor,
    } satisfies MilestoneNodeData,
  };

  const allNodes = [parentNode, ...childResults.flatMap((r) => r.nodes)];
  return { nodes: allNodes, width: totalChildWidth };
}

export function useFlowGraph(
  milestones: Milestone[],
  tasks: Task[],
  accentColor?: string
) {
  return useMemo(() => {
    if (milestones.length === 0) {
      return { nodes: [], edges: [] };
    }

    const milestoneMap = new Map(milestones.map((m) => [m.id, m]));
    const childrenMap = buildTree(milestones);
    const tasksByMilestone = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!tasksByMilestone.has(t.milestone_id)) {
        tasksByMilestone.set(t.milestone_id, []);
      }
      tasksByMilestone.get(t.milestone_id)!.push(t);
    }

    const roots = childrenMap.get(null) ?? [];
    const allNodes: Node[] = [];
    let currentOffsetX = 0;

    for (const root of roots) {
      const result = layoutSubtree(
        root.id,
        milestoneMap,
        childrenMap,
        tasksByMilestone,
        0,
        currentOffsetX,
        accentColor
      );
      allNodes.push(...result.nodes);
      currentOffsetX += result.width + HORIZONTAL_GAP * 2;
    }

    const edges: Edge[] = milestones
      .filter((m) => m.parent_milestone_id !== null)
      .map((m) => {
        const parentStatus = milestoneMap.get(m.parent_milestone_id!)?.status;
        const isCompleted = parentStatus === "completed";
        const isActive =
          m.status === "in_progress" || parentStatus === "in_progress";

        return {
          id: `e-${m.parent_milestone_id}-${m.id}`,
          source: m.parent_milestone_id!,
          target: m.id,
          type: "smoothstep",
          animated: isActive,
          style: {
            stroke: isCompleted
              ? "#f59e0b" // golden path for completed
              : isActive
                ? accentColor || "#3b82f6"
                : "#d1d5db",
            strokeWidth: isCompleted ? 3 : 2,
          },
        };
      });

    return { nodes: allNodes, edges };
  }, [milestones, tasks, accentColor]);
}
