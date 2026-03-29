"use client";

import { useState, useEffect } from "react";
import { useCurrentUser, useStats } from "@/hooks/use-goals";
import { createClient } from "@/lib/supabase/browser";
import { format } from "date-fns";

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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
      <p className="text-lg text-muted-foreground">{today}</p>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">
        {timeGreeting()}, {firstName}
      </h1>
      {stats.completionPercent > 0 && (
        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-xs">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${stats.completionPercent}%` }}
            />
          </div>
          <span className="text-base text-muted-foreground tabular-nums">
            {stats.completionPercent}% overall
          </span>
        </div>
      )}
    </div>
  );
}
