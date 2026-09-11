import type { SourceState } from "@/services/courseApi";
import { RetryButton } from "@/components/states";

/** Honest per-source status: never replaced by placeholder courses. */
export function SourceStatusPanel({
  sources,
  onRetry,
}: {
  sources: SourceState[];
  onRetry?: () => void;
}) {
  const problems = sources.filter((source) => source.status !== "ok");
  if (problems.length === 0) return null;

  return (
    <div className="rounded-3xl bg-card p-4 ring-1 ring-border">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Catalog sources
      </p>
      <div className="mt-3 space-y-3">
        {sources.map((source) => (
          <div key={source.source} className="flex items-start gap-2.5">
            <span
              className={`mt-1 size-2 shrink-0 rounded-full ${
                source.status === "ok" ? "bg-pine" : "bg-lamp"
              }`}
            />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">
                {source.label}
                {source.status === "ok" ? (
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    {source.count} courses
                  </span>
                ) : (
                  <span className="ml-1.5 font-normal text-lamp-deep">
                    {source.status === "not_configured" ? "API not configured" : "Unavailable"}
                  </span>
                )}
              </p>
              {source.message ? (
                <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                  {source.message}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {onRetry ? (
        <div className="mt-4">
          <RetryButton onClick={onRetry} />
        </div>
      ) : null}
    </div>
  );
}
