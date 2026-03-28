"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
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

const avatarColors = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
];

function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function PeerCard({ user, sharedGoals, allGoals }: PeerCardProps) {
  const userGoals = allGoals.filter((g) => g.user_id === user.id);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className={hashColor(user.id)}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{user.name}</p>
            {user.target_visa && (
              <Badge variant="outline" className="text-[10px] mt-0.5">
                {user.target_visa}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {user.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {user.bio}
          </p>
        )}

        {sharedGoals.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Shared Goals
            </p>
            <div className="flex flex-wrap gap-1">
              {sharedGoals.map((goalTitle) => (
                <Badge key={goalTitle} variant="secondary" className="text-xs">
                  {goalTitle}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {userGoals.length > sharedGoals.length && (
          <p className="text-xs text-muted-foreground">
            +{userGoals.length - sharedGoals.length} other goal
            {userGoals.length - sharedGoals.length > 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
