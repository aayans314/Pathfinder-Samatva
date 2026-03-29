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
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useGoals } from "@/hooks/use-goals";
import { PeerCard } from "@/components/features/peer-card";
import { createClient } from "@/lib/supabase/browser";
import { mockGoals as seedMockGoals } from "@/lib/mockData";
import type { User, Goal } from "@/types/database";

/** After login, the store only keeps the signed-in user's goals; seed peers still need template goals from mockData. */
function goalsForPeerUser(userId: string, storeGoals: Goal[]): Goal[] {
  const fromStore = storeGoals.filter((g) => g.user_id === userId);
  if (fromStore.length > 0) return fromStore;
  return seedMockGoals.filter((g) => g.user_id === userId);
}

interface PeerResult {
  user: User;
  sharedGoals: string[];
}

interface DiscoverPeer {
  user: User;
  overlapCategories: string[];
  sampleGoals: string[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
  const [discoverConnections, setDiscoverConnections] = useState<string[]>([]);
  const [discoverInvites, setDiscoverInvites] = useState<string[]>([]);

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
    const myCategories = new Set(myGoals.map((g) => g.category));
    const myTitlesLower = new Set(
      myGoals.map((g) => g.title.toLowerCase())
    );
    return optedInPeers
      .map((user) => {
        const peerGoals = goalsForPeerUser(user.id, storeGoals);
        const sharedGoals = [
          ...new Set(
            peerGoals
              .filter(
                (g) =>
                  myCategories.has(g.category) ||
                  myTitlesLower.has(g.title.toLowerCase())
              )
              .map((g) => g.title)
          ),
        ];
        return { user, sharedGoals };
      })
      .filter((p) => p.sharedGoals.length > 0)
      .sort((a, b) => b.sharedGoals.length - a.sharedGoals.length);
  }, [storeUsers, storeGoals, currentUserId, myGoals]);

  const peers = useMemo(() => {
    if (supabasePeers === null) return mockPeers;
    const merged = [...supabasePeers];
    const existingIds = new Set(merged.map((p) => p.user.id));
    for (const mock of mockPeers) {
      if (!existingIds.has(mock.user.id)) merged.push(mock);
    }
    return merged.sort((a, b) => b.sharedGoals.length - a.sharedGoals.length);
  }, [supabasePeers, mockPeers]);

  const filteredPeers = useMemo(() => {
    if (filter === "all") return peers;
    return peers.filter((p) => p.sharedGoals.includes(filter));
  }, [peers, filter]);

  const discoverPeers = useMemo<DiscoverPeer[]>(() => {
    const matchedPeerIds = new Set(peers.map((p) => p.user.id));
    const myCategories = new Set(myGoals.map((g) => g.category));

    return storeUsers
      .filter(
        (u) =>
          u.id !== currentUserId &&
          u.opt_in_matching &&
          !matchedPeerIds.has(u.id)
      )
      .map((user) => {
        const theirGoals = goalsForPeerUser(user.id, storeGoals);
        const overlapCategories = Array.from(
          new Set(
            theirGoals
              .filter((g) => myCategories.has(g.category))
              .map((g) => g.category)
          )
        );
        return {
          user,
          overlapCategories,
          sampleGoals: theirGoals.slice(0, 3).map((g) => g.title),
        };
      })
      .sort((a, b) => b.overlapCategories.length - a.overlapCategories.length);
  }, [peers, myGoals, storeUsers, storeGoals, currentUserId]);

  if (loading && supabasePeers === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Peer Connect</h1>
          <p className="text-base text-muted-foreground mt-1">
            {filteredPeers.length} people with meaningful path overlap
          </p>
        </div>

        {myGoalTitles.size > 0 && (
          <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
            <SelectTrigger className="w-56 h-11 text-base font-medium">
              <SelectValue placeholder="All Goals">
                {filter === "all" ? "All Goals" : filter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
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
        <div className="rounded-2xl glass-card border border-border/70 shadow-sm text-center py-16 px-6">
          <p className="text-base text-muted-foreground">
            No peer overlaps yet. Add clearer goals to unlock stronger matches.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {filteredPeers.map(({ user, sharedGoals }) => (
            <PeerCard key={user.id} user={user} sharedGoals={sharedGoals} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Discover Peers</h2>
          <p className="text-base text-muted-foreground mt-1">
            Meet people beyond exact overlap and build your support circle.
          </p>
        </div>

        {discoverPeers.length === 0 ? (
          <div className="rounded-2xl glass-card border border-border/70 shadow-sm py-6 px-4 text-base text-muted-foreground">
            No additional peers to discover right now.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {discoverPeers.map((discoverPeer) => {
              const requested = discoverConnections.includes(discoverPeer.user.id);
              const invited = discoverInvites.includes(discoverPeer.user.id);

              return (
                <div key={discoverPeer.user.id} className="glass-card rounded-2xl border border-border/70 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {getInitials(discoverPeer.user.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold">{discoverPeer.user.name}</p>
                      {discoverPeer.user.target_visa && (
                        <p className="text-sm text-muted-foreground">
                          {discoverPeer.user.target_visa}
                        </p>
                      )}
                    </div>
                  </div>

                  {discoverPeer.user.bio && (
                    <p className="text-base text-muted-foreground line-clamp-2">
                      {discoverPeer.user.bio}
                    </p>
                  )}

                  {discoverPeer.overlapCategories.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1.5">
                        Similar Categories
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {discoverPeer.overlapCategories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="text-sm bg-muted px-2 py-0.5 rounded-md capitalize"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {discoverPeer.sampleGoals.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Exploring: {discoverPeer.sampleGoals.slice(0, 2).join(", ")}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="default"
                      className="w-full"
                      onClick={() =>
                        setDiscoverConnections((prev) =>
                          prev.includes(discoverPeer.user.id)
                            ? prev
                            : [...prev, discoverPeer.user.id]
                        )
                      }
                      disabled={requested}
                    >
                      {requested ? "Request Sent" : "Connect"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="default"
                      className="w-full"
                      onClick={() =>
                        setDiscoverInvites((prev) =>
                          prev.includes(discoverPeer.user.id)
                            ? prev
                            : [...prev, discoverPeer.user.id]
                        )
                      }
                      disabled={invited}
                    >
                      {invited ? "Invite Sent" : "Invite to Group"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
