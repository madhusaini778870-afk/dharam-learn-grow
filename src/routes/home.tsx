import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchCourses } from "@/services/courseApi";
import { getPublicAnnouncementsServer } from "@/services/adminService";
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
import { TopGamificationBar } from "@/components/TopGamificationBar";
import { AppRatingCard } from "@/components/AppRatingCard";
import { RecentLecturesSection } from "@/components/RecentLecturesSection";
import { AddBatchDialog } from "@/components/AddBatchDialog";
import { Plus } from "lucide-react";

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
  const loadAnnouncements = useServerFn(getPublicAnnouncementsServer);

  const featured = useQuery({
    queryKey: ["featured-courses", "vidyaverse"],
    queryFn: () => loadCatalog({ data: { cursor: 1, source: "vidyaverse" } }),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const announcements = useQuery({
    queryKey: ["announcements"],
    queryFn: () => loadAnnouncements(),
    retry: false,
    staleTime: 60_000,
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
              <img
                src="/app-logo.png"
                alt="Dharam Bhai Study"
                className="size-10 rounded-full object-cover ring-2 ring-primary/20 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <div className="leading-tight">
                <p className="font-display text-base font-bold leading-none tracking-tight">
                  Dharam Bhai Study
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Learn · Practice · Grow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TopGamificationBar compact />

              {session ? (
                <Link
                  to="/profile"
                  className="relative grid size-8 place-items-center overflow-hidden rounded-full bg-card text-[11px] font-semibold text-foreground ring-1 ring-border transition hover:ring-primary/40"
                  title="My Profile"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || "Student"}
                      className="size-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    (firstName?.[0] ?? user?.email?.[0] ?? "S").toUpperCase()
                  )}
                </Link>
              ) : (
                <Link
                  to="/auth"
                  search={{ redirect: "/home" }}
                  className="press rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Announcements Banner */}
          {announcements.data && announcements.data.length > 0 ? (
            <div className="mt-4 space-y-2">
              {announcements.data.map((ann) => (
                <div
                  key={ann.id}
                  className={`rounded-2xl p-3 ring-1 text-xs ${
                    ann.type === "urgent"
                      ? "bg-amber-500/15 ring-amber-500/30 text-amber-900 dark:text-amber-200"
                      : "bg-card ring-border text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="inline-block size-1.5 rounded-full bg-amber-500" />
                    <span>{ann.title}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                    {ann.message}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <Link
            to="/search"
            search={{ category: undefined }}
            className="mt-4 flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-border"
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

          {/* Telegram Channel "All Courses Of PW" Banner */}
          <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-700 to-blue-800 p-3.5 text-white shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
                  <svg className="size-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-sky-200">
                    Physics Wallah Community
                  </span>
                  <p className="truncate text-xs font-bold leading-tight text-white">
                    All Courses Of PW
                  </p>
                  <p className="truncate text-[10px] text-sky-100/90">
                    Free Notes, DPPs &amp; Batches
                  </p>
                </div>
              </div>

              <a
                href="https://t.me/mrlokygamer"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-sky-700 shadow-xs hover:bg-sky-50 active:scale-95 transition"
              >
                <span>Join</span>
                <span className="text-[10px]">↗</span>
              </a>
            </div>
          </div>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Quick access
          </p>
          <div className="mt-2.5 grid grid-cols-4 gap-2.5">
            <Tile
              to="/my-learning"
              icon={<FolderIcon className="size-4" />}
              label={"My\nLearning"}
              tone="lamp"
            />
            <Tile
              to="/books"
              icon={<DocIcon className="size-4" />}
              label={"Books\n& Notes"}
              tone="pine"
            />
            <Tile
              to="/live"
              icon={<LiveIcon className="size-4" />}
              label={"Live\nClasses"}
              tone="lamp"
            />
            <Tile
              to="/doubt-solver"
              icon={<SparkIcon className="size-4" />}
              label={"AI Doubt\nSolver"}
              tone="pine"
            />
          </div>

          {/* Recent Lectures (Last 3 started or bookmarked videos) */}
          <RecentLecturesSection />

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
            {(featured.data?.courses ?? []).slice(0, 4).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {/* App Rating & Feedback Section */}
          <div className="mt-6">
            <AppRatingCard />
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
