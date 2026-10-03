import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  fetchChapterContents,
  fetchCourseDetail,
  fetchScheduleDetails,
  type NormalizedDppTest,
} from "@/services/courseApi";
import { fetchVideoChatMessagesServer } from "@/services/videoChatService";
import { studentStore } from "@/services/studentStore";
import { gamificationStore } from "@/services/gamificationStore";
import { useAuth } from "@/hooks/useAuth";
import { SourcePlayer } from "@/components/SourcePlayer";
import { DoubtSolverSheet } from "@/components/doubt-solver";
import { VideoChatSection } from "@/components/VideoChatSection";
import { TopGamificationBar } from "@/components/TopGamificationBar";
import { DppPracticeTestModal } from "@/components/DppPracticeTestModal";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  FileText,
  Download,
  ExternalLink,
  Bot,
  Video,
  BookOpen,
  MessageSquare,
  Sparkles,
  Info,
  Layers,
  Play,
  Clock,
  Bookmark,
  Star,
} from "lucide-react";
import { ListSkeleton, RetryButton, StateCard } from "@/components/states";

type LessonSearch = { subjectId: string; chapterId: string };

export const Route = createFileRoute("/lesson/$courseId/$lessonId")({
  validateSearch: (search: Record<string, unknown>): LessonSearch => ({
    subjectId: String(search["subjectId"] ?? ""),
    chapterId: String(search["chapterId"] ?? ""),
  }),
  head: () => ({
    meta: [
      { title: "Video Lesson · Source Player" },
      {
        name: "description",
        content:
          "Watch lecture with the high-performance source video player and access chapter notes.",
      },
      { property: "og:title", content: "Video Lesson · Source Player" },
      {
        property: "og:description",
        content: "High quality lecture streaming, notes and AI doubt solver.",
      },
    ],
  }),
  component: LessonScreen,
});

function LessonScreen() {
  const { courseId, lessonId } = Route.useParams();
  const { subjectId, chapterId } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchCourse = useServerFn(fetchCourseDetail);
  const loadContents = useServerFn(fetchChapterContents);
  const getSchedule = useServerFn(fetchScheduleDetails);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "notes" | "dpp" | "overview">("chat");
  const [selectedTest, setSelectedTest] = useState<NormalizedDppTest | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [initialPos, setInitialPos] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentPlaySeconds, setCurrentPlaySeconds] = useState(0);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  const fetchChat = useServerFn(fetchVideoChatMessagesServer);
  const chatQuery = useQuery({
    queryKey: ["videoChat", courseId, lessonId],
    queryFn: () => fetchChat({ data: { courseId, lessonId } }),
    refetchInterval: 5000,
  });
  const chatCount = chatQuery.data?.status === "ok" ? chatQuery.data.count : 0;

  // Initialize progress and enrollment from store
  useEffect(() => {
    const enrolled = studentStore.isEnrolled(courseId);
    setIsEnrolled(enrolled);

    const prog = studentStore.getLessonProgress(courseId, lessonId);
    if (prog) {
      setIsCompleted(prog.completed);
      setInitialPos(prog.secondsWatched || 0);
    }
  }, [courseId, lessonId]);

  const course = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourse({ data: { courseId } }),
    retry: false,
  });

  const contents = useQuery({
    queryKey: ["contents", courseId, subjectId, chapterId],
    enabled: Boolean(subjectId && chapterId),
    queryFn: () => loadContents({ data: { courseId, subjectId, chapterId } }),
    retry: false,
  });

  const detail = course.data?.status === "ok" ? course.data.course : null;

  // Auto-enroll user when detail is available so playback and tracking start immediately
  useEffect(() => {
    if (detail && !isEnrolled) {
      studentStore.enrollCourse(detail).then(() => {
        setIsEnrolled(true);
      });
    }
  }, [detail, isEnrolled]);

  const lesson =
    contents.data?.status === "ok"
      ? (contents.data.lessons.find(
          (item) =>
            item.id === lessonId ||
            (item as any).classId === lessonId ||
            (item as any)._id === lessonId ||
            item.title === lessonId,
        ) ?? null)
      : null;

  // Fetch schedule details if lesson not found in chapter contents or has no videoUrl
  const scheduleQuery = useQuery({
    queryKey: ["scheduleDetails", courseId, subjectId, lessonId],
    queryFn: () => getSchedule({ data: { courseId, subjectId: subjectId || undefined, lessonId } }),
    enabled: !lesson || !lesson.videoUrl,
    retry: 1,
  });

  const scheduleLesson = scheduleQuery.data?.status === "ok" ? scheduleQuery.data.lesson : null;
  const resolvedLesson = useMemo(() => {
    return (
      (lesson?.videoUrl ? lesson : scheduleLesson) ||
      lesson ||
      scheduleLesson || {
        id: lessonId,
        title: detail?.title ? `${detail.title} - Lecture` : "Lecture",
        videoUrl: null,
        videoType: "direct" as const,
        posterUrl: detail?.thumbnail ?? null,
      }
    );
  }, [lesson, scheduleLesson, lessonId, detail?.title, detail?.thumbnail]);

  const chapterNotes = contents.data?.status === "ok" ? contents.data.notes : [];
  const chapterDppNotes = contents.data?.status === "ok" ? (contents.data.dppNotes ?? []) : [];
  const chapterDppVideos = contents.data?.status === "ok" ? (contents.data.dppVideos ?? []) : [];
  const chapterDppTests = contents.data?.status === "ok" ? (contents.data.dppTests ?? []) : [];
  const totalDppCount = chapterDppNotes.length + chapterDppTests.length + chapterDppVideos.length;

  const lessonList = contents.data?.status === "ok" ? contents.data.lessons : [];
  const currentIndex = lessonList.findIndex((item) => item.id === lessonId);
  const prevLesson = currentIndex > 0 ? lessonList[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < lessonList.length - 1 ? lessonList[currentIndex + 1] : null;

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    setIsBookmarked(studentStore.isBookmarked(lessonId));
    setRating(studentStore.getLectureRating(lessonId));

    const handleBookmarksUpdated = () => {
      setIsBookmarked(studentStore.isBookmarked(lessonId));
    };
    const handleRatingsUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ lessonId: string; rating: number }>;
      if (custom.detail?.lessonId === lessonId) {
        setRating(custom.detail.rating);
      } else {
        setRating(studentStore.getLectureRating(lessonId));
      }
    };

    window.addEventListener("dharam_bookmarks_updated", handleBookmarksUpdated);
    window.addEventListener("dharam_ratings_updated", handleRatingsUpdated);
    return () => {
      window.removeEventListener("dharam_bookmarks_updated", handleBookmarksUpdated);
      window.removeEventListener("dharam_ratings_updated", handleRatingsUpdated);
    };
  }, [lessonId]);

  const handleToggleBookmark = () => {
    const res = studentStore.toggleBookmark({
      courseId,
      lessonId,
      title: resolvedLesson.title,
      courseTitle: detail?.title,
      subjectId,
      chapterId,
    });
    setIsBookmarked(res);
  };

  const handleSetRating = (score: number) => {
    studentStore.setLectureRating(lessonId, score);
    setRating(score);
  };

  // Toggle lesson completed
  const handleToggleComplete = async () => {
    const next = !isCompleted;
    setIsCompleted(next);
    await studentStore.markCompleted(courseId, lessonId, next);
    if (next) {
      gamificationStore.awardLectureCompletion(courseId, lessonId);
    }
    queryClient.invalidateQueries({ queryKey: ["student_progress"] });
  };

  // Watch position update
  const handleTimeUpdate = (seconds: number, duration: number) => {
    setCurrentPlaySeconds(seconds);
    studentStore.saveWatchPosition(courseId, lessonId, seconds, duration, {
      title: resolvedLesson?.title,
      courseTitle: detail?.title,
      subjectId,
      chapterId,
      thumbnail: resolvedLesson?.posterUrl || detail?.thumbnail || null,
    });
  };

  useEffect(() => {
    if (resolvedLesson?.title) {
      studentStore.recordRecentLecture({
        courseId,
        lessonId: resolvedLesson.id,
        title: resolvedLesson.title,
        courseTitle: detail?.title ?? "Course",
        subjectId: subjectId || undefined,
        chapterId: chapterId || undefined,
        thumbnail: resolvedLesson.posterUrl || detail?.thumbnail || null,
        timestampSeconds: initialPos,
        durationSeconds: resolvedLesson.durationSeconds,
      });
    }
  }, [
    resolvedLesson,
    courseId,
    lessonId,
    detail?.title,
    detail?.thumbnail,
    subjectId,
    chapterId,
    initialPos,
  ]);

  const handleSeekTo = (sec: number) => {
    setSeekTarget(sec);
    setTimeout(() => setSeekTarget(null), 300);
  };

  // Quick enroll
  const handleEnrollNow = async () => {
    if (!detail) return;
    await studentStore.enrollCourse(detail);
    setIsEnrolled(true);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[520px] bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-card/60 backdrop-blur">
        <Link
          to="/course/$courseId"
          params={{ courseId }}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition shrink-0"
        >
          <ChevronLeft className="size-4" />
          <span className="truncate max-w-[120px] sm:max-w-[180px]">
            {detail?.title ?? "Course"}
          </span>
        </Link>

        {/* Top XP & Daily Streak Tracker */}
        <TopGamificationBar compact />

        {isEnrolled ? (
          <button
            onClick={handleToggleComplete}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
              isCompleted
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="size-3.5" />
                <span>Done</span>
              </>
            ) : (
              <>
                <Circle className="size-3.5" />
                <span>Mark Done</span>
              </>
            )}
          </button>
        ) : null}
      </div>

      <div className="flex-1">
        {course.isLoading || contents.isLoading ? (
          <div className="p-5">
            <ListSkeleton count={1} />
          </div>
        ) : null}

        {course.isError || course.data?.status === "unavailable" ? (
          <div className="p-5">
            <StateCard
              tone="warn"
              title="Course unavailable"
              body="The course information could not be retrieved. Please try again."
              action={<RetryButton onClick={() => course.refetch()} />}
            />
          </div>
        ) : null}

        {resolvedLesson ? (
          <div>
            {/* 1. Persistent Source Video Player on top */}
            <div className="sticky top-0 z-20 bg-background shadow-xs">
              <SourcePlayer
                key={lessonId}
                videoUrl={resolvedLesson.videoUrl ?? null}
                videoType={resolvedLesson.videoType ?? "direct"}
                playerEmbedUrl={resolvedLesson.playerEmbedUrl ?? null}
                title={resolvedLesson.title}
                teacherName={
                  resolvedLesson.teacherName ||
                  (detail?.teachers && detail.teachers.length > 0
                    ? detail.teachers.join(", ")
                    : null)
                }
                batchTitle={detail?.title ?? null}
                posterUrl={resolvedLesson.posterUrl ?? detail?.thumbnail ?? null}
                initialPosition={initialPos}
                seekTarget={seekTarget}
                batchId={courseId}
                subjectId={subjectId}
                scheduleId={lessonId}
                mp4Recordings={resolvedLesson.mp4Recordings}
                isLoadingSource={Boolean(
                  !resolvedLesson.videoUrl &&
                  (course.isLoading || contents.isLoading || scheduleQuery.isLoading),
                )}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                  setIsCompleted(true);
                  studentStore.markCompleted(courseId, lessonId, true);
                  gamificationStore.awardLectureCompletion(courseId, lessonId);
                }}
              />
            </div>

            {/* 2. Lecture Navigation Bar (Previous/Next Lecture, Rating & Bookmark) */}
            <div className="flex items-center justify-between gap-2 border-b border-border bg-card/70 px-3.5 py-2">
              {/* Previous / Next Lecture Navigation */}
              <div className="flex items-center gap-1.5">
                {prevLesson ? (
                  <Link
                    to="/lesson/$courseId/$lessonId"
                    params={{ courseId, lessonId: prevLesson.id }}
                    search={{ subjectId, chapterId }}
                    className="press inline-flex items-center gap-1 rounded-xl bg-muted px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition"
                    title={`Previous: ${prevLesson.title}`}
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Previous</span>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground opacity-50 cursor-not-allowed">
                    <ChevronLeft className="size-3.5" />
                    <span>Previous</span>
                  </span>
                )}

                {nextLesson ? (
                  <Link
                    to="/lesson/$courseId/$lessonId"
                    params={{ courseId, lessonId: nextLesson.id }}
                    search={{ subjectId, chapterId }}
                    className="press inline-flex items-center gap-1 rounded-xl bg-amber-500/15 px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition ring-1 ring-amber-500/30"
                    title={`Next: ${nextLesson.title}`}
                  >
                    <span>Next Lecture</span>
                    <ChevronRight className="size-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground opacity-50 cursor-not-allowed">
                    <span>Next Lecture</span>
                    <ChevronRight className="size-3.5" />
                  </span>
                )}
              </div>

              {/* Lecture Rating & Bookmark Controls */}
              <div className="flex items-center gap-2">
                {/* 5-Star Interactive Rating */}
                <div
                  className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-1"
                  title="Rate this lecture"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleSetRating(star)}
                      className={`p-0.5 transition hover:scale-120 ${
                        (rating || 0) >= star
                          ? "text-amber-500"
                          : "text-muted-foreground/60 hover:text-amber-400"
                      }`}
                      aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`size-3.5 ${(rating || 0) >= star ? "fill-amber-500" : ""}`}
                      />
                    </button>
                  ))}
                </div>

                {/* Bookmark Toggle */}
                <button
                  type="button"
                  onClick={handleToggleBookmark}
                  className={`press flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                    isBookmarked
                      ? "bg-amber-500 text-black shadow-xs font-bold"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  title={isBookmarked ? "Remove Bookmark" : "Bookmark this lecture"}
                >
                  <Bookmark className={`size-3.5 ${isBookmarked ? "fill-current" : ""}`} />
                  <span className="hidden sm:inline">{isBookmarked ? "Saved" : "Save"}</span>
                </button>
              </div>
            </div>

            {/* 3. Lecture Title & Quick Actions */}
            <div className="border-b border-border bg-card/60 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      {detail?.category ?? "Study"} Lecture
                    </span>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" /> Completed
                      </span>
                    ) : null}
                  </div>
                  <h1 className="mt-1 font-display text-base font-bold leading-tight">
                    {resolvedLesson.title}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="press flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 transition hover:bg-amber-500/25"
                >
                  <Bot className="size-3.5" />
                  <span>Ask AI</span>
                </button>
              </div>

              {/* Verified Playback at 3 Time Points Quick Test */}
              <div className="mt-3 rounded-xl bg-amber-500/10 p-2.5 ring-1 ring-amber-500/20">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
                    Check Video at 3 Time Points
                  </span>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                    Auto-Plays Instant Video
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSeekTo(15)}
                    className="flex flex-col items-start p-2 rounded-lg bg-background hover:bg-amber-500/15 hover:ring-amber-500/40 ring-1 ring-border text-left transition shadow-xs group"
                  >
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <Play className="size-2.5 fill-current" /> 00:15
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate w-full group-hover:text-foreground">
                      Point 1: Intro
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSeekTo(150)}
                    className="flex flex-col items-start p-2 rounded-lg bg-background hover:bg-amber-500/15 hover:ring-amber-500/40 ring-1 ring-border text-left transition shadow-xs group"
                  >
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <Play className="size-2.5 fill-current" /> 02:30
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate w-full group-hover:text-foreground">
                      Point 2: Theory
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSeekTo(300)}
                    className="flex flex-col items-start p-2 rounded-lg bg-background hover:bg-amber-500/15 hover:ring-amber-500/40 ring-1 ring-border text-left transition shadow-xs group"
                  >
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <Play className="size-2.5 fill-current" /> 05:00
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate w-full group-hover:text-foreground">
                      Point 3: Practice
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Section Navigation Tabs */}
            <div className="flex border-b border-border bg-muted/30 px-3 overflow-x-auto">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === "chat"
                    ? "border-amber-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="size-3.5" />
                <span>Live Chat</span>
                <span className="flex items-center gap-1 ml-1 rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {chatCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("notes")}
                className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === "notes"
                    ? "border-amber-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="size-3.5" />
                <span>Notes ({chapterNotes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("dpp")}
                className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === "dpp"
                    ? "border-amber-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="size-3.5" />
                <span>DPP &amp; Tests ({totalDppCount})</span>
              </button>

              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === "overview"
                    ? "border-amber-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Info className="size-3.5" />
                <span>Overview</span>
              </button>
            </div>

            {/* 4. Tab Contents */}
            {/* Live Chat Tab */}
            {activeTab === "chat" ? (
              <div className="p-4 animate-in fade-in duration-150">
                <VideoChatSection
                  courseId={courseId}
                  lessonId={resolvedLesson.id}
                  lessonTitle={resolvedLesson.title}
                  currentPlaySeconds={currentPlaySeconds}
                  onSeekTo={handleSeekTo}
                  onOpenDoubtSolver={() => setSheetOpen(true)}
                />
              </div>
            ) : null}

            {/* Chapter Notes Tab */}
            {activeTab === "notes" ? (
              <div className="p-4 space-y-4 animate-in fade-in duration-150">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <BookOpen className="size-3.5 text-amber-500" />
                    <span>Class Notes (PDF)</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px]">
                      {chapterNotes.length}
                    </span>
                  </div>

                  {chapterNotes.length === 0 ? (
                    <div className="rounded-xl bg-card p-6 text-center ring-1 ring-border text-xs text-muted-foreground">
                      No class notes published for this lecture yet.
                    </div>
                  ) : (
                    chapterNotes.map((note, idx) => (
                      <div
                        key={`${note.id}-${idx}`}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <FileText className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {note.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground">
                              Class Lecture PDF Notes
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={note.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="press flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition"
                            title="Open Notes in new tab"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                          <a
                            href={note.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="press flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition"
                            title="Download Notes"
                          >
                            <Download className="size-4" />
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {/* DPP & Practice Tests Tab */}
            {activeTab === "dpp" ? (
              <div className="p-4 space-y-4 animate-in fade-in duration-150">
                {/* 1. DPP Online Practice Tests */}
                {chapterDppTests.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Layers className="size-3.5 text-emerald-500" />
                      <span>DPP Online Practice Tests</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px]">
                        {chapterDppTests.length}
                      </span>
                    </div>
                    {chapterDppTests.map((test, idx) => (
                      <div
                        key={`${test.id}-${idx}`}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-xs border-l-2 border-l-emerald-500"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Layers className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {test.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {test.totalQuestions
                                ? `${test.totalQuestions} questions`
                                : "Practice Test"}
                              {test.totalMarks ? ` · ${test.totalMarks} marks` : ""}
                              {test.maxDuration ? ` · ${test.maxDuration} mins` : ""}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedTest(test)}
                          className="press flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                        >
                          <span>Start Test</span>
                          <Play className="size-3 fill-current" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Daily Practice Problems (DPP PDF) */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <FileText className="size-3.5 text-blue-500" />
                    <span>Daily Practice Problems (DPP Sheets)</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px]">
                      {chapterDppNotes.length}
                    </span>
                  </div>

                  {chapterDppNotes.length === 0 &&
                  chapterDppTests.length === 0 &&
                  chapterDppVideos.length === 0 ? (
                    <div className="rounded-xl bg-card p-6 text-center ring-1 ring-border text-xs text-muted-foreground">
                      No DPPs published for this chapter yet.
                    </div>
                  ) : null}

                  {chapterDppNotes.map((dpp, idx) => (
                    <div
                      key={`${dpp.id}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-xs border-l-2 border-l-blue-500"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <FileText className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {dpp.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            DPP · PDF Practice Sheet
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={dpp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="press flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition"
                          title="Open DPP in new tab"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                        <a
                          href={dpp.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="press flex size-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25 transition"
                          title="Download DPP PDF"
                        >
                          <Download className="size-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. DPP Video Solutions */}
                {chapterDppVideos.length > 0 ? (
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Video className="size-3.5 text-purple-500" />
                      <span>DPP Video Solutions</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px]">
                        {chapterDppVideos.length}
                      </span>
                    </div>
                    {chapterDppVideos.map((dppVid, idx) => (
                      <Link
                        key={`${dppVid.id}-${idx}`}
                        to="/lesson/$courseId/$lessonId"
                        params={{ courseId, lessonId: dppVid.id }}
                        search={{ subjectId, chapterId }}
                        className="press flex items-center justify-between gap-3 rounded-2xl bg-card p-3 ring-1 ring-border"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {dppVid.posterUrl ? (
                            <img
                              src={dppVid.posterUrl}
                              alt=""
                              className="size-10 rounded-lg object-cover ring-1 ring-border shrink-0"
                            />
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                              <Video className="size-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-foreground">
                              {dppVid.title}
                            </p>
                            {dppVid.durationFormatted ? (
                              <span className="text-[10px] text-muted-foreground">
                                {dppVid.durationFormatted}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-purple-600">Watch ↗</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Overview & Doubts Tab */}
            {activeTab === "overview" ? (
              <div className="p-4 space-y-4 animate-in fade-in duration-150">
                <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Lecture Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-muted/50 p-2.5">
                      <span className="text-[10px] text-muted-foreground">Course</span>
                      <p className="font-semibold text-foreground truncate">
                        {detail?.title ?? "Course"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-2.5">
                      <span className="text-[10px] text-muted-foreground">Category</span>
                      <p className="font-semibold text-foreground">
                        {detail?.category ?? "General"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-xs">
                    <span className="text-muted-foreground">Completion Status</span>
                    <button
                      onClick={handleToggleComplete}
                      className={`flex items-center gap-1.5 font-semibold ${
                        isCompleted
                          ? "text-emerald-500"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="size-4" />
                          <span>Marked Complete</span>
                        </>
                      ) : (
                        <>
                          <Circle className="size-4" />
                          <span>Mark as Complete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Doubt Solver card */}
                <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 ring-1 ring-amber-500/25 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
                    <Bot className="size-5" />
                    <span>AI Doubt Solver</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Stuck on a concept in this lecture? Ask our AI Tutor to break it down
                    step-by-step with formulas and examples.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="press mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-xs font-semibold text-background shadow transition hover:opacity-90"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Open AI Doubt Assistant</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <footer className="mt-auto py-6 text-center text-[11px] text-muted-foreground">
        Dharam Bhai Study · By Lakshya Prince
      </footer>

      {sheetOpen && resolvedLesson ? (
        <DoubtSolverSheet
          context={{
            courseId,
            courseTitle: detail?.title ?? "Course",
            subjectName: subjectId
              ? (detail?.subjectRefs.find((s) => s.id === subjectId)?.name ?? subjectId)
              : "General",
            chapterTitle: chapterId ?? null,
            lessonId: resolvedLesson.id,
            lessonTitle: resolvedLesson.title,
            lessonContext: resolvedLesson.transcript ?? null,
            timestampSeconds: currentPlaySeconds,
          }}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}

      {selectedTest ? (
        <DppPracticeTestModal
          test={selectedTest}
          chapterTitle={resolvedLesson?.title}
          onClose={() => setSelectedTest(null)}
        />
      ) : null}
    </main>
  );
}
