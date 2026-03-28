"use client";

import { useMemo, useState } from "react";
import { Users, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { useGoals } from "@/hooks/use-goals";
import { PeerCard } from "@/components/features/peer-card";

export default function PeersPage() {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const allUsers = useAppStore((s) => s.users);
  const allGoals = useAppStore((s) => s.goals);
  const myGoals = useGoals();
  const [filter, setFilter] = useState<string>("all");

  const myGoalTitles = useMemo(
    () => new Set(myGoals.map((g) => g.title)),
    [myGoals]
  );

  const peers = useMemo(() => {
    const optedInPeers = allUsers.filter(
      (u) => u.id !== currentUserId && u.opt_in_matching
    );

    return optedInPeers
      .map((user) => {
        const peerGoals = allGoals.filter((g) => g.user_id === user.id);
        const sharedGoals = peerGoals
          .filter((g) => myGoalTitles.has(g.title))
          .map((g) => g.title);
        return { user, sharedGoals };
      })
      .filter((p) => p.sharedGoals.length > 0)
      .sort((a, b) => b.sharedGoals.length - a.sharedGoals.length);
  }, [allUsers, allGoals, currentUserId, myGoalTitles]);

  const filteredPeers = useMemo(() => {
    if (filter === "all") return peers;
    return peers.filter((p) => p.sharedGoals.includes(filter));
  }, [peers, filter]);

  const visaGroups = useMemo(() => {
    const groups = new Map<string, number>();
    for (const { user } of peers) {
      const visa = user.target_visa ?? "Unspecified";
      groups.set(visa, (groups.get(visa) ?? 0) + 1);
    }
    return groups;
  }, [peers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Peers</h1>
          <p className="text-muted-foreground">
            Connect with others who share your goals and visa journey.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filter by shared goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shared Goals</SelectItem>
              {Array.from(myGoalTitles).map((title) => (
                <SelectItem key={title} value={title}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {filteredPeers.length} peer{filteredPeers.length !== 1 ? "s" : ""} found
        </Badge>
        {Array.from(visaGroups).map(([visa, count]) => (
          <Badge key={visa} variant="outline" className="text-xs">
            {visa}: {count}
          </Badge>
        ))}
      </div>

      {filteredPeers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No peers found</h3>
          <p className="text-sm text-muted-foreground max-w-sm text-center">
            No opted-in users share your current goals. As more people join and
            opt in to matching, peers will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPeers.map(({ user, sharedGoals }) => (
            <PeerCard
              key={user.id}
              user={user}
              sharedGoals={sharedGoals}
              allGoals={allGoals}
            />
          ))}
        </div>
      )}
    </div>
  );
}
