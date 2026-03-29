"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LIKE_MINDED_GROUPS_DUMMY } from "@/lib/like-minded-groups-dummy";
import { cn } from "@/lib/utils";

export default function LikeMindedGroupsPage() {
  const [joinedIds, setJoinedIds] = useState<string[]>([]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/peers"
            className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Peer Connect
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Like-Minded Groups
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Join mini groups based on overlapping goals and stay accountable.
            Below is sample data so you can see how discovery and joining will
            feel once your network grows.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {LIKE_MINDED_GROUPS_DUMMY.map((group) => {
          const joined = joinedIds.includes(group.id);
          return (
            <div
              key={group.id}
              className={cn(
                "group flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-md",
                "cursor-pointer transition-all duration-200 ease-out",
                "hover:scale-[1.03] hover:shadow-xl hover:border-primary/25",
                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold leading-snug line-clamp-2 tracking-tight">
                    {group.topic}
                  </p>
                  <p className="text-base text-muted-foreground mt-1.5">
                    {group.memberCount} members including you
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                  {group.tag}
                </span>
              </div>

              <p className="text-base text-muted-foreground leading-relaxed line-clamp-3 flex-1 mb-4">
                {group.description}
              </p>

              <div className="flex items-center gap-2 text-base text-muted-foreground mb-4">
                <Users className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">
                  {group.memberNames.slice(0, 3).join(", ")}
                  {group.memberNames.length > 3 ? "…" : ""}
                </span>
              </div>

              <div className="mt-auto flex flex-col gap-2 pointer-events-auto">
                <Button
                  nativeButton={false}
                  size="default"
                  variant="outline"
                  className="w-full text-base font-medium"
                  render={
                    <Link
                      href={`/task-roadmap?groupId=${encodeURIComponent(group.id)}`}
                    />
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  Do it
                </Button>
                <Button
                  size="default"
                  variant={joined ? "secondary" : "default"}
                  className="w-full text-base font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setJoinedIds((prev) =>
                      joined
                        ? prev.filter((id) => id !== group.id)
                        : [...prev, group.id]
                    );
                  }}
                >
                  {joined ? "Joined" : "Join Group"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
