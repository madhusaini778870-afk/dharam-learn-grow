import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Screen, Footer, PageHeader, ChevronRight } from "@/components/app-shell";
import { ListSkeleton, RetryButton, StateCard } from "@/components/states";

/** Only courses the student explicitly enrolled in, stored on their account. */
export function MyCoursesPage() {
  const { session, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  const enrollments = useQuery({
    queryKey: ["enrollments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select(
          "id, course_id, course_title, exam, thumbnail_url, created_at, last_lesson_id, last_lesson_title, last_subject_id, last_chapter_id",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const progress = useQuery({
    queryKey: ["progress", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("course_id, lesson_id, completed");
      if (error) throw error;
      return data;
    },
  });

  return (
    <Screen>
      <PageHeader
        title="My Courses"
        subtitle={enrollments.data ? `${enrollments.data.length} enrolled` : "Your enrolled courses"}
      />

      <div className="mt-4 space-y-3 px-5">
        {enrollments.isLoading ? <ListSkeleton count={2} /> : null}
        {enrollments.isError ? (
          <StateCard
            title="Couldn't load your courses"
            body="We couldn't reach your account data. Please try again."
            action={<RetryButton onClick={() => enrollments.refetch()} />}
          />
        ) : null}
        {enrollments.data?.length === 0 ? (
          <StateCard
            title="No enrolled courses yet"
            body="Browse the catalog and press Enroll to see a course here."
            action={
              <Link
                to="/courses"
                search={{ category: undefined }}
                className="press inline-flex rounded-2xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
              >
                Browse courses
              </Link>
            }
          />
        ) : null}

        {enrollments.data?.map((item) => {
          const rows = progress.data?.filter((row) => row.course_id === item.course_id) ?? [];
          const done = rows.filter((row) => row.completed).length;
          const percent = rows.length > 0 ? Math.round((done / rows.length) * 100) : 0;
          return (
            <div key={item.id} className="rounded-3xl bg-card p-3 ring-1 ring-border">
            <Link
              to="/course/$courseId"
              params={{ courseId: item.course_id }}
              className="press flex items-center gap-3"
            >
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={item.course_title}
                  loading="lazy"
                  className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-border"
                />
              ) : (
                <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-muted text-center text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  No cover
                </div>
              )}
              <div className="min-w-0 flex-1">
                {item.exam ? (
                  <span className="rounded-md bg-lamp/15 px-2 py-0.5 text-[10px] font-semibold text-lamp-deep">
                    {item.exam}
                  </span>
                ) : null}
                <p className="mt-1 font-display text-[16px] leading-tight">{item.course_title}</p>
                {rows.length > 0 ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {done} of {rows.length} lessons completed
                  </p>
                ) : null}
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
      <Footer />
    </Screen>
  );
}

export default MyCoursesPage;
