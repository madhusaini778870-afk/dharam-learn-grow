import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Screen, Footer, PageHeader, ChevronRight } from "@/components/app-shell";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · Dharam Bhai Study" },
      {
        name: "description",
        content: "Your student profile, learning shortcuts, account settings and sign out.",
      },
      { property: "og:title", content: "Profile · Dharam Bhai Study" },
      { property: "og:description", content: "Your student profile, account settings and sign out." },
    ],
  }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const { session, loading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile.data?.full_name) setName(profile.data.full_name);
  }, [profile.data?.full_name]);

  async function save() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    await supabase.from("profiles").upsert({ id: user.id, full_name: name, email: user.email ?? null });
    setSaving(false);
    setSaved(true);
  }

  return (
    <Screen>
      <PageHeader title="Profile" />

      <div className="mt-4 space-y-3 px-5">
        <div className="rounded-3xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-foreground font-display text-xl text-background">
              {(name?.[0] ?? user?.email?.[0] ?? "S").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-display text-[18px] leading-tight">{name || "Student"}</p>
              <p className="truncate text-[12px] text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-4 ring-1 ring-border">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Account settings
          </p>
          <label className="mt-3 block">
            <span className="text-[11px] text-muted-foreground">Display name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-background px-3.5 py-2.5 text-sm outline-none ring-1 ring-border"
              placeholder="Your name"
            />
          </label>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="press mt-3 rounded-2xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </button>
        </div>

        <Link
          to="/my-learning"
          className="press flex items-center gap-3 rounded-3xl bg-card p-4 ring-1 ring-border"
        >
          <span className="flex-1 text-sm font-medium">My Learning</span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>

        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate({ to: "/auth", replace: true });
          }}
          className="press w-full rounded-3xl bg-card p-4 text-left text-sm font-semibold text-destructive ring-1 ring-border"
        >
          Log out
        </button>
      </div>
      <Footer />
    </Screen>
  );
}
