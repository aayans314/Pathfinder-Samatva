import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { Milestone, Task } from "@/types/database";
import type { MilestoneNodeData } from "@/components/features/milestone-node";
import type { HubNodeData } from "@/components/features/hub-node";
import { CATEGORY_CONFIG } from "@/components/features/life-section-card";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 140;

// Radial layout config
const RADIUS_STEP = 340; // distance between concentric rings
const HUB_ID = "central-user-hub";

export function useRadialGraph(
  milestones: Milestone[],
  tasks: Task[],
  categoryStats: any[]
) {
  return useMemo(() => {
    if (milestones.length === 0) {
      return { nodes: [], edges: [] };
    }

    const milestoneMap = new Map(milestones.map((m) => [m.id, m]));
    const tasksByMilestone = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!tasksByMilestone.has(t.milestone_id)) {
        tasksByMilestone.set(t.milestone_id, []);
      }
      tasksByMilestone.get(t.milestone_id)!.push(t);
    }

    // Build category trees
    // Step 1: Find roots (milestones with no parent) and group them by category
    const rootsByCategory = new Map<string, Milestone[]>();
    for (const m of milestones) {
      if (m.parent_milestone_id === null && m.goal_id) {
        // We need to figure out the category of this milestone.
        // It's attached to a goal, but we only have milestones here.
        // For simplicity in the radial layout, we will infer the category from the goal ID
        // (Assuming goal.category is known, we pass it down or deduce it. Since we don't pass goals into this hook directly right now,
        // we'll just group all roots together and distribute them evenly, then color them).
      }
    }

    // Since we need to know the category of each root to color the edges from the hub,
    // we actually need the goals. Let's adjust the algorithm:
    // We group ALL milestones by their root ancestor, and distribute the roots radially.

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
    
    // Sort roots by id to keep rotation stable
    roots.sort((a, b) => a.id.localeCompare(b.id));

    const totalRoots = roots.length;
    const angleStep = (2 * Math.PI) / totalRoots;

    const allNodes: Node[] = [];
    const edges: Edge[] = [];

    // 1. Calculate Hub Stats
    let totalCompletedTasks = 0;
    let totalMilestonesCompleted = 0;
    
    for (const [_, ts] of tasksByMilestone) {
      totalCompletedTasks += ts.filter(t => t.completed).length;
    }
    for (const m of milestones) {
      if (m.status === "completed") totalMilestonesCompleted++;
    }

    const totalXP = totalCompletedTasks * 10 + totalMilestonesCompleted * 50;
    const level = Math.floor(totalXP / 100) + 1;
    
    // Calculate overall completion percent from category stats
    const avgCompletion = categoryStats.length 
      ? Math.round(categoryStats.reduce((sum, cs) => sum + cs.completionPercent, 0) / categoryStats.length)
      : 0;

    // 2. Add Center Hub Node
    allNodes.push({
      id: HUB_ID,
      type: "hub",
      position: { x: -60, y: -60 }, // center the 120x120 hub at (0,0)
      data: {
        completionPercent: avgCompletion,
        totalXP,
        level,
      } satisfies HubNodeData,
    });

    // 3. Layout Trees Radially
    function layoutRadialSubtree(
      milestoneId: string,
      depth: number,
      angle: number
    ) {
      const milestone = milestoneMap.get(milestoneId)!;
      const children = childrenMap.get(milestoneId) ?? [];
      const mTasks = tasksByMilestone.get(milestoneId) ?? [];

      // Distance from center
      const r = depth * RADIUS_STEP;
      
      // Convert polar (r, angle) to cartesian (x, y)
      const x = r * Math.cos(angle) - NODE_WIDTH / 2;
      const y = r * Math.sin(angle) - NODE_HEIGHT / 2;

      // Extract category from goal ID prefix (mock data convention: goal-academics-1 -> "academics")
      const catMatch = milestone.goal_id.match(/goal-([^-]+)/);
      const categoryStr = catMatch ? catMatch[1] : "personal";
      
      // Safely get accent color Map
      const accentColor = CATEGORY_CONFIG[categoryStr as keyof typeof CATEGORY_CONFIG]?.ring || "#d1d5db";

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

      // Layout children (fan them out slightly if multiple, or keep straight line if 1)
      if (children.length > 0) {
        // If 1 child, keep same angle. If multiple, spread them slightly based on depth
        const spreadAngle = Math.PI / (8 * depth); // narrower spread as depth increases
        const startAngle = angle - (spreadAngle * (children.length - 1)) / 2;

        children.forEach((child, index) => {
          const childAngle = children.length === 1 ? angle : startAngle + index * spreadAngle;
          layoutRadialSubtree(child.id, depth + 1, childAngle);
        });
      }
    }

    // Position each root along the main circle
    roots.forEach((root, index) => {
      const angle = index * angleStep - Math.PI / 2; // start at top (-90 deg)
      
      layoutRadialSubtree(root.id, 1, angle);

      const catMatch = root.goal_id.match(/goal-([^-]+)/);
      const categoryStr = catMatch ? catMatch[1] : "personal";
      const accentColor = CATEGORY_CONFIG[categoryStr as keyof typeof CATEGORY_CONFIG]?.ring || "#d1d5db";

      // Edge from Hub to Root
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

    // Add standard tree edges
    milestones
      .filter((m) => m.parent_milestone_id !== null)
      .forEach((m) => {
        const parentStatus = milestoneMap.get(m.parent_milestone_id!)?.status;
        const isCompleted = parentStatus === "completed";
        const isActive = m.status === "in_progress" || parentStatus === "in_progress";

        const catMatch = m.goal_id.match(/goal-([^-]+)/);
        const categoryStr = catMatch ? catMatch[1] : "personal";
        const accentColor = CATEGORY_CONFIG[categoryStr as keyof typeof CATEGORY_CONFIG]?.ring || "#3b82f6";

        edges.push({
          id: `e-${m.parent_milestone_id}-${m.id}`,
          source: m.parent_milestone_id!,
          target: m.id,
          type: "bezier", // Softer curves for radial layout
          animated: isActive,
          style: {
            stroke: isCompleted ? "#f59e0b" : isActive ? accentColor : "#d1d5db",
            strokeWidth: isCompleted ? 3 : 2,
          },
        });
      });

    return { nodes: allNodes, edges };
  }, [milestones, tasks, categoryStats]);
}
