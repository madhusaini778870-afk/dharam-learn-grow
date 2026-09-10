import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Screen, Footer, PageHeader, SparkIcon } from "@/components/app-shell";
import { DoubtSolverSheet } from "@/components/doubt-solver";

export const Route = createFileRoute("/doubt-solver")({
  head: () => ({
    meta: [
      { title: "AI Doubt Solver · Dharam Bhai Study" },
      {
        name: "description",
        content:
          "Ask study doubts and get step-by-step help. The AI answers from available lesson context and says when it doesn't know.",
      },
      { property: "og:title", content: "AI Doubt Solver · Dharam Bhai Study" },
      { property: "og:description", content: "Ask study doubts and get step-by-step help." },
    ],
  }),
  component: DoubtSolverScreen,
});

function DoubtSolverScreen() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  return (
    <Screen>
      <PageHeader title="AI Doubt Solver" subtitle="Ask a doubt any time" back="/home" />

      <div className="mt-4 px-5">
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <div className="grid size-11 place-items-center rounded-2xl bg-lamp/15 text-lamp-deep">
            <SparkIcon className="size-5" />
          </div>
          <p className="mt-3 font-display text-lg">Ask about any concept</p>
          <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
            Open a lesson to ask with that lesson's context attached, or ask a general concept
            question here. If there isn't enough information, the answer will say so instead of
            guessing.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="press mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            🤖 Open AI Doubt Solver
          </button>
        </div>
      </div>

      {open ? (
        <DoubtSolverSheet
          context={{
            courseId: "general",
            lessonId: "general",
            lessonTitle: "General study doubts",
            lessonContext: null,
            timestampSeconds: null,
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
      <Footer />
    </Screen>
  );
}
