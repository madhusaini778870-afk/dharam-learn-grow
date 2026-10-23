import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchCourses } from "@/services/courseApi";
import { useAuth } from "@/hooks/useAuth";
import {
  Screen,
  Footer,
  SearchIcon,
  FolderIcon,
  DocIcon,
  LiveIcon,
  SparkIcon,
} from "@/components/app-shell";
import { CourseCard } from "@/components/CourseCard";
import { ListSkeleton, RetryButton, StateCard } from "@/components/states";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home · Dharam Bhai Study" },
      {
        name: "description",
        content:
          "Your JEE and NEET study home: search courses, open featured batches, notes, live classes and the AI doubt solver.",
      },
      { property: "og:title", content: "Home · Dharam Bhai Study" },
      {
        property: "og:description",
        content: "Search courses, open JEE and NEET sections, notes and the AI doubt solver.",
      },
    ],
  }),
  component: HomeScreen,
});

function HomeScreen() {
  const { session, loading, user } = useAuth();
  const navigate = useNavigate();
  const loadCatalog = useServerFn(fetchCourses);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  const featured = useQuery({
    queryKey: ["courses", "", "all"],
    queryFn: () => loadCatalog({ data: { cursor: 1 } }),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const firstName = (user?.user_metadata?.["full_name"] as string | undefined)?.split(" ")[0];

  return (
    <Screen>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-[-70px] size-64 rounded-full bg-lamp/15 blur-2xl" />
        <div className="pointer-events-none absolute -top-14 right-0 size-32 rounded-full bg-lamp/25 blur-xl" />

        <div className="relative px-5 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-foreground">
                <span className="font-display text-lg leading-none text-background">D</span>
              </div>
              <div className="leading-tight">
                <p className="font-display text-base leading-none">Dharam Bhai Study</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Learn · Practice · Grow</p>
              </div>
            </div>
            <Link
              to="/profile"
              className="grid size-9 place-items-center rounded-full bg-card text-[11px] font-semibold text-muted-foreground ring-1 ring-border"
            >
              {(firstName?.[0] ?? user?.email?.[0] ?? "S").toUpperCase()}
            </Link>
          </div>

          <Link
            to="/search"
              search={{ category: undefined }}
            className="mt-5 flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-border"
          >
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Search courses, chapters, notes…</span>
          </Link>

          <div className="mt-5 flex rounded-2xl bg-foreground p-1">
            {(["JEE", "NEET", "Class 11", "Class 12"] as const).map((item) => (
              <Link
                key={item}
                to="/courses"
                search={{ category: item }}
                className="flex-1 rounded-xl py-2.5 text-center text-[12px] font-semibold text-background/60"
              >
                {item}
              </Link>
            ))}
          </div>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Quick access
          </p>
          <div className="mt-2.5 grid grid-cols-4 gap-2.5">
            <Tile to="/my-learning" icon={<FolderIcon className="size-4" />} label={"My\nLearning"} tone="lamp" />
            <Tile to="/books" icon={<DocIcon className="size-4" />} label={"Books\n& Notes"} tone="pine" />
            <Tile to="/live" icon={<LiveIcon className="size-4" />} label={"Live\nClasses"} tone="lamp" />
            <Tile to="/doubt-solver" icon={<SparkIcon className="size-4" />} label={"AI Doubt\nSolver"} tone="pine" />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="font-display text-lg">Featured courses</h2>
            <Link
              to="/courses"
              search={{ category: undefined }}
              className="text-xs font-medium text-muted-foreground"
            >
              See all
            </Link>
          </div>

          <div className="mt-3 space-y-3">
            {featured.isLoading ? <ListSkeleton count={2} /> : null}
            {featured.isError ? (
              <StateCard
                tone="warn"
                title="Network error"
                body="We couldn't reach the course service. Check your connection and try again."
                action={<RetryButton onClick={() => featured.refetch()} />}
              />
            ) : null}
            {featured.data?.courses.slice(0, 4).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </Screen>
  );
}

function Tile({
  to,
  icon,
  label,
  tone,
}: {
  to: "/my-learning" | "/books" | "/live" | "/doubt-solver";
  icon: React.ReactNode;
  label: string;
  tone: "lamp" | "pine";
}) {
  return (
    <Link to={to} className="press rounded-2xl bg-card p-3 ring-1 ring-border">
      <div
        className={`grid size-8 place-items-center rounded-lg ${
          tone === "lamp" ? "bg-lamp/15 text-lamp-deep" : "bg-pine/12 text-pine"
        }`}
      >
        {icon}
      </div>
      <p className="mt-2 whitespace-pre-line text-[11px] font-medium leading-tight text-muted-foreground">
        {label}
      </p>
    </Link>
  );
}
