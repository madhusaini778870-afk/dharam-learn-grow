import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchCourseDetail } from "@/services/courseApi";
import { getPublicBooksServer, type AdminBook } from "@/services/adminService";
import { studentStore, type StoredEnrollment } from "@/services/studentStore";
import { useAuth } from "@/hooks/useAuth";
import { Screen, Footer, PageHeader, ChevronRight } from "@/components/app-shell";
import { StateCard } from "@/components/states";
import { BookMarked, Download, FileText, ExternalLink, Sparkles, Search, Send } from "lucide-react";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Books & Notes · Dharam Bhai Study" },
      {
        name: "description",
        content: "Publicly available books, study materials, and notes published for JEE and NEET.",
      },
      { property: "og:title", content: "Books & Notes · Dharam Bhai Study" },
      {
        property: "og:description",
        content: "Notes and PDFs from your enrolled courses and library.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BooksScreen,
});

function BooksScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"library" | "notes">("library");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [enrollments, setEnrollments] = useState<StoredEnrollment[]>(() =>
    studentStore.getEnrollments(),
  );

  const fetchBooks = useServerFn(getPublicBooksServer);
  const booksQuery = useQuery({
    queryKey: ["public_books"],
    queryFn: () => fetchBooks(),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    studentStore.syncUserData().then(() => {
      setEnrollments(studentStore.getEnrollments());
    });
    const handleUpdate = () => {
      setEnrollments(studentStore.getEnrollments());
    };
    window.addEventListener("dharam_enrollments_updated", handleUpdate);
    return () => {
      window.removeEventListener("dharam_enrollments_updated", handleUpdate);
    };
  }, [user]);

  const books: AdminBook[] = booksQuery.data?.books || [];
  const filteredBooks = books.filter((b) => {
    const matchesSubject =
      selectedSubject === "All" || b.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.subject && b.subject.trim()) set.add(b.subject.trim());
      if (b.category && b.category.trim()) set.add(b.category.trim());
    });
    const priority = [
      "Physics",
      "Chemistry",
      "Mathematics",
      "Biology",
      "SSC",
      "UPSC & PSC",
      "English",
    ];
    const merged = Array.from(set).filter(Boolean);
    const result: string[] = [];
    priority.forEach((p) => {
      const match = merged.find((m) => m.toLowerCase() === p.toLowerCase());
      if (match && !result.includes(match)) result.push(match);
    });
    merged.forEach((m) => {
      if (!result.includes(m) && result.length < 10) result.push(m);
    });
    return ["All", ...result];
  }, [books]);

  return (
    <Screen>
      <PageHeader
        title="Books &amp; Notes"
        subtitle="Free PDF books, modules, toppers notes &amp; DPPs from Vidyaverse &amp; Batches"
      />

      {/* Tab Selector */}
      <div className="px-5 mt-3">
        <div className="flex rounded-2xl bg-foreground p-1 text-center">
          <button
            onClick={() => setActiveTab("library")}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
              activeTab === "library"
                ? "bg-card text-foreground shadow-xs"
                : "text-background/70 hover:text-background"
            }`}
          >
            Books &amp; Modules ({books.length})
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
              activeTab === "notes"
                ? "bg-card text-foreground shadow-xs"
                : "text-background/70 hover:text-background"
            }`}
          >
            Course Notes ({enrollments.length})
          </button>
        </div>
      </div>

      {/* Telegram Community Banner */}
      <div className="px-5 mt-3.5">
        <div className="flex items-center justify-between rounded-2xl bg-sky-500/10 p-3 ring-1 ring-sky-500/20 text-xs text-foreground">
          <div className="flex items-center gap-2 min-w-0">
            <Send className="size-4 shrink-0 text-sky-600" />
            <span className="truncate">
              Want all official <strong>Physics Wallah Books</strong>?
            </span>
          </div>
          <a
            href="https://t.me/mrlokygamer"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-bold text-sky-600 hover:underline ml-2"
          >
            Join Telegram ↗
          </a>
        </div>
      </div>

      {activeTab === "library" ? (
        <div className="mt-4 px-5 space-y-3.5">
          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-2xl bg-card px-3.5 py-2.5 ring-1 ring-border text-xs">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search books by title, chapter or exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Subject Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {availableSubjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0 transition ${
                    selectedSubject === sub
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Book Cards Grid/List */}
          {filteredBooks.length === 0 ? (
            <div className="rounded-3xl bg-card p-6 text-center ring-1 ring-border mt-3">
              <BookMarked className="size-9 mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-semibold text-sm">No books found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {books.length === 0
                  ? "Admin hasn't uploaded any books yet. Check back soon or visit the Admin portal."
                  : "No books match your current filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBooks.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-xs hover:ring-primary/40 transition"
                >
                  <div className="flex items-start gap-3.5">
                    {b.thumbnail ? (
                      <img
                        src={b.thumbnail}
                        alt={b.title}
                        className="size-14 rounded-xl object-cover ring-1 ring-border shrink-0"
                      />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <BookMarked className="size-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {b.id.startsWith("vv-") || (b.author && b.author.includes("Vidyaverse")) ? (
                          <span className="rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 px-2 py-0.5 text-[10px] font-bold">
                            Vidyaverse
                          </span>
                        ) : null}
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {b.subject}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {b.category}
                        </span>
                        {b.fileSize ? (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {b.fileSize}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="font-semibold text-sm leading-snug mt-1 text-foreground">
                        {b.title}
                      </h3>

                      {b.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {b.description}
                        </p>
                      ) : null}

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          By {b.author || "Physics Wallah"}
                        </span>

                        <a
                          href={b.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="press inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
                        >
                          <Download className="size-3.5" />
                          <span>Open PDF</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Enrolled Course Notes Tab */
        <div className="mt-4 space-y-3 px-5">
          {enrollments.length === 0 ? (
            <StateCard
              title="No enrolled course notes"
              body="Enroll in a course to open the notes and PDFs published inside its chapters."
              action={
                <Link
                  to="/courses"
                  search={{ category: undefined }}
                  className="press inline-flex rounded-2xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground"
                >
                  Browse courses
                </Link>
              }
            />
          ) : null}
          {enrollments.map((row) => (
            <CourseNotes key={row.courseId} courseId={row.courseId} title={row.courseTitle} />
          ))}
        </div>
      )}

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
        {detail?.notes && detail.notes.length > 0 ? (
          detail.notes.map((note) => (
            <a
              key={note.id}
              href={note.url}
              target="_blank"
              rel="noreferrer"
              className="press flex items-center justify-between rounded-xl bg-background px-3 py-2.5 text-[13px]"
            >
              <span className="truncate">{note.title}</span>
              <ExternalLink className="size-3.5 text-muted-foreground shrink-0 ml-2" />
            </a>
          ))
        ) : (
          <p className="text-xs text-muted-foreground py-1">
            No notes published for this course yet.
          </p>
        )}
        <Link
          to="/course/$courseId"
          params={{ courseId }}
          className="press mt-1 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
        >
          <span>Open Full Course</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
