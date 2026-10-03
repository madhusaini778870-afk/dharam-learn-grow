import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from "lucide-react";

type AuthSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Authentication · Dharam Bhai Study" },
      {
        name: "description",
        content: "Secure student sign in and registration for Dharam Bhai Study.",
      },
      { property: "og:title", content: "Authentication · Dharam Bhai Study" },
      {
        property: "og:description",
        content: "Sign in or create your student account to access your courses and progress.",
      },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const { session, login, signUp, requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password flow state
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<"request" | "reset">("request");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      const destination = redirect && redirect.startsWith("/") ? redirect : "/home";
      navigate({ to: destination, replace: true });
    }
  }, [session, redirect, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!email.trim() || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setBusy(true);
    const res = await login(email, password);
    setBusy(false);

    if (!res.success) {
      setError(res.error ?? "Invalid email or password.");
    } else {
      const destination = redirect && redirect.startsWith("/") ? redirect : "/home";
      navigate({ to: destination, replace: true });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setBusy(true);
    const res = await signUp(cleanName, cleanEmail, password, confirmPassword);
    setBusy(false);

    if (!res.success) {
      setError(res.error ?? "Registration could not be completed.");
    } else {
      const destination = redirect && redirect.startsWith("/") ? redirect : "/home";
      navigate({ to: destination, replace: true });
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    const res = await requestPasswordReset(email.trim());
    setBusy(false);

    setSuccessNotice(
      res.message ||
        "If an account with that email exists, reset instructions have been generated.",
    );

    // If a reset token was returned (local preview assistance)
    if (res.resetToken) {
      setResetToken(res.resetToken);
    }
    setForgotStep("reset");
  };

  const handlePerformReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!resetToken.trim()) {
      setError("Please enter your reset code/token.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    const res = await resetPassword(resetToken.trim(), newPassword, confirmNewPassword);
    setBusy(false);

    if (!res.success) {
      setError(res.error ?? "Failed to reset password. Token may have expired.");
    } else {
      setSuccessNotice("Password reset successful! Please sign in with your new password.");
      setMode("signin");
      setPassword("");
      setConfirmPassword("");
      setForgotStep("request");
    }
  };

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-[520px] flex-col overflow-hidden bg-background px-5 pt-8 pb-10">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 right-[-70px] size-64 rounded-full bg-lamp/15 blur-2xl" />

      {/* Header & Brand */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/app-logo.png"
              alt="Dharam Bhai Study"
              className="size-12 rounded-full object-cover ring-2 ring-primary/20 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="font-display text-lg font-bold leading-tight">Dharam Bhai Study</h2>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Learn · Practice · Grow
              </p>
            </div>
          </div>
          <Link
            to="/home"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition underline underline-offset-4"
          >
            Explore as Guest
          </Link>
        </div>

        <div className="mt-6">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {mode === "signin" && "Sign in to your account"}
            {mode === "signup" && "Create your student account"}
            {mode === "forgot" && "Reset your password"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "signin" &&
              "Access your enrolled courses, lecture notes, and study progress."}
            {mode === "signup" &&
              "Join Dharam Bhai Study for JEE, NEET, and board exam preparation."}
            {mode === "forgot" && "Enter your registered email to receive a password reset token."}
          </p>
        </div>

        {/* Tab Switcher for Sign In / Sign Up */}
        {mode !== "forgot" && (
          <div className="mt-6 flex rounded-2xl bg-card p-1 ring-1 ring-border shadow-xs">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
                mode === "signin"
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
                mode === "signup"
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>
        )}
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="relative mt-4 flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs font-medium text-destructive ring-1 ring-destructive/20">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successNotice && (
        <div className="relative mt-4 flex items-start gap-2.5 rounded-2xl bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* 1. SIGN IN FORM */}
      {mode === "signin" && (
        <form onSubmit={handleSignIn} className="relative mt-5 space-y-3.5">
          <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-2xs">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="student@example.com"
            />
          </div>

          <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                <span>{showPassword ? "Hide" : "Show"}</span>
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Your password"
            />
          </div>

          <div className="flex items-center justify-end px-1">
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError(null);
                setSuccessNotice(null);
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="press w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy ? (
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            <span>{busy ? "Signing in…" : "Sign In"}</span>
          </button>
        </form>
      )}

      {/* 2. SIGN UP FORM */}
      {mode === "signup" && (
        <form onSubmit={handleSignUp} className="relative mt-5 space-y-3.5">
          <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-2xs">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Your full name"
            />
          </div>

          <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-2xs">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="student@example.com"
            />
          </div>

          <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                <span>{showPassword ? "Hide" : "Show"}</span>
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Confirm Password
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                <span>{showConfirmPassword ? "Hide" : "Show"}</span>
              </button>
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="press w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy ? (
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            <span>{busy ? "Creating Account…" : "Create Student Account"}</span>
          </button>
        </form>
      )}

      {/* 3. FORGOT PASSWORD FLOW */}
      {mode === "forgot" && (
        <div className="relative mt-5 space-y-4">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setSuccessNotice(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Sign In</span>
          </button>

          {forgotStep === "request" ? (
            <form onSubmit={handleRequestReset} className="space-y-3.5">
              <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-2xs">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Registered Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="student@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="press w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {busy ? (
                  <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                <span>{busy ? "Generating code…" : "Send Reset Instructions"}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handlePerformReset} className="space-y-3.5">
              <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-2xs">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Reset Code / Token
                </label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                  className="mt-1 w-full bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Paste reset token"
                />
              </div>

              <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-2xs">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-2xs">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Re-enter new password"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="press w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {busy ? (
                  <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                <span>{busy ? "Updating password…" : "Update Password & Sign In"}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Admin Portal Link */}
      <div className="mt-8 border-t border-border pt-4 text-center">
        <Link
          to="/admin"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          Administrator Portal Login →
        </Link>
      </div>

      {/* Footer Branding */}
      <p className="mt-auto pt-8 text-center text-[11px] tracking-wide text-muted-foreground">
        Dharam Bhai Study · By Lakshya Prince
      </p>
    </main>
  );
}
