"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/browser";

interface ProfileData {
  name: string;
  bio: string;
  target_visa: string;
  opt_in_matching: boolean;
  reminder_enabled: boolean;
  reminder_time: string;
}

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifPerm, setNotifPerm] = useState<
    NotificationPermission | "unsupported"
  >(
    typeof Notification !== "undefined"
      ? Notification.permission
      : "unsupported"
  );

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    bio: "",
    target_visa: "",
    opt_in_matching: false,
    reminder_enabled: false,
    reminder_time: "09:00",
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          name: data.name || "",
          bio: data.bio || "",
          target_visa: data.target_visa || "",
          opt_in_matching: data.opt_in_matching ?? false,
          reminder_enabled: data.reminder_enabled ?? false,
          reminder_time: data.reminder_time || "09:00",
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const requestBrowserNotification = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const r = await Notification.requestPermission();
    setNotifPerm(r);
  }, []);

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").update({
      name: profile.name,
      bio: profile.bio || null,
      target_visa: profile.target_visa || null,
      opt_in_matching: profile.opt_in_matching,
      reminder_enabled: profile.reminder_enabled,
      reminder_time: profile.reminder_time,
    }).eq("id", user.id);

    if (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to save settings. Please try again.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-base text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Your public profile information visible to peers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell other users about yourself..."
              className="resize-none h-20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="visa">Target Visa / Status</Label>
            <Input
              id="visa"
              value={profile.target_visa}
              onChange={(e) => setProfile((p) => ({ ...p, target_visa: e.target.value }))}
              placeholder="e.g. H-1B, OPT, Green Card"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Peer Matching</CardTitle>
          <CardDescription>Control whether other users can discover you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Checkbox
              id="opt-in"
              checked={profile.opt_in_matching}
              onCheckedChange={(checked) =>
                setProfile((p) => ({ ...p, opt_in_matching: Boolean(checked) }))
              }
            />
            <Label htmlFor="opt-in" className="text-base cursor-pointer">
              Allow other users to find me based on shared goals
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Reminders</CardTitle>
          <CardDescription>Get nudged to stay on track with your goals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="reminder"
              checked={profile.reminder_enabled}
              onCheckedChange={(checked) =>
                setProfile((p) => ({ ...p, reminder_enabled: Boolean(checked) }))
              }
            />
            <Label htmlFor="reminder" className="text-base cursor-pointer">
              Enable daily reminders
            </Label>
          </div>
          {profile.reminder_enabled && (
            <div className="space-y-2 pl-7">
              <Label htmlFor="reminder-time">Preferred reminder time</Label>
              <Input
                id="reminder-time"
                type="time"
                value={profile.reminder_time}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, reminder_time: e.target.value }))
                }
                className="w-40"
              />
              <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                Saving stores your preference. For nudges in the browser, also allow{" "}
                <strong>notifications</strong> below (works while Pathfinder is open).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Browser notifications
          </CardTitle>
          <CardDescription>
            Daily nudge at your reminder time with your top focus task.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base text-muted-foreground">
            {notifPerm === "unsupported"
              ? "This browser does not support notifications."
              : notifPerm === "granted"
                ? "Notifications are enabled for this browser."
                : notifPerm === "denied"
                  ? "Notifications were blocked. Change site settings for this origin in your browser."
                  : "Allow notifications for one daily nudge when the dashboard is open."}
          </p>
          {notifPerm !== "unsupported" && notifPerm !== "denied" && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void requestBrowserNotification()}
              disabled={notifPerm === "granted"}
            >
              {notifPerm === "granted" ? "Already enabled" : "Allow browser notifications"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Google Calendar (roadmap)</CardTitle>
          <CardDescription>
            Full two-way sync needs Google OAuth and stored tokens. Use the .ics export on Home
            today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-base text-muted-foreground leading-relaxed">
            Export your top focus as a calendar file from the Home dashboard and import it into
            Google Calendar.
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save Settings
      </Button>
    </div>
  );
}
