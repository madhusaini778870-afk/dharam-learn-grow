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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthScreen,
});

type Mode = "signin" | "signup" | "forgot";

/** Turns backend messages into something a student can act on. */
function friendlyError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "That email and password don't match. Please check both and try again.";
  if (text.includes("email not confirmed")) return "Please confirm your email from the link we sent, then sign in.";
  if (text.includes("already registered") || text.includes("already been registered"))
    return "This email already has an account. Try signing in instead.";
  if (text.includes("password") && text.includes("weak")) return "Please choose a stronger password.";
  if (text.includes("pwned") || text.includes("compromised"))
    return "This password has appeared in known data leaks. Please choose a different one.";
  if (text.includes("rate limit") || text.includes("too many"))
    return "Too many attempts. Please wait a minute and try again.";
  if (text.includes("network") || text.includes("failed to fetch"))
    return "We couldn't reach the server. Check your connection and try again.";
  return message;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function AuthScreen() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/home", replace: true });
  }, [session, navigate]);

  function reset(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setConfirm("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!isEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (mode === "signup") {
      if (name.trim().length < 2) {
        setError("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setError("Your password needs at least 6 characters.");
        return;
      }
      if (password !== confirm) {
        setError("Both passwords must match.");
        return;
      }
    }
    if (mode === "signin" && password.length === 0) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim() },
          },
        });
        if (signUpError) setError(friendlyError(signUpError.message));
        else if (!data.session)
          setNotice("Check your email and tap the confirmation link to finish creating your account.");
      } else if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) setError(friendlyError(signInError.message));
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) setError(friendlyError(resetError.message));
        else setNotice("We've sent a password reset link to your email.");
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Something went wrong. Please try again."));
    }
    setBusy(false);
  }

  async function google() {
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError("Google sign-in could not be completed. Please try again.");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/home", replace: true });
    } catch {
      setError("Google sign-in could not be completed. Please try again.");
    }
  }

  const heading =
    mode === "signup" ? "Create your student account" : mode === "signin" ? "Welcome back" : "Reset your password";
  const sub =
    mode === "signup"
      ? "You'll start with zero enrolled courses."
      : mode === "signin"
        ? "Sign in to reach your enrolled courses."
        : "Enter your email and we'll send you a reset link.";

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-[520px] flex-col overflow-hidden bg-background px-5 pt-10">
      <div className="pointer-events-none absolute -top-24 right-[-70px] size-64 rounded-full bg-lamp/15 blur-2xl" />

      <div className="relative">
        <div className="grid size-11 place-items-center rounded-2xl bg-foreground">
          <span className="font-display text-xl leading-none text-background">D</span>
        </div>
        <h1 className="mt-5 font-display text-[28px] leading-tight">{heading}</h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">{sub}</p>
      </div>

      <form onSubmit={submit} className="relative mt-7 space-y-3">
        {mode === "signup" ? (
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            autoComplete="email"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="you@example.com"
          />
        </Field>
        {mode !== "forgot" ? (
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="At least 6 characters"
            />
          </Field>
        ) : null}
        {mode === "signup" ? (
          <Field label="Confirm password">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Repeat the password"
            />
          </Field>
        ) : null}

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
          {busy
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : mode === "signin"
                ? "Sign in"
                : "Send reset link"}
        </button>
      </form>

      {mode !== "forgot" ? (
        <>
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
        </>
      ) : null}

      <button
        type="button"
        onClick={() => reset(mode === "signup" ? "signin" : "signup")}
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

      <button
        type="button"
        onClick={() => reset(mode === "forgot" ? "signin" : "forgot")}
        className="mt-2 text-[13px] text-muted-foreground"
      >
        {mode === "forgot" ? "Back to sign in" : "Forgot your password?"}
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
