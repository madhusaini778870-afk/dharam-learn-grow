import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCourses } from "@/lib/catalog.functions";
import { Screen, Footer, PageHeader } from "@/components/app-shell";
import { CourseCard } from "@/components/course-card";
import { CatalogUnavailable, ListSkeleton, RetryButton, StateCard } from "@/components/states";

type CourseSearch = { exam: "JEE" | "NEET" | undefined };

export const Route = createFileRoute("/courses")({
  validateSearch: (search: Record<string, unknown>): CourseSearch => ({
    exam: search["exam"] === "NEET" ? "NEET" : search["exam"] === "JEE" ? "JEE" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Courses · Dharam Bhai Study" },
      {
        name: "description",
        content: "Browse the complete JEE and NEET course catalog available from the authorized source.",
      },
      { property: "og:title", content: "Courses · Dharam Bhai Study" },
      { property: "og:description", content: "Browse the JEE and NEET course catalog." },
    ],
  }),
  component: CoursesScreen,
});

function CoursesScreen() {
  const { exam } = Route.useSearch();
  const fetchCourses = useServerFn(listCourses);

  const query = useInfiniteQuery({
    queryKey: ["courses", exam ?? "all"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchCourses({ data: { exam, page: pageParam } }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.status === "ok" && lastPage.data.hasMore ? allPages.length + 1 : undefined,
    retry: false,
  });

  const first = query.data?.pages[0];
  const courses =
    query.data?.pages.flatMap((page) => (page.status === "ok" ? page.data.courses : [])) ?? [];

  return (
    <Screen>
      <PageHeader title="Courses" subtitle="Choose an exam category" />

      <div className="px-5">
        <div className="mt-4 flex rounded-2xl bg-foreground p-1">
          {(["JEE", "NEET"] as const).map((item) => (
            <Link
              key={item}
              to="/courses"
              search={{ exam: item }}
              className={`flex-1 rounded-xl py-2.5 text-center text-sm ${
                exam === item
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "font-medium text-background/55"
              }`}
            >
              {item}
            </Link>
          ))}
        </div>
        {exam ? (
          <Link to="/courses" className="mt-2 inline-block text-[11px] text-muted-foreground">
            Show all exams
          </Link>
        ) : null}

        <div className="mt-4 space-y-3">
          {query.isLoading ? <ListSkeleton count={3} /> : null}
          {query.isError ? (
            <StateCard
              title="Network error"
              body="The catalog request failed. Check your connection and try again."
              action={<RetryButton onClick={() => query.refetch()} />}
            />
          ) : null}
          {first?.status === "unavailable" ? (
            <CatalogUnavailable reason={first.reason} onRetry={() => query.refetch()} />
          ) : null}
          {first?.status === "ok" && courses.length === 0 ? (
            <StateCard
              title="No courses in this category"
              body="The authorized source returned no courses for this exam."
            />
          ) : null}
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {query.hasNextPage ? (
            <button
              type="button"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="press w-full rounded-2xl bg-card py-3 text-sm font-semibold ring-1 ring-border"
            >
              {query.isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </div>
      </div>
      <Footer />
    </Screen>
  );
}
