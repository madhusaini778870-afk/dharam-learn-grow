import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchCourseDetail } from "@/services/courseApi";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, SparkIcon } from "@/components/app-shell";
import { ListSkeleton, RetryButton, StateCard } from "@/components/states";
import { DoubtSolverSheet } from "@/components/doubt-solver";
import lessonBackdrop from "@/assets/lesson-backdrop.jpg";

export const Route = createFileRoute("/lesson/$courseId/$lessonId")({
  head: () => ({
    meta: [
      { title: "Video lesson · Dharam Bhai Study" },
      {
        name: "description",
        content: "Watch your lesson and open the AI Doubt Solver for step-by-step help on what you just saw.",
      },
      { property: "og:title", content: "Video lesson · Dharam Bhai Study" },
      { property: "og:description", content: "Watch your lesson and ask doubts with lesson context." },
    ],
  }),
  component: LessonScreen,
});

function LessonScreen() {
  const { courseId, lessonId } = Route.useParams();
  const { session, loading, user } = useAuth();
  const navigate = useNavigate();
  const fetchCourse = useServerFn(fetchCourseDetail);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  const course = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourse({ data: { courseId } }),
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

  const detail = course.data?.status === "ok" ? course.data.course : null;
  const chapter = detail?.chapters?.find((item) => item.lessons?.some((l) => l.id === lessonId));
  const lesson = chapter?.lessons?.find((l) => l.id === lessonId) ??
    detail?.lessons.find((l) => l.id === lessonId);
  const isEnrolled = Boolean(enrollment.data);

  async function saveProgress() {
    if (!user || !lesson) return;
    const seconds = Math.floor(videoRef.current?.currentTime ?? 0);
    const duration = videoRef.current?.duration ?? 0;
    await supabase.from("lesson_progress").upsert(
      {
        user_id: user.id,
        course_id: courseId,
        lesson_id: lesson.id,
        seconds_watched: seconds,
        completed: duration > 0 && seconds >= duration - 5,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[520px] bg-night text-paper">
      <div className="px-5 pt-5">
        <Link
          to="/course/$courseId"
          params={{ courseId }}
          className="inline-flex items-center gap-1.5 text-xs text-paper/70"
        >
          <ChevronLeft className="size-4" />
          {detail?.title ?? "Course"}
        </Link>
      </div>

      <div className="mt-4">
        {course.isLoading ? (
          <div className="px-5">
            <ListSkeleton count={1} />
          </div>
        ) : null}

        {course.isError || course.data?.status === "unavailable" ? (
          <div className="px-5 pb-8">
            <div className="rounded-3xl bg-paper/5 px-6 py-8 text-center ring-1 ring-paper/10">
              <p className="font-display text-lg">Lesson unavailable</p>
              <p className="mx-auto mt-2 max-w-[30ch] text-[13px] text-paper/60">
                This lesson can't be loaded because an authorized data endpoint is required.
              </p>
              <div className="mt-5">
                <RetryButton onClick={() => course.refetch()} />
              </div>
            </div>
          </div>
        ) : null}

        {detail && !lesson ? (
          <div className="px-5">
            <div className="rounded-3xl bg-paper/5 px-6 py-8 text-center ring-1 ring-paper/10">
              <p className="font-display text-lg">Lesson not found</p>
              <p className="mt-2 text-[13px] text-paper/60">
                This lesson isn't part of the data returned for this course.
              </p>
            </div>
          </div>
        ) : null}

        {lesson && !isEnrolled ? (
          <div className="px-5">
            <div className="rounded-3xl bg-paper/5 px-6 py-8 text-center ring-1 ring-paper/10">
              <p className="font-display text-lg">Locked lesson</p>
              <p className="mt-2 text-[13px] text-paper/60">
                Enroll in this course to watch its lessons.
              </p>
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
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              {lesson.videoUrl ? (
                <video
                  ref={videoRef}
                  src={lesson.videoUrl}
                  controls
                  playsInline
                  onPause={saveProgress}
                  onEnded={saveProgress}
                  className="size-full"
                />
              ) : (
                <div className="relative size-full">
                  <img
                    src={lessonBackdrop}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 grid place-items-center px-6 text-center">
                    <div>
                      <p className="font-display text-lg">Video unavailable</p>
                      <p className="mt-1.5 text-[12px] text-paper/60">
                        The authorized source did not supply a playable video for this lesson.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 pt-5">
              <p className="text-xs text-paper/50">{chapter?.title}</p>
              <h1 className="mt-1.5 font-display text-2xl leading-tight text-balance">{lesson.title}</h1>
              {lesson.durationSeconds ? (
                <p className="mt-1 text-xs text-paper/40">
                  {Math.round(lesson.durationSeconds / 60)} min
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="press mt-5 grid h-12 w-full place-items-center rounded-2xl bg-paper/10 text-sm font-medium ring-1 ring-paper/20"
              >
                🤖 AI Doubt Solver
              </button>

              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-paper/5 p-3.5 ring-1 ring-paper/10">
                <SparkIcon className="size-4 shrink-0 text-primary" />
                <p className="text-[12px] text-paper/60">
                  Your question is sent with this lesson's title and any authorized transcript.
                </p>
              </div>
            </div>
          </>
        ) : null}

        {detail === null && !course.isLoading && !course.isError && course.data?.status === "ok" ? (
          <div className="px-5">
            <StateCard title="Lesson unavailable" body="No lesson data was returned." />
          </div>
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
            timestampSeconds: videoRef.current?.currentTime ?? null,
          }}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </main>
  );
}
