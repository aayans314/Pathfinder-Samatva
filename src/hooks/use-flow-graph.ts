import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { Milestone, Task } from "@/types/database";
import type { MilestoneNodeData } from "@/components/features/milestone-node";

/** Approximate footprint for linear layout (dot + gap + card); keep in sync with milestone-node.tsx */
const NODE_W = 410;
const NODE_H = 240;
const H_GAP = 160;
const V_GAP = 60;

function buildTree(milestones: Milestone[]) {
  const childrenMap = new Map<string | null, Milestone[]>();
  for (const m of milestones) {
    const pid = m.parent_milestone_id;
    if (!childrenMap.has(pid)) childrenMap.set(pid, []);
    childrenMap.get(pid)!.push(m);
  }
  for (const c of childrenMap.values()) {
    c.sort((a, b) => a.order_index - b.order_index);
  }
  return childrenMap;
}

interface SubtreeResult {
  nodes: Node[];
  height: number;
}

function layoutSubtree(
  id: string,
  mMap: Map<string, Milestone>,
  children: Map<string | null, Milestone[]>,
  taskMap: Map<string, Task[]>,
  depth: number,
  offsetY: number,
  counter: { v: number },
  totalSteps: number,
  accent?: string
): SubtreeResult {
  const m = mMap.get(id)!;
  const kids = children.get(id) ?? [];
  const tasks = taskMap.get(id) ?? [];

  counter.v += 1;
  const step = counter.v;

  const x = depth * (NODE_W + H_GAP);

  if (kids.length === 0) {
    const node: Node = {
      id,
      type: "milestone",
      position: { x, y: offsetY },
      data: {
        label: m.title,
        description: m.description,
        status: m.status,
        taskCount: tasks.length,
        completedTaskCount: tasks.filter((t) => t.completed).length,
        accentColor: accent,
        stepIndex: step,
        totalSteps,
      } satisfies MilestoneNodeData,
    };
    return { nodes: [node], height: NODE_H };
  }

  const kidResults: SubtreeResult[] = [];
  let yOff = offsetY;
  for (const kid of kids) {
    const res = layoutSubtree(
      kid.id,
      mMap,
      children,
      taskMap,
      depth + 1,
      yOff,
      counter,
      totalSteps,
      accent
    );
    kidResults.push(res);
    yOff += res.height + V_GAP;
  }

  const totalKidH =
    kidResults.reduce((s, r) => s + r.height, 0) +
    (kidResults.length - 1) * V_GAP;

  const parentY = offsetY + totalKidH / 2 - NODE_H / 2;

  const parentNode: Node = {
    id,
    type: "milestone",
    position: { x, y: parentY },
    data: {
      label: m.title,
      description: m.description,
      status: m.status,
      taskCount: tasks.length,
      completedTaskCount: tasks.filter((t) => t.completed).length,
      accentColor: accent,
      stepIndex: step,
      totalSteps,
    } satisfies MilestoneNodeData,
  };

  return {
    nodes: [parentNode, ...kidResults.flatMap((r) => r.nodes)],
    height: totalKidH,
  };
}

export function useFlowGraph(
  milestones: Milestone[],
  tasks: Task[],
  accentColor?: string
) {
  return useMemo(() => {
    if (milestones.length === 0) return { nodes: [], edges: [] };

    const mMap = new Map(milestones.map((m) => [m.id, m]));
    const childrenMap = buildTree(milestones);
    const taskMap = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!taskMap.has(t.milestone_id)) taskMap.set(t.milestone_id, []);
      taskMap.get(t.milestone_id)!.push(t);
    }

    const roots = childrenMap.get(null) ?? [];
    const totalSteps = milestones.length;
    const counter = { v: 0 };
    const allNodes: Node[] = [];
    let yOffset = 0;

    for (const root of roots) {
      const res = layoutSubtree(
        root.id,
        mMap,
        childrenMap,
        taskMap,
        0,
        yOffset,
        counter,
        totalSteps,
        accentColor
      );
      allNodes.push(...res.nodes);
      yOffset += res.height + V_GAP * 2;
    }

    const edges: Edge[] = milestones
      .filter((m) => m.parent_milestone_id !== null)
      .map((m) => {
        const parentStatus = mMap.get(m.parent_milestone_id!)?.status;
        const isDone = parentStatus === "completed";
        const isActive =
          m.status === "in_progress" || parentStatus === "in_progress";
        const isLocked = m.status === "locked" && parentStatus === "locked";

        return {
          id: `e-${m.parent_milestone_id}-${m.id}`,
          source: m.parent_milestone_id!,
          target: m.id,
          type: "smoothstep",
          animated: isActive,
          style: {
            stroke: isDone
              ? "#fbbf24"
              : isActive
                ? accentColor || "#22d3ee"
                : isLocked
                  ? "rgba(100,116,139,0.2)"
                  : "rgba(148,163,184,0.35)",
            strokeWidth: isDone ? 4 : isActive ? 3.5 : 2,
            strokeLinecap: "round" as const,
          },
        };
      });

    return { nodes: allNodes, edges };
  }, [milestones, tasks, accentColor]);
}
