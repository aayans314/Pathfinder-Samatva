"use client";

import { useMemo, useState } from "react";
import type { User } from "@/types/database";
import { Button } from "@/components/ui/button";

interface PeerCardProps {
  user: User;
  sharedGoals: string[];
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
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [connectionRequested, setConnectionRequested] = useState(false);
  const [groupInviteSent, setGroupInviteSent] = useState(false);
  const pathMatchPercent = useMemo(() => {
    const capped = Math.min(sharedGoals.length * 22, 95);
    return Math.max(capped, sharedGoals.length > 0 ? 35 : 0);
  }, [sharedGoals.length]);

  const icebreaker = `Hey ${user.name.split(" ")[0]}, noticed we share milestones around ${sharedGoals.slice(0, 2).join(" and ")}. Want to swap one tactic that helped this month?`;

  return (
    <div className="glass-card rounded-2xl border border-border/70 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
          {getInitials(user.name)}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold">{user.name}</p>
          {user.target_visa && (
            <p className="text-sm text-muted-foreground">{user.target_visa}</p>
          )}
        </div>
        <span className="ml-auto rounded-full border border-cyan-300/35 bg-cyan-500/10 px-2.5 py-1 text-sm font-semibold text-primary">
          {pathMatchPercent}% path match
        </span>
      </div>

      {user.bio && (
        <p className="text-base text-muted-foreground line-clamp-2">{user.bio}</p>
      )}

      {sharedGoals.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1.5">Shared goals</p>
          <div className="flex flex-wrap gap-1">
            {sharedGoals.map((goalTitle) => (
              <span
                key={goalTitle}
                className="text-sm bg-muted px-2 py-0.5 rounded-md"
              >
                {goalTitle}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="default"
            className="w-full"
            onClick={() => setConnectionRequested(true)}
            disabled={connectionRequested}
          >
            {connectionRequested ? "Request Sent" : "Connect"}
          </Button>
          <Button
            variant="secondary"
            size="default"
            className="w-full"
            onClick={() => setGroupInviteSent(true)}
            disabled={groupInviteSent}
          >
            {groupInviteSent ? "Invite Sent" : "Invite to Group"}
          </Button>
        </div>
        <Button
          variant="outline"
          size="default"
          className="w-full border-cyan-300/35 text-base text-foreground hover:bg-cyan-500/10"
          onClick={() => setShowIcebreaker((prev) => !prev)}
        >
          Connect with AI icebreaker
        </Button>
        {showIcebreaker && (
          <p className="text-sm text-foreground/90 rounded-lg border border-cyan-300/25 bg-cyan-500/10 px-3 py-2 leading-relaxed">
            {icebreaker}
          </p>
        )}
      </div>
    </div>
  );
}
