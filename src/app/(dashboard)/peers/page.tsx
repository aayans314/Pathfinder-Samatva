"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { useGoals } from "@/hooks/use-goals";
import { PeerCard } from "@/components/features/peer-card";
import { createClient } from "@/lib/supabase/browser";
import type { User, Goal } from "@/types/database";

interface PeerResult {
  user: User;
  sharedGoals: string[];
}

export default function PeersPage() {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const storeUsers = useAppStore((s) => s.users);
  const storeGoals = useAppStore((s) => s.goals);
  const myGoals = useGoals();
  const [filter, setFilter] = useState<string>("all");
  const [supabasePeers, setSupabasePeers] = useState<PeerResult[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPeers() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("opt_in_matching", true)
        .neq("id", user.id);

      if (!profiles || profiles.length === 0) {
        setSupabasePeers([]);
        setLoading(false);
        return;
      }

      const peerIds = profiles.map((p) => p.id);
      const { data: peerGoals } = await supabase
        .from("goals")
        .select("*")
        .in("user_id", peerIds);

      const myGoalCategories = new Set(myGoals.map((g) => g.category));
      const myGoalTitlesLower = new Set(
        myGoals.map((g) => g.title.toLowerCase())
      );

      const results: PeerResult[] = profiles
        .map((profile) => {
          const theirGoals = (peerGoals || []).filter(
            (g: Goal) => g.user_id === profile.id
          );
          const shared = theirGoals
            .filter(
              (g: Goal) =>
                myGoalCategories.has(g.category) ||
                myGoalTitlesLower.has(g.title.toLowerCase())
            )
            .map((g: Goal) => g.title);

          return {
            user: {
              id: profile.id,
              name: profile.name,
              bio: profile.bio,
              target_visa: profile.target_visa,
              opt_in_matching: profile.opt_in_matching,
              created_at: profile.created_at,
            },
            sharedGoals: [...new Set(shared)],
          };
        })
        .filter((p) => p.sharedGoals.length > 0)
        .sort((a, b) => b.sharedGoals.length - a.sharedGoals.length);

      setSupabasePeers(results);
      setLoading(false);
    }

    loadPeers();
  }, [myGoals]);

  const myGoalTitles = useMemo(
    () => new Set(myGoals.map((g) => g.title)),
    [myGoals]
  );

  const mockPeers = useMemo(() => {
    const optedInPeers = storeUsers.filter(
      (u) => u.id !== currentUserId && u.opt_in_matching
    );
    return optedInPeers
      .map((user) => {
        const peerGoals = storeGoals.filter((g) => g.user_id === user.id);
        const sharedGoals = peerGoals
          .filter((g) => myGoalTitles.has(g.title))
          .map((g) => g.title);
        return { user, sharedGoals };
      })
      .filter((p) => p.sharedGoals.length > 0)
      .sort((a, b) => b.sharedGoals.length - a.sharedGoals.length);
  }, [storeUsers, storeGoals, currentUserId, myGoalTitles]);

  const peers = supabasePeers ?? mockPeers;

  const filteredPeers = useMemo(() => {
    if (filter === "all") return peers;
    return peers.filter((p) => p.sharedGoals.includes(filter));
  }, [peers, filter]);

  if (loading && supabasePeers === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Peers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredPeers.length} people sharing your goals
          </p>
        </div>

        {myGoalTitles.size > 0 && (
          <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All goals</SelectItem>
              {Array.from(myGoalTitles).map((title) => (
                <SelectItem key={title} value={title}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filteredPeers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">
            No peers found with matching goals yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPeers.map(({ user, sharedGoals }) => (
            <PeerCard
              key={user.id}
              user={user}
              sharedGoals={sharedGoals}
              allGoals={storeGoals}
            />
          ))}
        </div>
      )}
    </div>
  );
}
