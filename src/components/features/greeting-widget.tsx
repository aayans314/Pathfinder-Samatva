"use client";

import { useState, useEffect } from "react";
import { useCurrentUser, useStats } from "@/hooks/use-goals";
import { createClient } from "@/lib/supabase/browser";
import { format } from "date-fns";

export function GreetingWidget() {
  const mockUser = useCurrentUser();
  const stats = useStats();
  const [displayName, setDisplayName] = useState(mockUser.name);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const name =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          mockUser.name;
        setDisplayName(name);
      }
    });
  }, [mockUser.name]);

  const firstName = displayName.split(" ")[0];
  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <div>
      <p className="text-sm text-muted-foreground">{today}</p>
      <h1 className="text-2xl font-semibold tracking-tight mt-0.5">
        Welcome back, {firstName}
      </h1>
      {stats.completionPercent > 0 && (
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-xs">
            <div
              className="h-full rounded-full bg-foreground/70 transition-all duration-700"
              style={{ width: `${stats.completionPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {stats.completionPercent}% overall
          </span>
        </div>
      )}
    </div>
  );
}
