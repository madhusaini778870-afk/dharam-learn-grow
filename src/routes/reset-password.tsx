import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password · Dharam Bhai Study" },
      {
        name: "description",
        content: "Choose a new password for your Dharam Bhai Study student account.",
      },
      { property: "og:title", content: "Set a new password · Dharam Bhai Study" },
      { property: "og:description", content: "Choose a new password for your student account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Use at least 6 characters for your password.");
      return;
    }
    if (password !== confirm) {
      setError("Both passwords must match.");
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(
        updateError.message.toLowerCase().includes("session")
          ? "This reset link has expired. Please request a new one from the sign-in screen."
          : updateError.message,
      );
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/home", replace: true }), 1200);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-background px-5 pt-12">
      <h1 className="font-display text-[26px] leading-tight">Set a new password</h1>
      <p className="mt-1.5 text-[13px] text-muted-foreground">
        Choose a password you'll remember. You'll stay signed in on this device.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-3">
        <label className="block rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            New password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="At least 6 characters"
          />
        </label>
        <label className="block rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Confirm password
          </span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Repeat the password"
          />
        </label>

        {error ? (
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-[12px] text-destructive">{error}</p>
        ) : null}
        {done ? (
          <p className="rounded-2xl bg-pine/10 px-4 py-3 text-[12px] text-pine">
            Password updated. Taking you to the app…
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="press w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>

      <p className="mt-auto py-8 text-center text-[11px] tracking-wide text-muted-foreground">
        Dharam Bhai Study · By Lakshya Prince
      </p>
    </main>
  );
}
