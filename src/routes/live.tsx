import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchTodaySchedule } from "@/services/courseApi";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Screen, Footer, PageHeader } from "@/components/app-shell";
import { ListSkeleton, RetryButton, StateCard } from "@/components/states";

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

function LiveScreen() {
  const { user } = useAuth();

  const enrollments = useQuery({
    queryKey: ["enrollments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("course_id, course_title")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Screen>
      <PageHeader title="Live Classes" subtitle="Today's schedule for your enrolled courses" />
      <div className="mt-4 space-y-3 px-5">
        {enrollments.isLoading ? <ListSkeleton count={2} /> : null}
        {enrollments.data && enrollments.data.length === 0 ? (
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
        {enrollments.data?.map((row) => (
          <CourseSchedule key={row.course_id} courseId={row.course_id} title={row.course_title} />
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
    <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border">
      <p className="text-sm font-semibold leading-tight">{title}</p>
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
        <p className="mt-1.5 text-[12px] text-muted-foreground">No classes listed for today.</p>
      ) : null}
      <div className="mt-2 space-y-1.5">
        {classes.map((item) => (
          <div key={item.id} className="rounded-xl bg-background px-3 py-2.5">
            <p className="text-[13px] leading-tight">{item.topic}</p>
            {item.startTime ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {item.startTime}
                {item.endTime ? ` – ${item.endTime}` : ""}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
