import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dharam Bhai Study — JEE & NEET learning app" },
      {
        name: "description",
        content:
          "Learn • Practice • Grow. Dharam Bhai Study brings JEE and NEET courses, notes and an AI doubt solver into one mobile app. By Lakshya Prince.",
      },
      { property: "og:title", content: "Dharam Bhai Study — JEE & NEET learning app" },
      {
        property: "og:description",
        content: "Learn • Practice • Grow. JEE and NEET courses, notes and an AI doubt solver.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      navigate({ to: session ? "/home" : "/auth", replace: true });
    }, 1400);
    return () => clearTimeout(timer);
  }, [loading, session, navigate]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-8 text-center">
      <div className="pointer-events-none absolute -top-24 right-[-70px] size-64 rounded-full bg-lamp/15 blur-2xl" />
      <div className="pointer-events-none absolute -top-14 right-0 size-32 rounded-full bg-lamp/25 blur-xl" />

      <div className="animate-rise relative">
        <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-foreground">
          <span className="font-display text-4xl leading-none text-background">D</span>
        </div>
        <h1 className="mt-6 font-display text-[30px] leading-tight">Dharam Bhai Study</h1>
        <p className="mt-2 text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Learn · Practice · Grow
        </p>
      </div>

      <p className="absolute bottom-10 text-[11px] tracking-wide text-muted-foreground">
        By Lakshya Prince
      </p>
    </main>
  );
}
