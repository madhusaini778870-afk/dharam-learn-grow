import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Dharam Bhai Study" },
      {
        name: "description",
        content: "Create your Dharam Bhai Study student account or sign in to continue learning.",
      },
      { property: "og:title", content: "Sign in · Dharam Bhai Study" },
      { property: "og:description", content: "Create a student account or sign in to continue learning." },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/home", replace: true });
  }, [session, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: name },
        },
      });
      if (signUpError) setError(signUpError.message);
      else if (!data.session)
        setNotice("Check your email and tap the confirmation link to finish creating your account.");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
    }
    setBusy(false);
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in could not be completed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/home", replace: true });
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-[520px] flex-col overflow-hidden bg-background px-5 pt-10">
      <div className="pointer-events-none absolute -top-24 right-[-70px] size-64 rounded-full bg-lamp/15 blur-2xl" />

      <div className="relative">
        <div className="grid size-11 place-items-center rounded-2xl bg-foreground">
          <span className="font-display text-xl leading-none text-background">D</span>
        </div>
        <h1 className="mt-5 font-display text-[28px] leading-tight">
          {mode === "signup" ? "Create your student account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {mode === "signup"
            ? "You'll start with zero enrolled courses."
            : "Sign in to reach your enrolled courses."}
        </p>
      </div>

      <form onSubmit={submit} className="relative mt-7 space-y-3">
        {mode === "signup" ? (
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Your full name"
            />
          </Field>
        ) : null}
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="At least 6 characters"
          />
        </Field>

        {error ? (
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-[12px] text-destructive">{error}</p>
        ) : null}
        {notice ? (
          <p className="rounded-2xl bg-pine/10 px-4 py-3 text-[12px] text-pine">{notice}</p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="press w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="relative mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={google}
        className="press mt-5 w-full rounded-2xl bg-card py-3.5 text-sm font-semibold ring-1 ring-border"
      >
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
          setNotice(null);
        }}
        className="mt-6 text-[13px] text-muted-foreground"
      >
        {mode === "signup" ? (
          <>
            Already have an account? <span className="font-semibold text-lamp-deep">Sign in</span>
          </>
        ) : (
          <>
            New here? <span className="font-semibold text-lamp-deep">Create an account</span>
          </>
        )}
      </button>

      <p className="mt-auto py-8 text-center text-[11px] tracking-wide text-muted-foreground">
        Dharam Bhai Study · By Lakshya Prince
      </p>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
