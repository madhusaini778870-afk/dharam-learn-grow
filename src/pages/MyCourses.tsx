import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { studentStore, type StoredEnrollment, type BookmarkItem } from "@/services/studentStore";
import { Screen, Footer, PageHeader, ChevronRight } from "@/components/app-shell";
import { AddBatchDialog } from "@/components/AddBatchDialog";
import {
  BookOpen,
  CheckCircle,
  Trash2,
  LogIn,
  GraduationCap,
  Bookmark,
  Play,
  Plus,
} from "lucide-react";

/** Courses the student enrolled in, strictly isolated to the authenticated user. */
export function MyCoursesPage() {
  const { session, user, loading } = useAuth();
  const [enrolledList, setEnrolledList] = useState<StoredEnrollment[]>(
    () => studentStore.getEnrollments() ?? [],
  );
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(
    () => studentStore.getBookmarks() ?? [],
  );
  const [addBatchOpen, setAddBatchOpen] = useState(false);

  useEffect(() => {
    studentStore.syncUserData().then(() => {
      setEnrolledList(studentStore.getEnrollments() ?? []);
      setBookmarks(studentStore.getBookmarks() ?? []);
    });

    const handleUpdate = () => {
      setEnrolledList(studentStore.getEnrollments() ?? []);
    };
    const handleBookmarks = () => {
      setBookmarks(studentStore.getBookmarks() ?? []);
    };
    window.addEventListener("dharam_enrollments_updated", handleUpdate);
    window.addEventListener("dharam_bookmarks_updated", handleBookmarks);
    return () => {
      window.removeEventListener("dharam_enrollments_updated", handleUpdate);
      window.removeEventListener("dharam_bookmarks_updated", handleBookmarks);
    };
  }, [user]);

  // Protected feature: require login for My Courses
  if (!loading && !session) {
    return (
      <Screen>
        <PageHeader title="My Courses" back="/home" />
        <div className="mt-8 px-5">
          <div className="rounded-3xl bg-card p-6 text-center ring-1 ring-border shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-muted text-muted-foreground">
              <GraduationCap className="size-8" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold">Sign in to view My Courses</h2>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
              Your enrolled batches, chapter progress, and last-watched positions are securely saved
              to your account.
            </p>
            <Link
              to="/auth"
              search={{ redirect: "/my-learning" }}
              className="press mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md"
            >
              <LogIn className="size-4" />
              <span>Sign In / Create Account</span>
            </Link>
          </div>
        </div>
        <Footer />
      </Screen>
    );
  }

  const handleUnenroll = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await studentStore.unenrollCourse(courseId);
    setEnrolledList(studentStore.getEnrollments());
  };

  return (
    <Screen>
      <PageHeader title="My Courses" back="/home" />

      <div className="px-5 pt-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Enrolled Batches ({enrolledList.length})
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddBatchOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 active:scale-95 transition"
            >
              <Plus className="size-3" />
              <span>Add Batch</span>
            </button>
            <Link to="/courses" className="text-xs font-semibold text-primary hover:underline">
              Browse More →
            </Link>
          </div>
        </div>

        {enrolledList.length === 0 ? (
          <div className="rounded-3xl bg-card p-6 text-center ring-1 ring-border shadow-xs">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <BookOpen className="size-7" />
            </div>
            <p className="mt-3 font-display text-base font-bold">No enrolled courses yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              Explore Physics Wallah batches or add any batch link directly from
              pw.gemtara.in/study/batches to start tracking your progress.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setAddBatchOpen(true)}
                className="press inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90 transition"
              >
                <Plus className="size-3.5" />
                <span>Add Batch from pw.gemtara.in</span>
              </button>
              <Link
                to="/courses"
                className="press inline-flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/80 transition"
              >
                <span>Explore All Batches</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {enrolledList.map((course) => (
              <div
                key={course.id}
                className="group relative flex overflow-hidden rounded-3xl bg-card ring-1 ring-border shadow-2xs transition hover:ring-foreground/20"
              >
                <Link
                  to="/course/$courseId"
                  params={{ courseId: course.courseId }}
                  className="flex flex-1 items-center gap-3.5 p-3.5 min-w-0"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-foreground/5 text-muted-foreground">
                        <BookOpen className="size-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {course.exam && (
                      <span className="inline-block rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        {course.exam}
                      </span>
                    )}
                    <h3 className="mt-0.5 truncate text-sm font-bold font-display leading-tight">
                      {course.courseTitle}
                    </h3>
                    {course.lastWatchedLessonTitle ? (
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        Last: {course.lastWatchedLessonTitle}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle className="size-3" /> Enrolled
                      </p>
                    )}
                  </div>

                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                </Link>

                <button
                  onClick={(e) => handleUnenroll(course.courseId, e)}
                  title="Unenroll"
                  className="press flex items-center justify-center px-3 text-muted-foreground/50 hover:text-destructive transition border-l border-border"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Saved Bookmarked Lectures */}
        {bookmarks.length > 0 && (
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="size-3.5 text-amber-500 fill-amber-500" />
                <span>Saved Bookmarks ({bookmarks.length})</span>
              </p>
            </div>

            <div className="space-y-2">
              {bookmarks.map((bm) => (
                <div
                  key={bm.lessonId}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 ring-1 ring-border shadow-2xs hover:ring-foreground/20 transition"
                >
                  <Link
                    to="/lesson/$courseId/$lessonId"
                    params={{ courseId: bm.courseId, lessonId: bm.lessonId }}
                    search={{
                      subjectId: bm.subjectId || "",
                      chapterId: bm.chapterId || "",
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Play className="size-4 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">{bm.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {bm.courseTitle || "Course Lecture"}
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      studentStore.toggleBookmark(bm);
                      setBookmarks(studentStore.getBookmarks());
                    }}
                    title="Remove Bookmark"
                    className="press flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AddBatchDialog open={addBatchOpen} onOpenChange={setAddBatchOpen} />
      <Footer />
    </Screen>
  );
}
