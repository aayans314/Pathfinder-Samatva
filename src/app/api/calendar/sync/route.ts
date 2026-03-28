import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
}

interface FreeSlot {
  start: string;
  end: string;
  durationMinutes: number;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: connection } = await supabase
      .from("calendar_connections")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: "No calendar connected. Connect Google Calendar in Settings." },
        { status: 404 }
      );
    }

    let accessToken = connection.access_token;

    // Refresh token if expired
    if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          refresh_token: connection.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!tokenRes.ok) {
        return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 });
      }

      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token;

      await supabase
        .from("calendar_connections")
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        })
        .eq("id", connection.id);
    }

    // Fetch events for the current week
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        new URLSearchParams({
          timeMin: now.toISOString(),
          timeMax: weekEnd.toISOString(),
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "50",
        }),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!calRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch calendar events" },
        { status: 502 }
      );
    }

    const calData = await calRes.json();

    const events: CalendarEvent[] = (calData.items || [])
      .filter((e: { start?: { dateTime?: string } }) => e.start?.dateTime)
      .map((e: { summary?: string; start: { dateTime: string }; end: { dateTime: string } }) => ({
        summary: e.summary || "Busy",
        start: e.start.dateTime,
        end: e.end.dateTime,
      }));

    // Calculate free time slots (9am-9pm each day, minus events)
    const freeSlots: FreeSlot[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(now);
      day.setDate(day.getDate() + d);
      day.setHours(9, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(21, 0, 0, 0);

      const dayEvents = events
        .filter((e) => {
          const eStart = new Date(e.start);
          return eStart >= day && eStart < dayEnd;
        })
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      let cursor = day.getTime();
      for (const event of dayEvents) {
        const eventStart = new Date(event.start).getTime();
        if (eventStart > cursor) {
          const durationMinutes = (eventStart - cursor) / (1000 * 60);
          if (durationMinutes >= 30) {
            freeSlots.push({
              start: new Date(cursor).toISOString(),
              end: new Date(eventStart).toISOString(),
              durationMinutes: Math.round(durationMinutes),
            });
          }
        }
        cursor = Math.max(cursor, new Date(event.end).getTime());
      }

      if (cursor < dayEnd.getTime()) {
        const durationMinutes = (dayEnd.getTime() - cursor) / (1000 * 60);
        if (durationMinutes >= 30) {
          freeSlots.push({
            start: new Date(cursor).toISOString(),
            end: dayEnd.toISOString(),
            durationMinutes: Math.round(durationMinutes),
          });
        }
      }
    }

    return NextResponse.json({
      events,
      freeSlots,
      totalFreeMinutes: freeSlots.reduce((sum, s) => sum + s.durationMinutes, 0),
    });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
