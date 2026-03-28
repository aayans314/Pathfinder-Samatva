import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { Goal, Milestone, Task } from "@/types/database";
import type { MilestoneNodeData } from "@/components/features/milestone-node";
import type { HubNodeData } from "@/components/features/hub-node";
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 140;

const RADIUS_STEP = 340;
const HUB_ID = "central-user-hub";

export function useRadialGraph(
  milestones: Milestone[],
  tasks: Task[],
  categoryStats: { completionPercent: number }[],
  goals: Goal[]
) {
  return useMemo(() => {
    if (milestones.length === 0) {
      return { nodes: [], edges: [] };
    }

    const milestoneMap = new Map(milestones.map((m) => [m.id, m]));
    const goalMap = new Map(goals.map((g) => [g.id, g]));
    const tasksByMilestone = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!tasksByMilestone.has(t.milestone_id)) {
        tasksByMilestone.set(t.milestone_id, []);
      }
      tasksByMilestone.get(t.milestone_id)!.push(t);
    }

    function getCategoryColor(goalId: string): string {
      const goal = goalMap.get(goalId);
      const cat = goal?.category ?? "personal";
      return CATEGORY_CONFIG[cat]?.ring || "#d1d5db";
    }

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

    const roots = childrenMap.get(null) ?? [];
    roots.sort((a, b) => a.id.localeCompare(b.id));

    const totalRoots = roots.length;
    const angleStep = (2 * Math.PI) / totalRoots;

    const allNodes: Node[] = [];
    const edges: Edge[] = [];

    let totalCompletedTasks = 0;
    let totalMilestonesCompleted = 0;

    for (const [, ts] of tasksByMilestone) {
      totalCompletedTasks += ts.filter(t => t.completed).length;
    }
    for (const m of milestones) {
      if (m.status === "completed") totalMilestonesCompleted++;
    }

    const totalXP = totalCompletedTasks * 10 + totalMilestonesCompleted * 50;
    const level = Math.floor(totalXP / 100) + 1;

    const avgCompletion = categoryStats.length
      ? Math.round(categoryStats.reduce((sum, cs) => sum + cs.completionPercent, 0) / categoryStats.length)
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

    function layoutRadialSubtree(
      milestoneId: string,
      depth: number,
      angle: number
    ) {
      const milestone = milestoneMap.get(milestoneId)!;
      const children = childrenMap.get(milestoneId) ?? [];
      const mTasks = tasksByMilestone.get(milestoneId) ?? [];

      const r = depth * RADIUS_STEP;
      const x = r * Math.cos(angle) - NODE_WIDTH / 2;
      const y = r * Math.sin(angle) - NODE_HEIGHT / 2;

      const accentColor = getCategoryColor(milestone.goal_id);

      allNodes.push({
        id: milestoneId,
        type: "milestone",
        position: { x, y },
        data: {
          label: milestone.title,
          description: milestone.description,
          status: milestone.status,
          taskCount: mTasks.length,
          completedTaskCount: mTasks.filter((t) => t.completed).length,
          accentColor,
        } satisfies MilestoneNodeData,
      });

      if (children.length > 0) {
        const spreadAngle = Math.PI / (8 * depth);
        const startAngle = angle - (spreadAngle * (children.length - 1)) / 2;

        children.forEach((child, index) => {
          const childAngle = children.length === 1 ? angle : startAngle + index * spreadAngle;
          layoutRadialSubtree(child.id, depth + 1, childAngle);
        });
      }
    }

    roots.forEach((root, index) => {
      const angle = index * angleStep - Math.PI / 2;
      layoutRadialSubtree(root.id, 1, angle);

      const accentColor = getCategoryColor(root.goal_id);

      edges.push({
        id: `e-${HUB_ID}-${root.id}`,
        source: HUB_ID,
        target: root.id,
        type: "bezier",
        animated: true,
        style: {
          stroke: accentColor,
          strokeWidth: 2,
          opacity: 0.6,
        },
      });
    });

    milestones
      .filter((m) => m.parent_milestone_id !== null)
      .forEach((m) => {
        const parentStatus = milestoneMap.get(m.parent_milestone_id!)?.status;
        const isCompleted = parentStatus === "completed";
        const isActive = m.status === "in_progress" || parentStatus === "in_progress";

        const accentColor = getCategoryColor(m.goal_id);

        edges.push({
          id: `e-${m.parent_milestone_id}-${m.id}`,
          source: m.parent_milestone_id!,
          target: m.id,
          type: "bezier",
          animated: isActive,
          style: {
            stroke: isCompleted ? "#f59e0b" : isActive ? accentColor : "#d1d5db",
            strokeWidth: isCompleted ? 3 : 2,
          },
        });
      });

    return { nodes: allNodes, edges };
  }, [milestones, tasks, categoryStats, goals]);
}
