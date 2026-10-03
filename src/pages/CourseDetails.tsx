import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  fetchChapterContents,
  fetchChapters,
  fetchCourseDetail,
  fetchTodaySchedule,
  type NormalizedDppTest,
} from "@/services/courseApi";
import { studentStore } from "@/services/studentStore";
import { useAuth } from "@/hooks/useAuth";
import { Screen, PageHeader, LockIcon, ChevronRight, Footer } from "@/components/app-shell";
import { ListSkeleton, RetryButton, StateCard } from "@/components/states";
import { CourseRatingSection } from "@/components/CourseRatingSection";
import { DppPracticeTestModal } from "@/components/DppPracticeTestModal";
import { ChapterProgressIndicator } from "@/components/ChapterProgressIndicator";
import {
  Radio,
  Calendar,
  Play,
  FileText,
  Download,
  ExternalLink,
  Clock,
  Video,
  CheckCircle2,
  BookOpen,
  Layers,
  Sparkles,
  Send,
} from "lucide-react";

export function CourseDetailsPage({ courseId }: { courseId: string }) {
  const { session, loading, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadCourse = useServerFn(fetchCourseDetail);

  const [isEnrolled, setIsEnrolled] = useState(() => studentStore.isEnrolled(courseId));

  useEffect(() => {
    setIsEnrolled(studentStore.isEnrolled(courseId));
    const handleUpdate = () => {
      setIsEnrolled(studentStore.isEnrolled(courseId));
    };
    window.addEventListener("dharam_enrollments_updated", handleUpdate);
    return () => {
      window.removeEventListener("dharam_enrollments_updated", handleUpdate);
    };
  }, [courseId, user]);

  const course = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => loadCourse({ data: { courseId } }),
    retry: false,
  });

  const detail = course.data?.status === "ok" ? course.data.course : null;

  const enroll = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigate({
          to: "/auth",
          search: { redirect: `/course/${courseId}` },
        });
        return;
      }
      if (!detail) throw new Error("Course unavailable");
      const res = await studentStore.enrollCourse(detail);
      if (!res.success) {
        throw new Error(res.error || "Failed to enroll");
      }
      setIsEnrolled(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["student_enrollments"] });
    },
  });
  const subjectCount = detail?.subjectRefs.length ?? 0;

  return (
    <Screen>
      <PageHeader title="Course details" back="/courses" />

      <div className="mt-2 px-5 pb-24">
        {course.isLoading ? <ListSkeleton count={2} /> : null}
        {course.isError ? (
          <StateCard
            tone="warn"
            title="Couldn't load this course"
            body="The course service could not be reached. Check your connection and try again."
            action={<RetryButton onClick={() => course.refetch()} />}
          />
        ) : null}
        {course.data?.status === "unavailable" ? (
          <StateCard
            tone="warn"
            title="Course unavailable"
            body={course.data.reason}
            action={<RetryButton onClick={() => course.refetch()} />}
          />
        ) : null}

        {detail ? (
          <div className="animate-rise">
            {detail.thumbnail ? (
              <img
                src={detail.thumbnail}
                alt={detail.title}
                className="aspect-video w-full rounded-2xl object-cover ring-1 ring-border"
              />
            ) : null}

            <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-foreground/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {detail.sourceLabel}
              </span>
              <span className="rounded-md bg-lamp/15 px-2 py-0.5 text-[10px] font-semibold text-lamp-deep">
                {detail.category}
              </span>
              {detail.className ? (
                <span className="rounded-md bg-lamp/15 px-2 py-0.5 text-[10px] font-semibold text-lamp-deep">
                  {detail.className}
                </span>
              ) : null}
            </div>

            <h2 className="mt-2 font-display text-[24px] leading-tight text-balance">
              {detail.title}
            </h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Course ID · {detail.sourceCourseId}
            </p>

            {detail.teachers.length ? (
              <p className="mt-1.5 text-[12px] text-muted-foreground">
                {detail.teachers.join(" · ")}
              </p>
            ) : null}

            {detail.description ? (
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                {detail.description}
              </p>
            ) : null}

            {detail.sourceUrl ? (
              <a
                href={detail.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="press mt-3 inline-flex rounded-2xl bg-card px-4 py-2.5 text-[12px] font-semibold ring-1 ring-border"
              >
                {detail.sourceNote ?? "Public source"} ↗
              </a>
            ) : null}

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat value={String(detail.subjects.length)} label="Subjects" />
              <Stat
                value={String(
                  detail.subjectRefs.reduce((total, item) => total + (item.lectureCount ?? 0), 0),
                )}
                label="Lectures"
              />
              <Stat value={detail.language ?? "—"} label="Language" />
            </div>

            {/* Live Class & Today's Schedule Section */}
            <LiveClassSection
              courseId={detail.id}
              isEnrolled={isEnrolled}
              courseThumbnail={detail.thumbnail}
              courseTitle={detail.title}
            />

            {/* Dedicated Course Lessons & Video Lectures Card Section */}
            <CourseLessonsCardSection
              courseId={detail.id}
              isEnrolled={isEnrolled}
              subjectRefs={detail.subjectRefs}
              courseThumbnail={detail.thumbnail}
            />

            <SectionTitle>Syllabus &amp; Chapter Breakdown</SectionTitle>
            <div className="mt-2.5 space-y-2.5">
              {detail.subjectRefs.length === 0 ? (
                <StateCard
                  title="No subjects published"
                  body="The public source did not include subject data for this course."
                />
              ) : null}
              {detail.subjectRefs.map((subject, idx) => (
                <SubjectBlock
                  key={`${subject.id}-${idx}`}
                  courseId={detail.id}
                  subject={subject}
                  isEnrolled={isEnrolled}
                />
              ))}
            </div>

            {detail.notes.length ? (
              <>
                <SectionTitle>Notes &amp; PDFs</SectionTitle>
                <div className="mt-2.5 space-y-2.5">
                  {detail.notes.map((note, idx) =>
                    isEnrolled ? (
                      <a
                        key={`${note.id}-${idx}`}
                        href={note.url}
                        target="_blank"
                        rel="noreferrer"
                        className="press block rounded-2xl bg-card p-3.5 text-sm font-medium ring-1 ring-border"
                      >
                        {note.title}
                      </a>
                    ) : (
                      <div
                        key={`${note.id}-${idx}`}
                        className="flex items-center gap-2 rounded-2xl bg-card/60 p-3.5 text-sm text-muted-foreground ring-1 ring-border"
                      >
                        <LockIcon className="size-4 text-locked" />
                        {note.title}
                      </div>
                    ),
                  )}
                </div>
              </>
            ) : null}

            {/* Course Rating and Student Reviews Section */}
            <CourseRatingSection
              courseId={detail.id}
              courseTitle={detail.title}
              isEnrolled={isEnrolled}
            />

            {enroll.isError ? (
              <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-[12px] text-destructive">
                Enrollment failed. Please try again.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {detail ? (
        <div className="fixed bottom-[76px] left-1/2 w-full max-w-[520px] -translate-x-1/2 border-t border-border bg-background/95 px-5 py-3 backdrop-blur">
          {isEnrolled ? (
            <div className="flex items-center gap-3">
              <p className="flex-1 text-[13px] font-semibold text-pine">You're enrolled</p>
              <Link
                to="/my-learning"
                className="press rounded-2xl bg-card px-4 py-2.5 text-[13px] font-semibold ring-1 ring-border"
              >
                My Courses
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="leading-tight">
                <p className="text-[11px] text-muted-foreground">Enroll to unlock</p>
                <p className="text-sm font-semibold">{subjectCount} subjects</p>
              </div>
              <button
                type="button"
                onClick={() => enroll.mutate()}
                disabled={enroll.isPending}
                className="press ml-auto max-w-[220px] flex-1 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {enroll.isPending ? "Enrolling…" : "Enroll"}
              </button>
            </div>
          )}
        </div>
      ) : null}
      <Footer />
    </Screen>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-card py-2.5 text-center ring-1 ring-border">
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default CourseDetailsPage;

function LiveClassSection({
  courseId,
  isEnrolled,
  courseThumbnail,
  courseTitle,
}: {
  courseId: string;
  isEnrolled: boolean;
  courseThumbnail?: string | null;
  courseTitle?: string;
}) {
  const loadSchedule = useServerFn(fetchTodaySchedule);
  const schedule = useQuery({
    queryKey: ["todaySchedule", courseId],
    queryFn: () => loadSchedule({ data: { courseId } }),
    retry: false,
    refetchInterval: 30000,
  });

  const classes = schedule.data?.status === "ok" ? schedule.data.classes : [];

  return (
    <div className="mt-6 rounded-3xl bg-card p-4 ring-1 ring-border shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
            <Radio className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Live Classes &amp; Schedule
            </h3>
            <p className="text-[10px] text-muted-foreground">Today's live interactive lectures</p>
          </div>
        </div>
        {classes.some((c) => c.status === "live") ? (
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 animate-pulse">
            <span className="size-1.5 rounded-full bg-red-500" />
            LIVE NOW
          </span>
        ) : (
          <span className="text-[10px] font-medium text-muted-foreground">
            {classes.length} {classes.length === 1 ? "session" : "sessions"} today
          </span>
        )}
      </div>

      {schedule.isLoading ? (
        <div className="mt-3">
          <ListSkeleton count={1} />
        </div>
      ) : null}

      {schedule.data?.status === "ok" && classes.length === 0 ? (
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <Calendar className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-semibold text-foreground">No live classes scheduled right now</p>
              <p className="text-[11px] text-muted-foreground">
                Live interactive classes, doubts, and quizzes appear here as per daily faculty
                timetable.
              </p>
            </div>
          </div>
          <a
            href="https://t.me/mrlokygamer"
            target="_blank"
            rel="noopener noreferrer"
            className="press shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-500/20 transition self-start sm:self-auto"
          >
            <Send className="size-3" />
            <span>Join Telegram Live Alerts ↗</span>
          </a>
        </div>
      ) : null}

      {classes.length > 0 ? (
        <div className="mt-3 space-y-2.5">
          {classes.map((cls, idx) => (
            <div
              key={`${cls.id}-${idx}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-background p-3 ring-1 ring-border shadow-xs"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* 16:9 Thumbnail with Live/Time Badge */}
                <div className="relative aspect-video w-28 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-border shadow-xs">
                  <img
                    src={cls.image || courseThumbnail || "/app-logo.png"}
                    alt={cls.topic}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (courseThumbnail && target.src !== courseThumbnail) {
                        target.src = courseThumbnail;
                      } else {
                        target.src = "/app-logo.png";
                      }
                    }}
                  />
                  {cls.status === "live" ? (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase shadow-sm animate-pulse">
                      <span className="size-1.5 rounded-full bg-white" /> LIVE
                    </div>
                  ) : (
                    <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 backdrop-blur-xs px-1.5 py-0.5 text-[8px] font-bold text-white shadow-xs">
                      {cls.timeRangeFormatted
                        ? cls.timeRangeFormatted.split("–")[0].trim()
                        : "Scheduled"}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {cls.status === "live" ? (
                      <span className="flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400 uppercase">
                        <span className="size-1 rounded-full bg-red-500 animate-pulse" /> Live Now
                      </span>
                    ) : cls.status === "upcoming" ? (
                      <span className="flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400 uppercase">
                        <Clock className="size-2.5" /> Upcoming
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground uppercase">
                        <CheckCircle2 className="size-2.5" /> Ended
                      </span>
                    )}
                    {cls.lectureType ? (
                      <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-medium text-muted-foreground">
                        {cls.lectureType}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-foreground">{cls.topic}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-foreground/80">
                    <Clock className="size-3 shrink-0 text-primary" />
                    <span className="truncate font-semibold text-foreground">
                      {cls.timeRangeFormatted ??
                        (cls.startTime ? `${cls.startTime} (IST)` : "Scheduled today (IST)")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isEnrolled ? (
                  <Link
                    to="/lesson/$courseId/$lessonId"
                    params={{ courseId, lessonId: cls.id }}
                    className="press inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition hover:opacity-90 w-full sm:w-auto"
                  >
                    <Play className="size-3.5 fill-current" />
                    <span>
                      {cls.status === "live"
                        ? "Join Live"
                        : cls.status === "upcoming"
                          ? "Open Room"
                          : "Watch Replay"}
                    </span>
                  </Link>
                ) : (
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <LockIcon className="size-3" /> Enroll to join
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LessonCard({
  courseId,
  lesson,
  subjectId,
  chapterId,
  chapterTitle,
  isEnrolled,
}: {
  courseId: string;
  lesson: {
    id: string;
    title: string;
    posterUrl?: string | null;
    durationFormatted?: string | null;
    videoUrl?: string | null;
    faculty?: string | null;
  };
  subjectId?: string;
  chapterId?: string;
  chapterTitle?: string;
  isEnrolled: boolean;
}) {
  const [isCompleted, setIsCompleted] = useState(() =>
    Boolean(studentStore.getLessonProgress(courseId, lesson.id)?.completed),
  );

  useEffect(() => {
    const check = () => {
      setIsCompleted(Boolean(studentStore.getLessonProgress(courseId, lesson.id)?.completed));
    };
    window.addEventListener("dharam_progress_updated", check);
    return () => window.removeEventListener("dharam_progress_updated", check);
  }, [courseId, lesson.id]);

  return (
    <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-card p-3 ring-1 ring-border shadow-xs hover:border-primary/40 transition">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* 16:9 Aspect Video Thumbnail */}
        <div className="relative aspect-video w-28 sm:w-32 shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-border shadow-xs">
          {lesson.posterUrl ? (
            <img
              src={lesson.posterUrl}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500/20 via-amber-700/10 to-black">
              <Play className="size-6 text-amber-500 fill-current opacity-80" />
            </div>
          )}

          {/* Hover Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition duration-200">
            <div className="flex size-8 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
              <Play className="size-4 fill-current translate-x-0.5" />
            </div>
          </div>

          {/* Duration Badge */}
          {lesson.durationFormatted ? (
            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-white tracking-tight">
              {lesson.durationFormatted}
            </span>
          ) : null}
        </div>

        {/* Content Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-300 uppercase">
              Video Lecture
            </span>
            {isCompleted ? (
              <span className="flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-2.5" /> Completed (+25 XP)
              </span>
            ) : (
              <span className="flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                <Sparkles className="size-2.5" /> +25 XP
              </span>
            )}
            {chapterTitle ? (
              <span className="truncate max-w-[140px] text-[10px] text-muted-foreground">
                {chapterTitle}
              </span>
            ) : null}
          </div>

          <h4 className="mt-1 line-clamp-2 text-xs sm:text-sm font-semibold text-foreground leading-snug">
            {lesson.title}
          </h4>

          {lesson.faculty ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">By {lesson.faculty}</p>
          ) : null}
        </div>
      </div>

      {/* Action button */}
      <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t border-border/50 sm:border-0">
        {isEnrolled ? (
          <Link
            to="/lesson/$courseId/$lessonId"
            params={{ courseId, lessonId: lesson.id }}
            search={{ subjectId, chapterId }}
            className="press inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition hover:opacity-90 w-full sm:w-auto"
          >
            <Play className="size-3.5 fill-current" />
            <span>{isCompleted ? "Replay Video" : "Watch Lecture"}</span>
          </Link>
        ) : (
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <LockIcon className="size-3" /> Enroll to watch
          </span>
        )}
      </div>
    </div>
  );
}

function CourseLessonsCardSection({
  courseId,
  isEnrolled,
  subjectRefs,
  courseThumbnail,
}: {
  courseId: string;
  isEnrolled: boolean;
  subjectRefs: { id: string; name: string; lectureCount: number | null; teachers: string[] }[];
  courseThumbnail?: string | null;
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjectRefs[0]?.id || "");

  const activeSubject = subjectRefs.find((s) => s.id === selectedSubjectId) || subjectRefs[0];

  const loadChapters = useServerFn(fetchChapters);
  const chaptersQuery = useQuery({
    queryKey: ["chapters", courseId, activeSubject?.id],
    enabled: Boolean(activeSubject?.id),
    queryFn: () => loadChapters({ data: { courseId, subjectId: activeSubject.id } }),
    retry: false,
  });

  const chapters = useMemo(
    () => (chaptersQuery.data?.status === "ok" ? chaptersQuery.data.chapters : []),
    [chaptersQuery.data],
  );
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(chapters[0].id);
    } else if (chapters.length > 0 && !chapters.some((c) => c.id === selectedChapterId)) {
      setSelectedChapterId(chapters[0].id);
    }
  }, [chapters, selectedChapterId]);

  const activeChapter = chapters.find((c) => c.id === selectedChapterId) || chapters[0];

  const loadContents = useServerFn(fetchChapterContents);
  const contentsQuery = useQuery({
    queryKey: ["contents", courseId, activeSubject?.id, activeChapter?.id],
    enabled: Boolean(activeSubject?.id && activeChapter?.id),
    queryFn: () =>
      loadContents({
        data: {
          courseId,
          subjectId: activeSubject.id,
          chapterId: activeChapter.id,
          chapterSlug: activeChapter.slug ?? undefined,
        },
      }),
    retry: false,
  });

  const lessons = useMemo(
    () => (contentsQuery.data?.status === "ok" ? contentsQuery.data.lessons : []),
    [contentsQuery.data],
  );

  useEffect(() => {
    if (activeChapter?.id && lessons.length > 0) {
      studentStore.registerChapterLessons(
        courseId,
        activeChapter.id,
        lessons.map((l) => l.id),
      );
    }
  }, [courseId, activeChapter?.id, lessons]);

  if (subjectRefs.length === 0) return null;

  return (
    <div className="mt-6 rounded-3xl bg-card p-4 ring-1 ring-border shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Video className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Course Lessons &amp; Video Lectures
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Earn +25 XP per lecture &bull; Watch anytime
            </p>
          </div>
        </div>

        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
          <Sparkles className="size-2.5" /> +25 XP / video
        </span>
      </div>

      {/* Subject Filter Tabs (if multiple subjects) */}
      {subjectRefs.length > 1 ? (
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {subjectRefs.map((sub, idx) => (
            <button
              key={`${sub.id}-${idx}`}
              type="button"
              onClick={() => {
                setSelectedSubjectId(sub.id);
                setSelectedChapterId("");
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                activeSubject?.id === sub.id
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      ) : null}

      {/* Chapter Pills (if available) */}
      {chapters.length > 1 ? (
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {chapters.map((ch, idx) => (
            <button
              key={`${ch.id}-${idx}`}
              type="button"
              onClick={() => setSelectedChapterId(ch.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition ${
                activeChapter?.id === ch.id
                  ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                  : "bg-background text-muted-foreground ring-1 ring-border hover:text-foreground"
              }`}
            >
              <ChapterProgressIndicator
                courseId={courseId}
                chapterId={ch.id}
                totalLectures={ch.videoCount}
                size="xs"
              />
              <span>{ch.title}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Active Chapter Progress Summary Card */}
      {activeChapter && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted/30 p-2.5 ring-1 ring-border/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <ChapterProgressIndicator
              courseId={courseId}
              chapterId={activeChapter.id}
              totalLectures={activeChapter.videoCount || lessons.length}
              knownLessonIds={lessons.map((l) => l.id)}
              size="sm"
            />
            <div className="min-w-0">
              <span className="text-xs font-bold text-foreground block truncate">
                {activeChapter.title}
              </span>
              <span className="text-[10px] text-muted-foreground">Chapter Lecture Progress</span>
            </div>
          </div>
          <ChapterProgressIndicator
            courseId={courseId}
            chapterId={activeChapter.id}
            totalLectures={activeChapter.videoCount || lessons.length}
            knownLessonIds={lessons.map((l) => l.id)}
            size="xs"
            showLabel={true}
            displayMode="fraction"
          />
        </div>
      )}

      {/* Loading state */}
      {chaptersQuery.isLoading || contentsQuery.isLoading ? (
        <div className="mt-3">
          <ListSkeleton count={2} />
        </div>
      ) : null}

      {/* Lesson list in dedicated cards */}
      {!contentsQuery.isLoading && lessons.length > 0 ? (
        <div className="mt-3 space-y-2.5">
          {lessons.map((lesson, idx) => (
            <LessonCard
              key={`${lesson.id}-${idx}`}
              courseId={courseId}
              lesson={{
                ...lesson,
                posterUrl: lesson.posterUrl || courseThumbnail,
              }}
              subjectId={activeSubject?.id}
              chapterId={activeChapter?.id}
              chapterTitle={activeChapter?.title}
              isEnrolled={isEnrolled}
            />
          ))}
        </div>
      ) : null}

      {!contentsQuery.isLoading && lessons.length === 0 && !chaptersQuery.isLoading ? (
        <p className="mt-3 text-xs text-muted-foreground py-2 text-center">
          No published video lectures in this chapter yet.
        </p>
      ) : null}
    </div>
  );
}

function SubjectBlock({
  courseId,
  subject,
  isEnrolled,
}: {
  courseId: string;
  subject: { id: string; name: string; lectureCount: number | null; teachers: string[] };
  isEnrolled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const loadChapters = useServerFn(fetchChapters);

  const chapters = useQuery({
    queryKey: ["chapters", courseId, subject.id],
    enabled: open,
    queryFn: () => loadChapters({ data: { courseId, subjectId: subject.id } }),
    retry: false,
  });

  const list = chapters.data?.status === "ok" ? chapters.data.chapters : [];

  return (
    <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{subject.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {subject.lectureCount !== null ? `${subject.lectureCount} lectures` : "Chapters"}
            {subject.teachers.length ? ` · ${subject.teachers.join(", ")}` : ""}
          </p>
        </div>
        <ChevronRight
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open ? (
        <div className="mt-2.5 space-y-2">
          {chapters.isLoading ? <ListSkeleton count={2} /> : null}
          {chapters.isError || chapters.data?.status === "unavailable" ? (
            <StateCard
              tone="warn"
              title="Chapters unavailable"
              body="The chapter list couldn't be loaded right now."
              action={<RetryButton onClick={() => chapters.refetch()} />}
            />
          ) : null}
          {chapters.data?.status === "ok" && list.length === 0 ? (
            <StateCard
              title="No chapters published"
              body="This subject has no published chapters."
            />
          ) : null}
          {list.map((chapter, idx) =>
            isEnrolled ? (
              <div
                key={`${chapter.id}-${idx}`}
                className="rounded-xl bg-background p-3 ring-1 ring-border/50"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenChapter((value) => (value === chapter.id ? null : chapter.id))
                  }
                  className="flex w-full items-center justify-between gap-2.5 text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <ChapterProgressIndicator
                      courseId={courseId}
                      chapterId={chapter.id}
                      totalLectures={chapter.videoCount}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 text-[13px] font-semibold text-foreground block truncate">
                      {chapter.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-muted-foreground">
                    <span>{chapter.videoCount ?? 0} videos</span>
                    <span>·</span>
                    <span>{chapter.noteCount ?? 0} notes</span>
                    {chapter.dppCount ? (
                      <>
                        <span>·</span>
                        <span className="text-blue-500 font-semibold">{chapter.dppCount} DPPs</span>
                      </>
                    ) : null}
                    <ChevronRight
                      className={`size-3.5 transition-transform ${openChapter === chapter.id ? "rotate-90" : ""}`}
                    />
                  </div>
                </button>
                {openChapter === chapter.id ? (
                  <ChapterContents
                    courseId={courseId}
                    subjectId={subject.id}
                    chapterId={chapter.id}
                    chapterSlug={chapter.slug ?? undefined}
                    isEnrolled={isEnrolled}
                  />
                ) : null}
              </div>
            ) : (
              <div
                key={`${chapter.id}-${idx}`}
                className="flex items-center justify-between gap-2.5 rounded-xl bg-background/60 p-2.5 text-[13px] text-muted-foreground"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <ChapterProgressIndicator
                    courseId={courseId}
                    chapterId={chapter.id}
                    totalLectures={chapter.videoCount}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 truncate">{chapter.title}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                  <LockIcon className="size-3.5 text-locked" />
                  <span>{chapter.videoCount ?? 0} videos</span>
                </div>
              </div>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function ChapterContents({
  courseId,
  subjectId,
  chapterId,
  chapterSlug,
  isEnrolled,
}: {
  courseId: string;
  subjectId: string;
  chapterId: string;
  chapterSlug?: string;
  isEnrolled?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"lectures" | "notes" | "dpp">("lectures");
  const [selectedTest, setSelectedTest] = useState<NormalizedDppTest | null>(null);
  const enrolled = isEnrolled ?? studentStore.isEnrolled(courseId);
  const load = useServerFn(fetchChapterContents);
  const contents = useQuery({
    queryKey: ["contents", courseId, subjectId, chapterId],
    queryFn: () => load({ data: { courseId, subjectId, chapterId, chapterSlug } }),
    retry: false,
  });

  const isOk = contents.data?.status === "ok";
  const lessons = useMemo(() => (isOk ? contents.data.lessons : []), [isOk, contents.data]);
  const notes = isOk ? contents.data.notes : [];
  const dppNotes = isOk ? contents.data.dppNotes : [];
  const dppVideos = isOk ? contents.data.dppVideos : [];
  const dppTests = isOk ? contents.data.dppTests : [];
  const dppTotal = (dppNotes?.length ?? 0) + (dppVideos?.length ?? 0) + (dppTests?.length ?? 0);

  useEffect(() => {
    if (lessons.length > 0) {
      studentStore.registerChapterLessons(
        courseId,
        chapterId,
        lessons.map((l) => l.id),
      );
    }
  }, [courseId, chapterId, lessons]);

  if (contents.isLoading)
    return (
      <div className="mt-2.5">
        <ListSkeleton count={1} />
      </div>
    );

  if (contents.isError || contents.data?.status === "unavailable") {
    return (
      <p className="mt-2.5 text-[12px] text-muted-foreground">
        Content couldn't be loaded for this chapter.
      </p>
    );
  }
  if (!isOk) return null;

  if (lessons.length === 0 && notes.length === 0 && dppTotal === 0) {
    return (
      <p className="mt-2.5 text-[12px] text-muted-foreground">
        Nothing published in this chapter yet.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      {/* Chapter Progress Summary Bar */}
      {lessons.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-card p-2.5 ring-1 ring-border/70 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <ChapterProgressIndicator
              courseId={courseId}
              chapterId={chapterId}
              totalLectures={lessons.length}
              knownLessonIds={lessons.map((l) => l.id)}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground leading-tight">
                Chapter Lecture Progress
              </p>
              <p className="text-[10px] text-muted-foreground">Saved in local state</p>
            </div>
          </div>
          <ChapterProgressIndicator
            courseId={courseId}
            chapterId={chapterId}
            totalLectures={lessons.length}
            knownLessonIds={lessons.map((l) => l.id)}
            size="xs"
            showLabel={true}
            displayMode="fraction"
          />
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("lectures")}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition ${
            activeTab === "lectures"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Video className="size-3" />
          <span>Lectures ({lessons.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition ${
            activeTab === "notes"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="size-3" />
          <span>Notes ({notes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dpp")}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition ${
            activeTab === "dpp"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="size-3" />
          <span>DPP &amp; Tests ({dppTotal})</span>
        </button>
      </div>

      {/* Lectures Tab with LessonCard */}
      {activeTab === "lectures" && (
        <div className="space-y-2.5">
          {lessons.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No video lectures uploaded yet.</p>
          ) : (
            lessons.map((lesson, idx) => (
              <LessonCard
                key={`${lesson.id}-${idx}`}
                courseId={courseId}
                lesson={lesson}
                subjectId={subjectId}
                chapterId={chapterId}
                isEnrolled={enrolled}
              />
            ))
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === "notes" && (
        <div className="space-y-2">
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No class notes uploaded yet.</p>
          ) : (
            notes.map((note, idx) => (
              <div
                key={`${note.id}-${idx}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-card p-2.5 ring-1 ring-border"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{note.title}</p>
                    <span className="text-[10px] text-muted-foreground">
                      Class Lecture PDF Notes
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={note.url}
                    target="_blank"
                    rel="noreferrer"
                    className="press flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition"
                    title="Open Notes in new tab"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                  <a
                    href={note.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="press flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 transition"
                    title="Download Notes"
                  >
                    <Download className="size-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* DPP & Practice Tests Tab */}
      {activeTab === "dpp" && (
        <div className="space-y-3">
          {/* DPP PDFs */}
          {dppNotes && dppNotes.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                DPP Sheets (PDF)
              </span>
              {dppNotes.map((dpp, idx) => (
                <div
                  key={`${dpp.id}-${idx}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-card p-2.5 ring-1 ring-border border-l-2 border-l-blue-500"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{dpp.title}</p>
                      <span className="text-[10px] text-muted-foreground">
                        Daily Practice Problem PDF
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={dpp.url}
                      target="_blank"
                      rel="noreferrer"
                      className="press flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition"
                      title="Open DPP in new tab"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                    <a
                      href={dpp.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="press flex size-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 transition"
                      title="Download DPP PDF"
                    >
                      <Download className="size-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DPP Video Solutions */}
          {dppVideos && dppVideos.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                DPP Video Solutions
              </span>
              {dppVideos.map((dppVid, idx) => (
                <Link
                  key={`${dppVid.id}-${idx}`}
                  to="/lesson/$courseId/$lessonId"
                  params={{ courseId, lessonId: dppVid.id }}
                  search={{ subjectId, chapterId }}
                  className="press group flex items-center justify-between gap-3 rounded-xl bg-card p-2.5 ring-1 ring-border border-l-2 border-l-purple-500 transition hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-md bg-black/80 ring-1 ring-border">
                      {dppVid.posterUrl ? (
                        <img
                          src={dppVid.posterUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-purple-500/10 text-purple-600">
                          <Play className="size-3.5 fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{dppVid.title}</p>
                      {dppVid.durationFormatted ? (
                        <span className="text-[10px] text-muted-foreground">
                          {dppVid.durationFormatted}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-purple-600 group-hover:translate-x-0.5 transition">
                    Watch Solution →
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* DPP Online Practice Tests */}
          {dppTests && dppTests.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                DPP Online Tests
              </span>
              {dppTests.map((test, idx) => (
                <div
                  key={`${test.id}-${idx}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-card p-2.5 ring-1 ring-border border-l-2 border-l-emerald-500"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Layers className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{test.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {test.totalQuestions ? `${test.totalQuestions} questions` : "Practice Test"}
                        {test.totalMarks ? ` · ${test.totalMarks} marks` : ""}
                        {test.maxDuration ? ` · ${test.maxDuration} mins` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTest(test)}
                    className="press shrink-0 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition"
                  >
                    Start Test →
                  </button>
                </div>
              ))}
            </div>
          )}

          {dppTotal === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              No DPPs published for this chapter yet.
            </p>
          )}
        </div>
      )}

      {selectedTest ? (
        <DppPracticeTestModal test={selectedTest} onClose={() => setSelectedTest(null)} />
      ) : null}
    </div>
  );
}
