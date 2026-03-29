import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { Goal, Milestone, Task } from "@/types/database";
import type { MilestoneNodeData } from "@/components/features/milestone-node";
import type { HubNodeData } from "@/components/features/hub-node";
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";

const NODE_W = 410;
const NODE_H = 240;
const RADIUS_STEP = 480;
const HUB_ID = "central-user-hub";

export function useRadialGraph(
  milestones: Milestone[],
  tasks: Task[],
  categoryStats: { completionPercent: number }[],
  goals: Goal[]
) {
  return useMemo(() => {
    if (milestones.length === 0) return { nodes: [], edges: [] };

    const mMap = new Map(milestones.map((m) => [m.id, m]));
    const goalMap = new Map(goals.map((g) => [g.id, g]));
    const taskMap = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!taskMap.has(t.milestone_id)) taskMap.set(t.milestone_id, []);
      taskMap.get(t.milestone_id)!.push(t);
    }

    function catColor(goalId: string): string {
      const g = goalMap.get(goalId);
      const cat = g?.category ?? "personal";
      return CATEGORY_CONFIG[cat]?.ring || "#60a5fa";
    }

    const childrenMap = new Map<string | null, Milestone[]>();
    for (const m of milestones) {
      const pid = m.parent_milestone_id;
      if (!childrenMap.has(pid)) childrenMap.set(pid, []);
      childrenMap.get(pid)!.push(m);
    }
    for (const c of childrenMap.values()) {
      c.sort((a, b) => a.order_index - b.order_index);
    }

    const roots = childrenMap.get(null) ?? [];
    roots.sort((a, b) => a.id.localeCompare(b.id));

    const totalRoots = roots.length;
    const angleStep = (2 * Math.PI) / totalRoots;

    const allNodes: Node[] = [];
    const edges: Edge[] = [];

    let totalCompletedTasks = 0;
    let totalMilestonesCompleted = 0;
    for (const [, ts] of taskMap) {
      totalCompletedTasks += ts.filter((t) => t.completed).length;
    }
    for (const m of milestones) {
      if (m.status === "completed") totalMilestonesCompleted++;
    }
    const totalXP = totalCompletedTasks * 10 + totalMilestonesCompleted * 50;
    const level = Math.floor(totalXP / 100) + 1;

    const avgCompletion = categoryStats.length
      ? Math.round(
          categoryStats.reduce((s, cs) => s + cs.completionPercent, 0) /
            categoryStats.length
        )
      : 0;

    allNodes.push({
      id: HUB_ID,
      type: "hub",
      position: { x: -60, y: -60 },
      data: {
        completionPercent: avgCompletion,
        totalXP,
        level,
      } satisfies HubNodeData,
    });

    let step = 0;

    function layoutRadialSubtree(
      milestoneId: string,
      depth: number,
      angle: number
    ) {
      const m = mMap.get(milestoneId)!;
      const kids = childrenMap.get(milestoneId) ?? [];
      const mTasks = taskMap.get(milestoneId) ?? [];
      step += 1;

      const r = depth * RADIUS_STEP;
      const x = r * Math.cos(angle) - NODE_W / 2;
      const y = r * Math.sin(angle) - NODE_H / 2;
      const accent = catColor(m.goal_id);

      allNodes.push({
        id: milestoneId,
        type: "milestone",
        position: { x, y },
        data: {
          label: m.title,
          description: m.description,
          status: m.status,
          taskCount: mTasks.length,
          completedTaskCount: mTasks.filter((t) => t.completed).length,
          accentColor: accent,
          stepIndex: step,
          totalSteps: milestones.length,
        } satisfies MilestoneNodeData,
      });

      if (kids.length > 0) {
        const spread = Math.PI / (8 * depth);
        const start = angle - (spread * (kids.length - 1)) / 2;
        kids.forEach((child, i) => {
          const childAngle =
            kids.length === 1 ? angle : start + i * spread;
          layoutRadialSubtree(child.id, depth + 1, childAngle);
        });
      }
    }

    roots.forEach((root, i) => {
      const angle = i * angleStep - Math.PI / 2;
      layoutRadialSubtree(root.id, 1, angle);
      const accent = catColor(root.goal_id);

      edges.push({
        id: `e-${HUB_ID}-${root.id}`,
        source: HUB_ID,
        target: root.id,
        type: "bezier",
        animated: true,
        style: {
          stroke: accent,
          strokeWidth: 3,
          opacity: 0.7,
          strokeLinecap: "round" as const,
        },
      });
    });

    milestones
      .filter((m) => m.parent_milestone_id !== null)
      .forEach((m) => {
        const parentStatus = mMap.get(m.parent_milestone_id!)?.status;
        const isDone = parentStatus === "completed";
        const isActive =
          m.status === "in_progress" || parentStatus === "in_progress";
        const accent = catColor(m.goal_id);

        edges.push({
          id: `e-${m.parent_milestone_id}-${m.id}`,
          source: m.parent_milestone_id!,
          target: m.id,
          type: "bezier",
          animated: isActive,
          style: {
            stroke: isDone
              ? "#fbbf24"
              : isActive
                ? accent
                : "rgba(148,163,184,0.25)",
            strokeWidth: isDone ? 4 : isActive ? 3 : 2,
            strokeLinecap: "round" as const,
          },
        });
      });

    return { nodes: allNodes, edges };
  }, [milestones, tasks, categoryStats, goals]);
}
