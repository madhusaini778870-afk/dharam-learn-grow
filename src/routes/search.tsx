import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchCatalog } from "@/lib/catalog.functions";
import { Screen, Footer, PageHeader, SearchIcon } from "@/components/app-shell";
import { CourseCard } from "@/components/course-card";
import { CatalogUnavailable, ListSkeleton, RetryButton, StateCard } from "@/components/states";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search · Dharam Bhai Study" },
      {
        name: "description",
        content: "Search courses, subjects, chapters, lessons and notes across the authorized catalog.",
      },
      { property: "og:title", content: "Search · Dharam Bhai Study" },
      { property: "og:description", content: "Search courses, chapters, lessons and notes." },
    ],
  }),
  component: SearchScreen,
});

function SearchScreen() {
  const runSearch = useServerFn(searchCatalog);
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");

  const results = useQuery({
    queryKey: ["search", query],
    enabled: query.trim().length > 1,
    queryFn: () => runSearch({ data: { q: query.trim() } }),
    retry: false,
  });

  return (
    <Screen>
      <PageHeader title="Search" subtitle="Courses, subjects, chapters, lessons and notes" />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(term);
        }}
        className="mt-4 px-5"
      >
        <div className="flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-border">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search courses, chapters, notes…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </form>

      <div className="mt-4 space-y-3 px-5">
        {query.trim().length <= 1 ? (
          <StateCard title="Start typing" body="Search across courses, subjects, chapters, lessons and notes." />
        ) : null}
        {results.isLoading && query ? <ListSkeleton count={2} /> : null}
        {results.isError ? (
          <StateCard
            title="Search failed"
            body="We couldn't complete the search. Check your connection and try again."
            action={<RetryButton onClick={() => results.refetch()} />}
          />
        ) : null}
        {results.data?.status === "unavailable" ? (
          <CatalogUnavailable reason={results.data.reason} onRetry={() => results.refetch()} />
        ) : null}
        {results.data?.status === "ok" ? (
          results.data.data.courses.length === 0 &&
          results.data.data.lessons.length === 0 &&
          results.data.data.notes.length === 0 ? (
            <StateCard title="No results" body={`Nothing matched “${query}” in the authorized catalog.`} />
          ) : (
            <>
              {results.data.data.courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
              {results.data.data.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  to="/lesson/$courseId/$lessonId"
                  params={{ courseId: lesson.courseId, lessonId: lesson.id }}
                  className="press block rounded-2xl bg-card p-4 ring-1 ring-border"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Lesson
                  </p>
                  <p className="mt-1 text-sm font-medium">{lesson.title}</p>
                </Link>
              ))}
              {results.data.data.notes.map((note) => (
                <a
                  key={note.id}
                  href={note.url}
                  target="_blank"
                  rel="noreferrer"
                  className="press block rounded-2xl bg-card p-4 ring-1 ring-border"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-1 text-sm font-medium">{note.title}</p>
                </a>
              ))}
            </>
          )
        ) : null}
      </div>
      <Footer />
    </Screen>
  );
}
