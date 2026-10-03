import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchTodaySchedule } from "@/services/courseApi";
import { type LiveClassSchedule } from "@/services/courseNormalizer";
import { studentStore, type StoredEnrollment } from "@/services/studentStore";
import { useAuth } from "@/hooks/useAuth";
import { Screen, Footer, PageHeader } from "@/components/app-shell";
import { RetryButton, StateCard } from "@/components/states";
import { Clock, Play, Radio, Atom, FlaskConical, Calculator, Dna, Video } from "lucide-react";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Classes · Dharam Bhai Study" },
      {
        name: "description",
        content: "Today's publicly listed class schedule for the courses you are enrolled in.",
      },
      { property: "og:title", content: "Live Classes · Dharam Bhai Study" },
      { property: "og:description", content: "Today's schedule for your enrolled courses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LiveScreen,
});

function LiveThumbnail({ item }: { item: LiveClassSchedule }) {
  const [imageFailed, setImageFailed] = useState(false);

  const topicLower = (item.topic + " " + (item.subjectName || "")).toLowerCase();
  let theme = {
    bg: "from-slate-800 via-indigo-950 to-black",
    badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    label: "Physics",
    Icon: Atom,
  };

  if (
    topicLower.includes("chem") ||
    topicLower.includes("organic") ||
    topicLower.includes("inorganic")
  ) {
    theme = {
      bg: "from-emerald-900 via-teal-950 to-black",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      label: "Chemistry",
      Icon: FlaskConical,
    };
  } else if (
    topicLower.includes("math") ||
    topicLower.includes("calculus") ||
    topicLower.includes("algebra") ||
    topicLower.includes("trigo")
  ) {
    theme = {
      bg: "from-amber-900 via-orange-950 to-black",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      label: "Mathematics",
      Icon: Calculator,
    };
  } else if (
    topicLower.includes("bio") ||
    topicLower.includes("botany") ||
    topicLower.includes("zoology")
  ) {
    theme = {
      bg: "from-rose-900 via-pink-950 to-black",
      badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      label: "Biology",
      Icon: Dna,
    };
  } else if (!topicLower.includes("physic")) {
    theme = {
      bg: "from-zinc-800 via-zinc-900 to-black",
      badge: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
      label: item.subjectName || "Lecture",
      Icon: Video,
    };
  }

  const { Icon } = theme;

  return (
    <div className="relative aspect-video w-28 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-border shadow-xs group">
      {item.image && !imageFailed ? (
        <img
          src={item.image}
          alt={item.topic}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        /* High-Definition Themed Broadcast Card */
        <div
          className={`relative h-full w-full bg-gradient-to-br ${theme.bg} p-2 flex flex-col justify-between overflow-hidden`}
        >
          {/* Subtle Background Watermark Icon */}
          <Icon className="absolute -right-2 -bottom-2 size-14 text-white/5 pointer-events-none" />

          {/* Top Label */}
          <div className="flex items-center justify-between z-10">
            <span
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase border ${theme.badge}`}
            >
              <Icon className="size-2.5" />
              {theme.label}
            </span>
          </div>

          {/* Bottom Title Snippet */}
          <div className="z-10 mt-auto">
            <p className="line-clamp-1 text-[9px] font-bold text-white/90 leading-tight">
              {item.topic}
            </p>
          </div>
        </div>
      )}

      {/* Live Badge or Scheduled Time Badge */}
      {item.status === "live" ? (
        <div className="absolute top-1.5 left-1.5 z-20 flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase shadow-md animate-pulse">
          <Radio className="size-2.5" /> Live
        </div>
      ) : (
        <div className="absolute bottom-1.5 right-1.5 z-20 rounded bg-black/80 backdrop-blur-xs px-1.5 py-0.5 text-[8px] font-bold text-white shadow-xs">
          {item.timeRangeFormatted ? item.timeRangeFormatted.split("–")[0].trim() : "Scheduled"}
        </div>
      )}
    </div>
  );
}

function LiveScreen() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<StoredEnrollment[]>(() =>
    studentStore.getEnrollments(),
  );

  useEffect(() => {
    studentStore.syncUserData().then(() => {
      setEnrollments(studentStore.getEnrollments());
    });
    const handleUpdate = () => {
      setEnrollments(studentStore.getEnrollments());
    };
    window.addEventListener("dharam_enrollments_updated", handleUpdate);
    return () => {
      window.removeEventListener("dharam_enrollments_updated", handleUpdate);
    };
  }, [user]);

  return (
    <Screen>
      <PageHeader title="Live Classes" subtitle="Today's schedule for your enrolled courses" />
      <div className="mt-4 space-y-3 px-5">
        {enrollments.length === 0 ? (
          <StateCard
            title="No enrolled courses yet"
            body="Enroll in a course to see its live class schedule here."
            action={
              <Link
                to="/courses"
                search={{ category: undefined }}
                className="press inline-flex rounded-2xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground"
              >
                Browse courses
              </Link>
            }
          />
        ) : null}
        {enrollments.map((row) => (
          <CourseSchedule key={row.courseId} courseId={row.courseId} title={row.courseTitle} />
        ))}
      </div>
      <Footer />
    </Screen>
  );
}

function CourseSchedule({ courseId, title }: { courseId: string; title: string }) {
  const load = useServerFn(fetchTodaySchedule);
  const schedule = useQuery({
    queryKey: ["schedule", courseId],
    queryFn: () => load({ data: { courseId } }),
    retry: false,
  });

  const classes = schedule.data?.status === "ok" ? schedule.data.classes : [];

  return (
    <div className="rounded-3xl bg-card p-4 ring-1 ring-border shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold leading-tight text-foreground">{title}</p>
        {classes.some((c) => c.status === "live") ? (
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 animate-pulse">
            <span className="size-1.5 rounded-full bg-red-500" />
            LIVE NOW
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground font-medium">
            {classes.length} {classes.length === 1 ? "class" : "classes"}
          </span>
        )}
      </div>

      {schedule.isLoading ? (
        <p className="mt-2 text-[12px] text-muted-foreground">Loading schedule…</p>
      ) : null}
      {schedule.isError || schedule.data?.status === "unavailable" ? (
        <div className="mt-2">
          <p className="text-[12px] text-muted-foreground">Schedule couldn't be loaded.</p>
          <div className="mt-2">
            <RetryButton onClick={() => schedule.refetch()} />
          </div>
        </div>
      ) : null}
      {schedule.data?.status === "ok" && classes.length === 0 ? (
        <p className="mt-2 text-[12px] text-muted-foreground">No classes scheduled for today.</p>
      ) : null}

      {classes.length > 0 ? (
        <div className="mt-3 space-y-2.5">
          {classes.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl bg-background p-3 ring-1 ring-border"
            >
              {/* Thumbnail with Live/Time Badge */}
              <LiveThumbnail item={item} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                      item.status === "live"
                        ? "bg-red-500/15 text-red-600 dark:text-red-400"
                        : item.status === "upcoming"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.status === "live"
                      ? "Live Now"
                      : item.status === "upcoming"
                        ? "Upcoming"
                        : "Ended"}
                  </span>
                  {item.lectureType ? (
                    <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] text-muted-foreground">
                      {item.lectureType}
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 line-clamp-1 text-xs font-semibold text-foreground">
                  {item.topic}
                </p>

                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-foreground/80">
                  <Clock className="size-3 shrink-0 text-primary" />
                  <span className="truncate font-semibold text-foreground">
                    {item.timeRangeFormatted ??
                      (item.startTime ? `${item.startTime} (IST)` : "Scheduled today (IST)")}
                  </span>
                </div>
              </div>

              <Link
                to="/lesson/$courseId/$lessonId"
                params={{ courseId, lessonId: item.id }}
                className="press shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition hover:opacity-90"
              >
                <Play className="size-3 fill-current" />
                <span>{item.status === "live" ? "Join" : "Watch"}</span>
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
