import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCourse } from "@/lib/catalog.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Screen, PageHeader, LockIcon, ChevronRight, Footer } from "@/components/app-shell";
import { CatalogUnavailable, ListSkeleton, RetryButton, StateCard } from "@/components/states";

export const Route = createFileRoute("/course/$courseId")({
  head: () => ({
    meta: [
      { title: "Course details · Dharam Bhai Study" },
      {
        name: "description",
        content: "Course subjects, chapters and lessons from the authorized source. Enroll to unlock content.",
      },
      { property: "og:title", content: "Course details · Dharam Bhai Study" },
      { property: "og:description", content: "Course chapters and lessons. Enroll to unlock content." },
    ],
  }),
  component: CourseDetail,
});

function CourseDetail() {
  const { courseId } = Route.useParams();
  const { session, loading, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchCourse = useServerFn(getCourse);

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

  const enroll = useMutation({
    mutationFn: async () => {
      if (!user || course.data?.status !== "ok") throw new Error("Course unavailable");
      const detail = course.data.data;
      const { error } = await supabase.from("enrollments").insert({
        user_id: user.id,
        course_id: detail.id,
        course_title: detail.title,
        exam: detail.exam ?? null,
        thumbnail_url: detail.thumbnailUrl ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", user?.id, courseId] });
      queryClient.invalidateQueries({ queryKey: ["enrollments", user?.id] });
    },
  });

  const isEnrolled = Boolean(enrollment.data);
  const detail = course.data?.status === "ok" ? course.data.data : null;
  const chapters = detail?.chapters ?? [];
  const lessonCount = chapters.reduce((total, chapter) => total + (chapter.lessons?.length ?? 0), 0);

  return (
    <Screen>
      <PageHeader title="Course details" back="/courses" />

      <div className="mt-2 px-5">
        {course.isLoading ? <ListSkeleton count={2} /> : null}
        {course.isError ? (
          <StateCard
            title="Network error"
            body="We couldn't load this course. Check your connection and try again."
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
            <div className="flex gap-3.5">
              {detail.thumbnailUrl ? (
                <img
                  src={detail.thumbnailUrl}
                  alt={detail.title}
                  loading="lazy"
                  className="size-20 shrink-0 rounded-xl object-cover ring-1 ring-border"
                />
              ) : (
                <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-muted text-center text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  No cover
                </div>
              )}
              <div className="min-w-0 flex-1">
                {detail.exam || detail.subject ? (
                  <span className="rounded-md bg-lamp/15 px-2 py-0.5 text-[10px] font-semibold text-lamp-deep">
                    {[detail.exam, detail.subject].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
                <h2 className="mt-2 font-display text-[24px] leading-tight text-balance">{detail.title}</h2>
                {detail.educator ? (
                  <p className="mt-1 text-[12px] text-muted-foreground">{detail.educator}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <Stat value={String(chapters.length)} label="Chapters" />
              <Stat value={String(lessonCount)} label="Lessons" />
              <Stat value={detail.notes?.length ? "PDF" : "—"} label="Notes" />
            </div>

            {detail.description ? (
              <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">{detail.description}</p>
            ) : null}

            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Chapters
            </p>
            <div className="mt-2.5 space-y-2.5">
              {chapters.length === 0 ? (
                <StateCard title="No chapters provided" body="The authorized source returned no chapters for this course." />
              ) : null}
              {chapters.map((chapter) =>
                isEnrolled ? (
                  <div key={chapter.id} className="rounded-2xl bg-card p-3 ring-1 ring-border">
                    <p className="text-sm font-medium leading-tight">{chapter.title}</p>
                    <div className="mt-2 space-y-1.5">
                      {chapter.lessons?.map((lesson) => (
                        <Link
                          key={lesson.id}
                          to="/lesson/$courseId/$lessonId"
                          params={{ courseId: detail.id, lessonId: lesson.id }}
                          className="press flex items-center gap-2 rounded-xl bg-background px-3 py-2.5"
                        >
                          <span className="min-w-0 flex-1 truncate text-[13px]">{lesson.title}</span>
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
                      <p className="text-sm font-medium leading-tight text-muted-foreground">{chapter.title}</p>
                      {chapter.lessons?.length ? (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {chapter.lessons.length} lessons
                        </p>
                      ) : null}
                    </div>
                  </div>
                ),
              )}
            </div>

            {detail.notes?.length ? (
              <>
                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Notes
                </p>
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
                My Learning
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
                {enroll.isPending ? "Enrolling…" : "Enroll Now"}
              </button>
            </div>
          )}
        </div>
      ) : null}
      <Footer />
    </Screen>
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
