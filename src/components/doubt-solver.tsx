import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CloseIcon, SendIcon, SparkIcon } from "@/components/app-shell";

export type DoubtContext = {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  lessonContext?: string | null;
  timestampSeconds?: number | null;
};

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain this part again simply",
  "What formula is used here?",
  "Give me a similar practice question",
];

export function DoubtSolverSheet({
  context,
  onClose,
}: {
  context: DoubtContext;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || busy) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setBusy(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await fetch("/api/ai/doubt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          courseId: context.courseId,
          lessonId: context.lessonId,
          lessonTitle: context.lessonTitle,
          lessonContext: context.lessonContext ?? null,
          timestampSeconds: context.timestampSeconds ?? null,
          question: trimmed,
          history: messages.slice(-8),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { answer?: string; error?: string }
        | null;

      if (!response.ok || !payload?.answer) {
        setError(payload?.error ?? `The doubt solver could not answer right now (${response.status}).`);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: payload.answer! }]);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close doubt solver"
        onClick={onClose}
        className="absolute inset-0 bg-night/60"
      />
      <div className="animate-sheet relative w-full max-w-[520px] rounded-t-3xl bg-card pb-5 text-foreground">
        <div className="flex justify-center pt-2.5">
          <div className="h-1.5 w-10 rounded-full bg-foreground/15" />
        </div>
        <div className="px-5 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-lamp/15 text-lamp-deep">
                <SparkIcon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">AI Doubt Solver</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Answers from this lesson's available context
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setError(null);
                }}
                className="px-1 text-[11px] font-medium text-muted-foreground"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-7 place-items-center rounded-full bg-foreground/5 text-muted-foreground"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 max-h-[38vh] space-y-3 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-foreground/8 px-3.5 py-2.5">
                <p className="text-[13px] leading-snug text-pretty text-foreground/80">
                  Ask a doubt about “{context.lessonTitle}”. If I don't have enough lesson
                  information, I'll say so instead of guessing.
                </p>
              </div>
            ) : null}
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5"
                    : "max-w-[80%] rounded-2xl rounded-bl-md bg-foreground/8 px-3.5 py-2.5"
                }
              >
                <p
                  className={`whitespace-pre-wrap text-[13px] leading-snug text-pretty ${
                    message.role === "user" ? "font-medium text-primary-foreground" : "text-foreground/80"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {busy ? (
              <div className="max-w-[60%] rounded-2xl rounded-bl-md bg-foreground/8 px-3.5 py-3">
                <div className="flex gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
                  <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
                  <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
                </div>
              </div>
            ) : null}
            {error ? (
              <p className="rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-[12px] text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Suggested
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => ask(suggestion)}
                className="shrink-0 rounded-full bg-pine/10 px-3 py-1.5 text-[11px] font-medium text-pine"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
            className="mt-4 flex items-center gap-2 rounded-2xl bg-background px-3.5 py-2.5 ring-1 ring-border"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your doubt…"
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={busy}
              aria-label="Send"
              className="press grid size-8 shrink-0 place-items-center rounded-xl bg-foreground text-background disabled:opacity-50"
            >
              <SendIcon className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
