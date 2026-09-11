import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchCatalog } from "@/services/courseApi";
import { CATEGORIES, matchesQuery, type Category } from "@/services/courseNormalizer";
import { CourseCard } from "@/components/CourseCard";
import { SourceStatusPanel } from "@/components/source-status";
import { Screen, Footer, PageHeader, SearchIcon } from "@/components/app-shell";
import { ListSkeleton, RetryButton, StateCard } from "@/components/states";

const BATCH = 12;

export function CoursesPage({
  category,
  onCategoryChange,
}: {
  category: Category | undefined;
  onCategoryChange: (next: Category | undefined) => void;
}) {
  const loadCatalog = useServerFn(fetchCatalog);
  const [term, setTerm] = useState("");
  const [visible, setVisible] = useState(BATCH);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () => loadCatalog(),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const courses = useMemo(() => {
    const all = catalog.data?.courses ?? [];
    return all
      .filter((course) => (category ? course.category === category : true))
      .filter((course) => matchesQuery(course, term));
  }, [catalog.data, category, term]);

  useEffect(() => {
    setVisible(BATCH);
  }, [category, term]);

  // Infinite scroll over the fully loaded combined catalog.
  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible((current) => (current < courses.length ? current + BATCH : current));
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [courses.length]);

  const shown = courses.slice(0, visible);
  const sources = catalog.data?.sources ?? [];
  const anySourceOk = sources.some((source) => source.status === "ok");

  return (
    <Screen>
      <PageHeader title="Courses" subtitle="Combined catalog from both authorized sources" />

      <div className="px-5">
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-border">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search the full catalog…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip active={!category} label="All" onClick={() => onCategoryChange(undefined)} />
          {CATEGORIES.map((item) => (
            <Chip
              key={item}
              active={category === item}
              label={item}
              onClick={() => onCategoryChange(item)}
            />
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {catalog.isLoading ? <ListSkeleton count={4} /> : null}

          {catalog.isError ? (
            <StateCard
              tone="warn"
              title="Couldn't load the catalog"
              body="The course service could not be reached. Check your connection and try again."
              action={<RetryButton onClick={() => catalog.refetch()} />}
            />
          ) : null}

          {catalog.data ? (
            <SourceStatusPanel sources={sources} onRetry={() => catalog.refetch()} />
          ) : null}

          {catalog.data && anySourceOk && courses.length === 0 ? (
            <StateCard
              title="No matching courses"
              body="Nothing in the combined catalog matches this category or search."
            />
          ) : null}

          {shown.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}

          {visible < courses.length ? (
            <>
              <button
                type="button"
                onClick={() => setVisible((current) => current + BATCH)}
                className="press w-full rounded-2xl bg-card py-3 text-sm font-semibold ring-1 ring-border"
              >
                Load more
              </button>
              <div ref={sentinel} className="h-1" />
            </>
          ) : null}
        </div>
      </div>
      <Footer />
    </Screen>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold ring-1 transition-colors ${
        active
          ? "bg-foreground text-background ring-transparent"
          : "bg-card text-muted-foreground ring-border"
      }`}
    >
      {label}
    </button>
  );
}

export default CoursesPage;
