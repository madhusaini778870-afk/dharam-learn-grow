import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchCourses } from "@/services/courseApi";
import { applyOverrides, loadAdminCourses, loadOverrides } from "@/services/adminCatalog";
import { CATEGORIES, matchesQuery, type Category } from "@/services/courseNormalizer";
import { CourseCard } from "@/components/CourseCard";
import { Screen, Footer, PageHeader, SearchIcon } from "@/components/app-shell";
import { ListSkeleton, RetryButton, StateCard } from "@/components/states";


export function CoursesPage({
  category,
  onCategoryChange,
  title = "All Courses",
  subtitle = "Publicly listed batches from the connected source",
  lockedCategory = false,
}: {
  category: Category | undefined;
  onCategoryChange: (next: Category | undefined) => void;
  title?: string;
  subtitle?: string;
  lockedCategory?: boolean;
}) {
  const loadCourses = useServerFn(fetchCourses);
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(term.trim()), 400);
    return () => clearTimeout(timer);
  }, [term]);

  const catalog = useInfiniteQuery({
    queryKey: ["courses", query, category ?? "all"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      loadCourses({
        data: category
          ? { q: query, category, cursor: pageParam as number }
          : { q: query, cursor: pageParam as number },
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    retry: false,
    staleTime: 5 * 60_000,
  });

  // Courses added inside Dharam Bhai Study by an admin, plus the admin's
  // hide/rename decisions for courses coming from the public source.
  const added = useQuery({
    queryKey: ["admin-courses"],
    queryFn: loadAdminCourses,
    staleTime: 60_000,
  });
  const overrides = useQuery({
    queryKey: ["course-overrides"],
    queryFn: loadOverrides,
    staleTime: 60_000,
  });

  const courses = useMemo(() => {
    const fromSource = applyOverrides(
      catalog.data?.pages.flatMap((page) => page.courses) ?? [],
      overrides.data,
    );
    const fromAdmin = (added.data ?? []).filter(
      (course) =>
        (!category || course.category === category) && matchesQuery(course, query),
    );
    return [...fromAdmin, ...fromSource];
  }, [catalog.data, overrides.data, added.data, category, query]);
  const failed = catalog.data?.pages.some((page) => page.state.status === "error") ?? false;

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && catalog.hasNextPage && !catalog.isFetchingNextPage) {
        void catalog.fetchNextPage();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [catalog.hasNextPage, catalog.isFetchingNextPage, catalog]);

  return (
    <Screen>
      <PageHeader title={title} subtitle={subtitle} />

      <div className="px-5">
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-border">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search all courses…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {lockedCategory ? null : (
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
        )}

        <div className="mt-4 space-y-3">
          {catalog.isLoading ? <ListSkeleton count={4} /> : null}

          {catalog.isError || failed ? (
            <StateCard
              tone="warn"
              title="Couldn't load courses"
              body="The course source could not be reached. Check your connection and try again."
              action={<RetryButton onClick={() => catalog.refetch()} />}
            />
          ) : null}

          {!catalog.isLoading && !catalog.isError && !failed && courses.length === 0 ? (
            <StateCard
              title="No matching courses"
              body="Nothing published matches this category or search."
            />
          ) : null}

          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}

          {catalog.isFetchingNextPage ? <ListSkeleton count={2} /> : null}

          {catalog.hasNextPage ? (
            <>
              <button
                type="button"
                onClick={() => void catalog.fetchNextPage()}
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
