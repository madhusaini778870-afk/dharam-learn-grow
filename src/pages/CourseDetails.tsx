import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchCourseDetail } from "@/services/courseApi";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Screen, PageHeader, LockIcon, ChevronRight, Footer } from "@/components/app-shell";
import { ListSkeleton, RetryButton, StateCard } from "@/components/states";

export function CourseDetailsPage({ courseId }: { courseId: string }) {
  const { session, loading, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadCourse = useServerFn(fetchCourseDetail);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  const course = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => loadCourse({ data: { courseId } }),
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

  const enroll = useMutation({
    mutationFn: async () => {
      if (!user || !detail) throw new Error("Course unavailable");
      const { error } = await supabase.from("enrollments").insert({
        user_id: user.id,
        course_id: detail.id,
        course_title: detail.title,
        exam: detail.category,
        thumbnail_url: detail.thumbnail,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", user?.id, courseId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments", user?.id] });
    },
  });

  const isEnrolled = Boolean(enrollment.data);
  const chapters = detail?.chapters ?? [];

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
            <p className="mt-1 text-[11px] text-muted-foreground">Course ID · {detail.sourceCourseId}</p>

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

            <div className="mt-4 grid grid-cols-4 gap-2">
              <Stat value={String(detail.subjects.length)} label="Subjects" />
              <Stat value={String(chapters.length)} label="Chapters" />
              <Stat value={String(detail.lessons.length)} label="Lessons" />
              <Stat value={String(detail.notes.length)} label="Notes" />
            </div>

            {detail.subjects.length ? (
              <>
                <SectionTitle>Subjects</SectionTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detail.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-full bg-card px-3 py-1.5 text-[12px] font-medium ring-1 ring-border"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </>
            ) : null}

            <SectionTitle>Chapters &amp; lessons</SectionTitle>
            <div className="mt-2.5 space-y-2.5">
              {chapters.length === 0 ? (
                <StateCard
                  title="No chapters provided"
                  body="This source did not include chapter data for this course."
                />
              ) : null}
              {chapters.map((chapter) =>
                isEnrolled ? (
                  <div key={chapter.id} className="rounded-2xl bg-card p-3 ring-1 ring-border">
                    <p className="text-sm font-medium leading-tight">{chapter.title}</p>
                    <div className="mt-2 space-y-1.5">
                      {chapter.lessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          to="/lesson/$courseId/$lessonId"
                          params={{ courseId: detail.id, lessonId: lesson.id }}
                          className="press flex items-center gap-2 rounded-xl bg-background px-3 py-2.5"
                        >
                          <span className="min-w-0 flex-1 truncate text-[13px]">{lesson.title}</span>
                          {lesson.videoUrl ? (
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-pine">
                              Video
                            </span>
                          ) : null}
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    key={chapter.id}
                    className="flex items-center gap-3 rounded-2xl bg-card/60 p-3 ring-1 ring-border"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground/5 text-locked">
                      <LockIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight text-muted-foreground">
                        {chapter.title}
                      </p>
                      {chapter.lessons.length ? (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {chapter.lessons.length} lessons
                        </p>
                      ) : null}
                    </div>
                  </div>
                ),
              )}
            </div>

            {detail.notes.length ? (
              <>
                <SectionTitle>Notes &amp; PDFs</SectionTitle>
                <div className="mt-2.5 space-y-2.5">
                  {detail.notes.map((note) =>
                    isEnrolled ? (
                      <a
                        key={note.id}
                        href={note.url}
                        target="_blank"
                        rel="noreferrer"
                        className="press block rounded-2xl bg-card p-3.5 text-sm font-medium ring-1 ring-border"
                      >
                        {note.title}
                      </a>
                    ) : (
                      <div
                        key={note.id}
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
                <p className="text-sm font-semibold">{chapters.length} chapters</p>
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
