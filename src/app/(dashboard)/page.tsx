"use client";

import { format } from "date-fns";
import {
  Target,
  Milestone as MilestoneIcon,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGoals, useStats, useTasks } from "@/hooks/use-goals";
import { TaskList } from "@/components/features/task-list";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const stats = useStats();
  const goals = useGoals();
  const allTasks = useTasks();

  const upcomingTasks = allTasks
    .filter((t) => !t.completed && t.due_date)
    .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your goals, milestones, and daily progress at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Goals"
          value={String(stats.activeGoals)}
          icon={Target}
        />
        <StatCard
          title="Milestones"
          value={`${stats.completedMilestones} / ${stats.totalMilestones}`}
          subtitle="completed"
          icon={MilestoneIcon}
        />
        <StatCard
          title="Tasks Completed"
          value={`${stats.completedTasks} / ${stats.totalTasks}`}
          icon={CheckCircle2}
        />
        <StatCard
          title="Next Deadline"
          value={
            stats.nextDeadline
              ? format(new Date(stats.nextDeadline), "MMM d, yyyy")
              : "None"
          }
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Task completion</span>
                <span className="font-medium">{stats.completionPercent}%</span>
              </div>
              <Progress value={stats.completionPercent} />
            </div>
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{goal.title}</span>
                  <Badge
                    variant={
                      goal.status === "active" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {goal.status}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  Due {format(new Date(goal.target_date), "MMM yyyy")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming tasks. You&apos;re all caught up!
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{task.title}</span>
                    {task.due_date && (
                      <Badge variant="outline" className="text-xs shrink-0 ml-2">
                        {format(new Date(task.due_date), "MMM d")}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TaskList />
    </div>
  );
}
