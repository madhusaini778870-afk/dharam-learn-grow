import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchCourses } from "@/services/courseApi";
import { CATEGORIES, type Category } from "@/services/courseNormalizer";
import { CourseCard } from "@/components/CourseCard";
import { Screen, Footer, PageHeader, SearchIcon } from "@/components/app-shell";
import { ListSkeleton, RetryButton, StateCard } from "@/components/states";
import { AddBatchDialog } from "@/components/AddBatchDialog";
import { Plus, Sparkles, ExternalLink } from "lucide-react";

export function CoursesPage({
  category,
  onCategoryChange,
  title = "Vidyaverse Courses",
  subtitle = "High-definition video lectures & courses from https://vidya-verse.ai.studio/",
  lockedCategory = false,
}: {
  category: Category | undefined;
  onCategoryChange: (next: Category | undefined) => void;
  title?: string;
  subtitle?: string;
  lockedCategory?: boolean;
}) {
  const loadCourses = useServerFn(fetchCourses);
  const selectedSource = "vidyaverse";
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const [addBatchOpen, setAddBatchOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(term.trim()), 400);
    return () => clearTimeout(timer);
  }, [term]);

  const catalog = useInfiniteQuery({
    queryKey: ["infinite-courses", query, category ?? "all", selectedSource],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      loadCourses({
        data: {
          q: query,
          cursor: pageParam as number,
          source: selectedSource,
          ...(category ? { category } : {}),
        },
      }),
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const courses = useMemo(() => {
    if (!catalog.data?.pages || !Array.isArray(catalog.data.pages)) return [];
    return catalog.data.pages
      .filter((page): page is NonNullable<typeof page> => Boolean(page))
      .flatMap((page) => (Array.isArray(page?.courses) ? page.courses : []))
      .filter((course): course is NonNullable<typeof course> => Boolean(course && course.id));
  }, [catalog.data]);

  const failed = Array.isArray(catalog.data?.pages)
    ? catalog.data.pages.some((page) => page?.state?.status === "error")
    : false;

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (
        entries.some((entry) => entry.isIntersecting) &&
        catalog.hasNextPage &&
        !catalog.isFetchingNextPage
      ) {
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
        {/* Source Info Banner */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 p-2.5 text-[11px] text-muted-foreground ring-1 ring-border/40">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-foreground">Verified Source:</span>
            <a
              href="https://vidya-verse.ai.studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-sky-500 dark:text-sky-400 hover:underline"
            >
              <span>Vidyaverse (Selection Way)</span>
              <ExternalLink className="size-2.5" />
            </a>
            <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-500">
              Direct HLS &amp; MP4 Streams
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAddBatchOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 active:scale-95 transition"
          >
            <Plus className="size-3" />
            <span>Add Batch / URL</span>
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2.5 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-border focus-within:ring-primary transition">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search courses, teachers (Gagan Sir, Aman Sir...) or topics…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={() => setAddBatchOpen(true)}
            title="Add Batch from Vidyaverse or PW Gemtara"
            className="flex items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-3 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90 active:scale-95 transition shrink-0"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add Batch</span>
          </button>
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

          {!catalog.isLoading && !catalog.isError && !failed && (courses?.length ?? 0) === 0 ? (
            <StateCard
              title="No matching courses"
              body="Nothing published matches this category or search."
            />
          ) : null}

          {(courses ?? []).map((course) => (
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
      <AddBatchDialog open={addBatchOpen} onOpenChange={setAddBatchOpen} />
      <Footer />
    </Screen>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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
