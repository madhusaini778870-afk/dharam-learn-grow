import type { ReactNode } from "react";

export function CardSkeleton() {
  return (
    <div className="flex gap-3 rounded-3xl bg-card p-3 ring-1 ring-border">
      <div className="shimmer size-20 rounded-xl" />
      <div className="flex-1 space-y-2 py-1">
        <div className="shimmer h-3 w-1/3 rounded-full" />
        <div className="shimmer h-3 w-5/6 rounded-full" />
        <div className="shimmer h-2.5 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StateCard({
  title,
  body,
  action,
  tone = "neutral",
}: {
  title: string;
  body: string;
  action?: ReactNode;
  tone?: "neutral" | "warn";
}) {
  return (
    <div className="rounded-3xl bg-card px-6 py-8 text-center ring-1 ring-border">
      <div
        className={`mx-auto grid size-12 place-items-center rounded-2xl ${
          tone === "warn" ? "bg-lamp/15 text-lamp-deep" : "bg-pine/12 text-pine"
        }`}
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.2v.1" />
        </svg>
      </div>
      <p className="mt-4 font-display text-lg">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[30ch] text-[13px] leading-snug text-muted-foreground">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function RetryButton({ onClick, label = "Try again" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press rounded-2xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
    >
      {label}
    </button>
  );
}

export function CatalogUnavailable({ onRetry, reason }: { onRetry?: () => void; reason?: string }) {
  return (
    <StateCard
      tone="warn"
      title="Catalog unavailable"
      body={
        reason ??
        "Course catalog is temporarily unavailable because an authorized data endpoint is required."
      }
      action={onRetry ? <RetryButton onClick={onRetry} /> : undefined}
    />
  );
}
