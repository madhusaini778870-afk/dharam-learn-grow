import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchChapterContents, fetchCourseDetail } from "@/services/courseApi";
import { loadAdminCourse } from "@/services/adminCatalog";
import {
  formatClock,
  parseCompositeId,
  type NormalizedLesson,
  type NormalizedNote,
} from "@/services/courseNormalizer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft } from "@/components/app-shell";
import { ListSkeleton, RetryButton } from "@/components/states";
import { DoubtSolverSheet } from "@/components/doubt-solver";
import { VideoPlayer, type PlayerHandle } from "@/components/video-player";
import lessonBackdrop from "@/assets/lesson-backdrop.jpg";

type LessonSearch = { subjectId: string; chapterId: string };

export const Route = createFileRoute("/lesson/$courseId/$lessonId")({
  validateSearch: (search: Record<string, unknown>): LessonSearch => ({
    subjectId: String(search["subjectId"] ?? ""),
    chapterId: String(search["chapterId"] ?? ""),
  }),
  head: () => ({
    meta: [
      { title: "Video lesson · Dharam Bhai Study" },
      {
        name: "description",
        content:
          "Watch your lecture, open its notes and ask the AI Doubt Solver about what you just saw.",
      },
      { property: "og:title", content: "Video lesson · Dharam Bhai Study" },
      { property: "og:description", content: "Watch your lecture, open notes and ask doubts." },
    ],
  }),
  component: LessonScreen,
});

function LessonScreen() {
  const { courseId, lessonId } = Route.useParams();
  const { subjectId, chapterId } = Route.useSearch();
  const { session, loading, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchCourse = useServerFn(fetchCourseDetail);
  const loadContents = useServerFn(fetchChapterContents);
  const parsed = parseCompositeId(courseId);
  const isAdminCourse = parsed?.source === "admin";

  const [tab, setTab] = useState<"lecture" | "notes">("lecture");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const handleRef = useRef<PlayerHandle | null>(null);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  const course = useQuery({
    queryKey: ["course", courseId],
    enabled: !isAdminCourse,
    queryFn: () => fetchCourse({ data: { courseId } }),
    retry: false,
  });

  const addedCourse = useQuery({
    queryKey: ["admin-course", courseId],
    enabled: isAdminCourse,
    queryFn: () => loadAdminCourse(parsed!.sourceCourseId),
    retry: false,
  });

  const contents = useQuery({
    queryKey: ["contents", courseId, subjectId, chapterId],
    enabled: !isAdminCourse && Boolean(subjectId && chapterId),
    queryFn: () => loadContents({ data: { courseId, subjectId, chapterId } }),
    retry: false,
  });

  const enrollment = useQuery({
    queryKey: ["enrollment", user?.id, courseId],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const progress = useQuery({
    queryKey: ["lesson-progress", user?.id, lessonId],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("position_seconds, seconds_watched, completed, duration_seconds")
        .eq("lesson_id", lessonId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const detailTitle = isAdminCourse ? addedCourse.data?.title : course.data?.status === "ok" ? course.data.course.title : null;

  const { lessons, notes } = useMemo((): {
    lessons: NormalizedLesson[];
    notes: NormalizedNote[];
  } => {
    if (isAdminCourse) {
      const chapter = addedCourse.data?.chapters.find((item) => item.id === chapterId);
      const list = chapter?.lessons ?? addedCourse.data?.lessons ?? [];
      const chapterNotes: NormalizedNote[] = [
        ...list
          .filter((lesson) => lesson.notesUrl)
          .map((lesson) => ({
            id: `${lesson.id}-notes`,
            title: `${lesson.title} — notes`,
            url: lesson.notesUrl!,
          })),
        ...(addedCourse.data?.notes ?? []),
      ];
      return { lessons: list, notes: chapterNotes };
    }
    if (contents.data?.status === "ok") {
      return { lessons: contents.data.lessons, notes: contents.data.notes };
    }
    return { lessons: [], notes: [] };
  }, [isAdminCourse, addedCourse.data, contents.data, chapterId]);

  const lesson = lessons.find((item) => item.id === lessonId) ?? null;
  const isEnrolled = Boolean(enrollment.data);
  const busy = isAdminCourse ? addedCourse.isLoading : course.isLoading || contents.isLoading;
  const broken = isAdminCourse
    ? addedCourse.isError
    : course.isError || course.data?.status === "unavailable" || contents.data?.status === "unavailable";
  const resumeAt = progress.data?.position_seconds ?? progress.data?.seconds_watched ?? 0;
  const completed = progress.data?.completed === true;

  const save = useCallback(
    async (seconds: number, duration: number, markCompleted?: boolean) => {
      if (!user || !lesson) return;
      const position = Math.floor(seconds);
      const total = Math.floor(duration || lesson.durationSeconds || 0);
      const done = markCompleted === true || (total > 0 && position >= total - 15);
      await supabase.from("lesson_progress").upsert(
        {
          user_id: user.id,
          course_id: courseId,
          lesson_id: lesson.id,
          lesson_title: lesson.title,
          subject_id: subjectId || null,
          chapter_id: chapterId || null,
          position_seconds: position,
          seconds_watched: Math.max(position, progress.data?.seconds_watched ?? 0),
          duration_seconds: total > 0 ? total : null,
          completed: done,
          completed_at: done ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      );
      await supabase
        .from("enrollments")
        .update({
          last_lesson_id: lesson.id,
          last_lesson_title: lesson.title,
          last_subject_id: subjectId || null,
          last_chapter_id: chapterId || null,
          last_watched_at: new Date().toISOString(),
        })
        .eq("course_id", courseId);
      queryClient.invalidateQueries({ queryKey: ["lesson-progress", user.id, lesson.id] });
      queryClient.invalidateQueries({ queryKey: ["progress", user.id] });
      queryClient.invalidateQueries({ queryKey: ["enrollments", user.id] });
    },
    [user, lesson, courseId, subjectId, chapterId, progress.data?.seconds_watched, queryClient],
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-[520px] bg-night text-paper">
      <div className="px-5 pt-5">
        <Link
          to="/course/$courseId"
          params={{ courseId }}
          className="inline-flex items-center gap-1.5 text-xs text-paper/70"
        >
          <ChevronLeft className="size-4" />
          {detailTitle ?? "Course"}
        </Link>
      </div>

      <div className="mt-4">
        {busy ? (
          <div className="px-5">
            <ListSkeleton count={1} />
          </div>
        ) : null}

        {broken ? (
          <div className="px-5 pb-8">
            <div className="rounded-3xl bg-paper/5 px-6 py-8 text-center ring-1 ring-paper/10">
              <p className="font-display text-lg">Lecture unavailable</p>
              <p className="mx-auto mt-2 max-w-[30ch] text-[13px] text-paper/60">
                This lecture couldn't be loaded right now. Please try again.
              </p>
              <div className="mt-5">
                <RetryButton
                  onClick={() => {
                    void (isAdminCourse ? addedCourse.refetch() : contents.refetch());
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {!busy && !broken && !lesson ? (
          <div className="px-5">
            <div className="rounded-3xl bg-paper/5 px-6 py-8 text-center ring-1 ring-paper/10">
              <p className="font-display text-lg">Lecture not found</p>
              <p className="mt-2 text-[13px] text-paper/60">
                This lecture is not part of the published data for this chapter.
              </p>
            </div>
          </div>
        ) : null}

        {lesson && !isEnrolled ? (
          <div className="px-5">
            <div className="rounded-3xl bg-paper/5 px-6 py-8 text-center ring-1 ring-paper/10">
              <p className="font-display text-lg">Locked lecture</p>
              <p className="mt-2 text-[13px] text-paper/60">Enroll in this course to watch it.</p>
              <Link
                to="/course/$courseId"
                params={{ courseId }}
                className="press mt-5 inline-flex rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Go to course
              </Link>
            </div>
          </div>
        ) : null}

        {lesson && isEnrolled ? (
          <>
            {lesson.playback === "direct" && lesson.videoUrl ? (
              <VideoPlayer
                src={lesson.videoUrl}
                poster={lesson.posterUrl}
                startAt={resumeAt}
                onHandle={(handle) => {
                  handleRef.current = handle;
                }}
                onProgress={(seconds, duration) => void save(seconds, duration)}
                onEnded={(duration) => void save(duration, duration, true)}
              />
            ) : lesson.playback === "embed" && lesson.embedUrl ? (
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={lesson.embedUrl}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="size-full"
                />
              </div>
            ) : (
              <div className="relative aspect-video w-full bg-black">
                <img
                  src={lessonBackdrop}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover opacity-40"
                />
                <div className="absolute inset-0 grid place-items-center px-6 text-center">
                  <div>
                    <p className="font-display text-lg">Video not publicly available</p>
                    <p className="mt-1.5 text-[12px] text-paper/60">
                      The source did not publish a playable video for this lecture.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="px-5 pt-5">
              <h1 className="font-display text-2xl leading-tight text-balance">{lesson.title}</h1>
              <p className="mt-1 text-xs text-paper/45">
                {[
                  lesson.teacher,
                  lesson.durationSeconds ? formatClock(lesson.durationSeconds) : null,
                  resumeAt > 5 && !completed ? `Resumes at ${formatClock(resumeAt)}` : null,
                  completed ? "Completed" : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Lecture"}
              </p>

              <div className="mt-4 flex gap-2 rounded-2xl bg-paper/8 p-1">
                <TabButton active={tab === "lecture"} onClick={() => setTab("lecture")}>
                  Lecture
                </TabButton>
                <TabButton active={tab === "notes"} onClick={() => setTab("notes")}>
                  Notes ({notes.length})
                </TabButton>
              </div>

              {tab === "lecture" ? (
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() =>
                      void save(
                        handleRef.current?.currentTime() ?? lesson.durationSeconds ?? 0,
                        lesson.durationSeconds ?? 0,
                        !completed,
                      ).then(() => setSaveNote(completed ? "Marked as not finished" : "Marked as completed"))
                    }
                    className={`press w-full rounded-2xl py-3.5 text-sm font-semibold ${
                      completed
                        ? "bg-pine text-paper"
                        : "bg-paper/10 text-paper ring-1 ring-paper/20"
                    }`}
                  >
                    {completed ? "✓ Completed" : "Mark as completed"}
                  </button>
                  {saveNote ? <p className="text-[12px] text-paper/60">{saveNote}</p> : null}

                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="press grid h-12 w-full place-items-center rounded-2xl bg-paper/10 text-sm font-medium ring-1 ring-paper/20"
                  >
                    🤖 AI Doubt Solver
                  </button>

                  <p className="text-[11px] text-paper/45">
                    Lectures in this chapter: {lessons.length}
                  </p>
                  <div className="space-y-1.5">
                    {lessons
                      .filter((item) => item.id !== lesson.id)
                      .map((item) => (
                        <Link
                          key={item.id}
                          to="/lesson/$courseId/$lessonId"
                          params={{ courseId, lessonId: item.id }}
                          search={{ subjectId, chapterId }}
                          className="press block truncate rounded-2xl bg-paper/5 px-3.5 py-2.5 text-[12px] ring-1 ring-paper/10"
                        >
                          {item.title}
                        </Link>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {notes.length === 0 ? (
                    <p className="rounded-2xl bg-paper/5 px-4 py-6 text-center text-[12px] text-paper/60 ring-1 ring-paper/10">
                      No notes were published for this chapter.
                    </p>
                  ) : null}
                  {notes.map((note) => (
                    <a
                      key={note.id}
                      href={note.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="press block rounded-2xl bg-paper/8 px-4 py-3 text-[13px] ring-1 ring-paper/10"
                    >
                      📄 {note.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      <p className="py-10 text-center text-[11px] tracking-wide text-paper/35">
        Dharam Bhai Study · By Lakshya Prince
      </p>

      {sheetOpen && lesson ? (
        <DoubtSolverSheet
          context={{
            courseId,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonContext: lesson.transcript ?? null,
            timestampSeconds: handleRef.current?.currentTime() ?? null,
          }}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-colors ${
        active ? "bg-paper text-night" : "text-paper/70"
      }`}
    >
      {children}
    </button>
  );
}
