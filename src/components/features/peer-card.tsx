"use client";

import type { User, Goal } from "@/types/database";

interface PeerCardProps {
  user: User;
  sharedGoals: string[];
  allGoals: Goal[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PeerCard({ user, sharedGoals }: PeerCardProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
          {getInitials(user.name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{user.name}</p>
          {user.target_visa && (
            <p className="text-xs text-muted-foreground">{user.target_visa}</p>
          )}
        </div>
      </div>

      {user.bio && (
        <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
      )}

      {sharedGoals.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Shared goals</p>
          <div className="flex flex-wrap gap-1">
            {sharedGoals.map((goalTitle) => (
              <span
                key={goalTitle}
                className="text-xs bg-muted px-2 py-0.5 rounded-md"
              >
                {goalTitle}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
