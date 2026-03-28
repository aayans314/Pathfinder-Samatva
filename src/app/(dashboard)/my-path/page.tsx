"use client";

import { useState, useCallback } from "react";
import { useGoals, useMilestones, useTasks } from "@/hooks/use-goals";
import { MilestoneFlow } from "@/components/features/milestone-flow";
import { MilestoneDetailPanel } from "@/components/features/milestone-detail-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function MyPathPage() {
  const goals = useGoals();
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    null
  );

  const milestones = useMilestones(
    selectedGoalId === "all" ? undefined : selectedGoalId
  );
  const tasks = useTasks();

  const filteredTasks = tasks.filter((t) =>
    milestones.some((m) => m.id === t.milestone_id)
  );

  const handleNodeClick = useCallback((milestoneId: string) => {
    setSelectedMilestoneId((prev) =>
      prev === milestoneId ? null : milestoneId
    );
  }, []);

  const completedCount = milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const inProgressCount = milestones.filter(
    (m) => m.status === "in_progress"
  ).length;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Path</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default">{completedCount} completed</Badge>
            <Badge variant="secondary">{inProgressCount} in progress</Badge>
            <Badge variant="outline">
              {milestones.length - completedCount - inProgressCount} locked
            </Badge>
          </div>
        </div>

        <Select value={selectedGoalId} onValueChange={(v) => setSelectedGoalId(v ?? "all")}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by goal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Goals</SelectItem>
            {goals.map((goal) => (
              <SelectItem key={goal.id} value={goal.id}>
                {goal.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 relative rounded-lg border bg-muted/30 overflow-hidden">
        <MilestoneFlow
          milestones={milestones}
          tasks={filteredTasks}
          onNodeClick={handleNodeClick}
        />
        {selectedMilestoneId && (
          <MilestoneDetailPanel
            milestoneId={selectedMilestoneId}
            onClose={() => setSelectedMilestoneId(null)}
          />
        )}
      </div>
    </div>
  );
}
