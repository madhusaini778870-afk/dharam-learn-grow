import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchCourseDetail } from "@/services/courseApi";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Screen, Footer, PageHeader, ChevronRight } from "@/components/app-shell";
import { ListSkeleton, StateCard } from "@/components/states";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Books & Notes · Dharam Bhai Study" },
      {
        name: "description",
        content: "Publicly available notes and PDFs published with the courses you are enrolled in.",
      },
      { property: "og:title", content: "Books & Notes · Dharam Bhai Study" },
      { property: "og:description", content: "Notes and PDFs from your enrolled courses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BooksScreen,
});

function BooksScreen() {
  const { user } = useAuth();

  const enrollments = useQuery({
    queryKey: ["enrollments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("course_id, course_title")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Screen>
      <PageHeader title="Books & Notes" subtitle="Notes published with your enrolled courses" />
      <div className="mt-4 space-y-3 px-5">
        {enrollments.isLoading ? <ListSkeleton count={2} /> : null}
        {enrollments.data && enrollments.data.length === 0 ? (
          <StateCard
            title="No notes yet"
            body="Enroll in a course to open the notes and PDFs published inside its chapters."
            action={
              <Link
                to="/courses"
                className="press inline-flex rounded-2xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground"
              >
                Browse courses
              </Link>
            }
          />
        ) : null}
        {enrollments.data?.map((row) => (
          <CourseNotes key={row.course_id} courseId={row.course_id} title={row.course_title} />
        ))}
      </div>
      <Footer />
    </Screen>
  );
}

function CourseNotes({ courseId, title }: { courseId: string; title: string }) {
  const load = useServerFn(fetchCourseDetail);
  const course = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => load({ data: { courseId } }),
    retry: false,
  });
  const detail = course.data?.status === "ok" ? course.data.course : null;

  return (
    <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border">
      <p className="text-sm font-semibold leading-tight">{title}</p>
      <div className="mt-2 space-y-1.5">
        {detail?.notes.map((note) => (
          <a
            key={note.id}
            href={note.url}
            target="_blank"
            rel="noreferrer"
            className="press block rounded-xl bg-background px-3 py-2.5 text-[13px]"
          >
            {note.title}
          </a>
        ))}
        <Link
          to="/course/$courseId"
          params={{ courseId }}
          className="press flex items-center gap-2 rounded-xl bg-background px-3 py-2.5 text-[13px]"
        >
          <span className="flex-1">Chapter notes &amp; PDFs</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
