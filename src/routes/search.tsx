import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchCatalogCourses } from "@/services/courseApi";
import { Screen, Footer, PageHeader, SearchIcon } from "@/components/app-shell";
import { CourseCard } from "@/components/CourseCard";
import { SourceStatusPanel } from "@/components/source-status";
import { ListSkeleton, RetryButton, StateCard } from "@/components/states";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search · Dharam Bhai Study" },
      {
        name: "description",
        content:
          "Search the complete combined catalog: courses, subjects, chapters, lessons, teachers and notes.",
      },
      { property: "og:title", content: "Search · Dharam Bhai Study" },
      { property: "og:description", content: "Search courses, chapters, lessons and notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchScreen,
});

function SearchScreen() {
  const runSearch = useServerFn(searchCatalogCourses);
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");

  const results = useQuery({
    queryKey: ["catalog-search", query],
    enabled: query.trim().length > 1,
    queryFn: () => runSearch({ data: { q: query.trim() } }),
    retry: false,
  });

  return (
    <Screen>
      <PageHeader title="Search" subtitle="The complete combined catalog" />

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
            placeholder="Search courses, chapters, teachers, notes…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </form>

      <div className="mt-4 space-y-3 px-5">
        {query.trim().length <= 1 ? (
          <StateCard
            title="Start typing"
            body="Search across courses, subjects, chapters, lessons, teachers and notes."
          />
        ) : null}
        {results.isLoading ? <ListSkeleton count={2} /> : null}
        {results.isError ? (
          <StateCard
            tone="warn"
            title="Search failed"
            body="We couldn't complete the search. Check your connection and try again."
            action={<RetryButton onClick={() => results.refetch()} />}
          />
        ) : null}
        {results.data ? (
          <SourceStatusPanel sources={results.data.sources} onRetry={() => results.refetch()} />
        ) : null}
        {results.data && results.data.courses.length === 0 &&
        results.data.sources.some((source) => source.status === "ok") ? (
          <StateCard title="No results" body={`Nothing matched “${query}” in the combined catalog.`} />
        ) : null}
        {results.data?.courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      <Footer />
    </Screen>
  );
}
