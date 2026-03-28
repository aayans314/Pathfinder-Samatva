"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Target,
  Milestone as MilestoneIcon,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGoalsByCategory, useStats, useTasks } from "@/hooks/use-goals";
import { GreetingWidget } from "@/components/features/greeting-widget";
import { DailyGoalsRing } from "@/components/features/daily-goals-ring";
import { LifeSectionCard } from "@/components/features/life-section-card";

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
    <Card className="border-border/50">
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
  const router = useRouter();
  const stats = useStats();
  const categoryStats = useGoalsByCategory();
  const allTasks = useTasks();

  const upcomingTasks = allTasks
    .filter((t) => !t.completed && t.due_date)
    .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <GreetingWidget />

      {/* Daily Goals + Stats */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <DailyGoalsRing />
        </div>
        <div className="lg:col-span-3 grid gap-4 sm:grid-cols-2 auto-rows-min">
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
      </div>

      {/* Life Sections Grid */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4">
          Your Life Sections
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categoryStats.map((cs) => (
            <LifeSectionCard
              key={cs.category}
              stats={cs}
              onClick={() =>
                router.push(`/my-path?category=${cs.category}`)
              }
            />
          ))}
        </div>
      </div>

      {/* Upcoming Tasks */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
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
                    <Badge
                      variant="outline"
                      className="text-xs shrink-0 ml-2"
                    >
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
  );
}
