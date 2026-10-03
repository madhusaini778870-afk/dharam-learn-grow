import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Bookmark, Clock, ArrowRight, Video, Sparkles } from "lucide-react";
import { studentStore, type RecentLectureItem } from "@/services/studentStore";

export function RecentLecturesSection() {
  const [recentLectures, setRecentLectures] = useState<RecentLectureItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateList = () => {
      setRecentLectures(studentStore.getRecentLectures(3));
    };

    updateList();

    window.addEventListener("dharam_recent_updated", updateList);
    window.addEventListener("dharam_progress_updated", updateList);
    window.addEventListener("dharam_bookmarks_updated", updateList);

    return () => {
      window.removeEventListener("dharam_recent_updated", updateList);
      window.removeEventListener("dharam_progress_updated", updateList);
      window.removeEventListener("dharam_bookmarks_updated", updateList);
    };
  }, []);

  if (!mounted) return null;

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Clock className="size-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold leading-none tracking-tight text-foreground">
              Recent Lectures
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Quick access to your last 3 started or saved videos
            </p>
          </div>
        </div>

        {recentLectures.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {recentLectures.length} of 3
          </span>
        )}
      </div>

      {recentLectures.length === 0 ? (
        <div className="mt-3 rounded-2xl bg-card p-4 ring-1 ring-border text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2">
            <Video className="size-5" />
          </div>
          <p className="text-xs font-semibold text-foreground">No recent lectures yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Start any lecture from Physics Wallah batches or tap 🔖 Bookmark to quickly resume your
            studies here.
          </p>
          <div className="mt-3">
            <Link
              to="/courses"
              search={{ category: undefined }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90 transition"
            >
              <span>Explore Batches</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          {recentLectures.map((item) => {
            const hasProgress =
              typeof item.timestampSeconds === "number" &&
              typeof item.durationSeconds === "number" &&
              item.durationSeconds > 0;
            const progressPercent = hasProgress
              ? Math.min(100, Math.round((item.timestampSeconds! / item.durationSeconds!) * 100))
              : null;

            return (
              <Link
                key={`${item.courseId}-${item.lessonId}`}
                to="/lesson/$courseId/$lessonId"
                params={{ courseId: item.courseId, lessonId: item.lessonId }}
                search={{ subjectId: item.subjectId, chapterId: item.chapterId }}
                className="group relative flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border shadow-2xs hover:ring-amber-500/50 hover:bg-muted/30 transition active:scale-[0.99]"
              >
                {/* Video Thumbnail / Icon */}
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted/60 ring-1 ring-border/50">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="size-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-amber-500/15 via-muted to-muted text-amber-600 dark:text-amber-400">
                      <Video className="size-6" />
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                    <div className="flex size-7 items-center justify-center rounded-full bg-amber-500 text-black shadow-sm">
                      <Play className="size-3.5 fill-current translate-x-0.5" />
                    </div>
                  </div>
                </div>

                {/* Lecture Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {item.isBookmarked && (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                        <Bookmark className="size-2.5 fill-current" />
                        Saved
                      </span>
                    )}
                    {progressPercent !== null && progressPercent > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="size-1 rounded-full bg-emerald-500" />
                        {progressPercent}% watched
                      </span>
                    )}
                    {item.courseTitle && (
                      <span className="truncate text-[10px] text-muted-foreground">
                        {item.courseTitle}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-1 font-sans text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    {item.title}
                  </h3>

                  {/* Progress Bar if watched */}
                  {progressPercent !== null && progressPercent > 0 && (
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Play Button Action */}
                <div className="shrink-0">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-amber-500 group-hover:text-black transition">
                    <Play className="size-3.5 fill-current translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Source Banner */}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground ring-1 ring-border/40">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="size-3 text-amber-500 shrink-0" />
          <span className="truncate">
            Source:{" "}
            <a
              href="https://pw.gemtara.in/study/batches"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              pw.gemtara.in
            </a>
          </span>
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          All Videos Live
        </span>
      </div>
    </section>
  );
}
