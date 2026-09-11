/**
 * One normalized course format shared by every source, so both catalogs render
 * in the same Dharam Bhai Study UI. Pure functions only — safe on client and server.
 *
 * Nothing here invents data: every field is either present in the source payload
 * or left null/empty.
 */

export type CourseSource = "source1" | "source2";

export const SOURCE_LABEL: Record<CourseSource, string> = {
  source1: "Source 1",
  source2: "Source 2",
};

export type Category =
  | "JEE"
  | "NEET"
  | "Class 9"
  | "Class 10"
  | "Class 11"
  | "Class 12"
  | "Other";

export const CATEGORIES: Category[] = [
  "JEE",
  "NEET",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Other",
];

export type NormalizedLesson = {
  id: string;
  title: string;
  chapterId?: string | null;
  durationSeconds?: number | null;
  videoUrl?: string | null;
  transcript?: string | null;
};

export type NormalizedChapter = {
  id: string;
  title: string;
  subject?: string | null;
  lessons: NormalizedLesson[];
};

export type NormalizedNote = {
  id: string;
  title: string;
  url: string;
};

export type NormalizedCourse = {
  /** Composite id, unique across sources (used in routes). */
  id: string;
  /** Id exactly as returned by the source API. */
  sourceCourseId: string;
  source: CourseSource;
  sourceLabel: string;
  title: string;
  thumbnail: string | null;
  description: string | null;
  category: Category;
  className: string | null;
  exam: string | null;
  subjects: string[];
  teachers: string[];
  chapters: NormalizedChapter[];
  lessons: NormalizedLesson[];
  videos: NormalizedLesson[];
  notes: NormalizedNote[];
};

/* ------------------------------- primitives ------------------------------- */

type Raw = Record<string, unknown>;

function asRecord(value: unknown): Raw | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : null;
}

function str(source: Raw, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function num(source: Raw, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function list(source: Raw, ...keys: string[]): unknown[] {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function names(source: Raw, ...keys: string[]): string[] {
  const out: string[] = [];
  for (const entry of list(source, ...keys)) {
    if (typeof entry === "string" && entry.trim()) {
      out.push(entry.trim());
      continue;
    }
    const record = asRecord(entry);
    const name = record ? str(record, "name", "title", "fullName", "full_name", "subject") : null;
    if (name) out.push(name);
  }
  return Array.from(new Set(out));
}

/* -------------------------------- category -------------------------------- */

export function deriveCategory(raw: Raw, className: string | null, exam: string | null): Category {
  const haystack = [
    exam ?? "",
    className ?? "",
    str(raw, "category", "categoryName", "type", "stream", "target", "tag") ?? "",
    str(raw, "title", "name", "batchName") ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (/\bneet\b|medical/.test(haystack)) return "NEET";
  if (/\bjee\b|iit|advanced|mains?\b/.test(haystack)) return "JEE";
  if (/(class\s*|std\s*|^|\s)12(th)?\b/.test(haystack)) return "Class 12";
  if (/(class\s*|std\s*|^|\s)11(th)?\b/.test(haystack)) return "Class 11";
  if (/(class\s*|std\s*|^|\s)10(th)?\b/.test(haystack)) return "Class 10";
  if (/(class\s*|std\s*|^|\s)9(th)?\b/.test(haystack)) return "Class 9";
  return "Other";
}

/* ---------------------------------- ids ----------------------------------- */

const PREFIX: Record<CourseSource, string> = { source1: "s1", source2: "s2" };

export function compositeId(source: CourseSource, sourceCourseId: string): string {
  return `${PREFIX[source]}-${encodeURIComponent(sourceCourseId)}`;
}

export function parseCompositeId(
  id: string,
): { source: CourseSource; sourceCourseId: string } | null {
  const match = /^(s1|s2)-(.+)$/.exec(id);
  if (!match) return null;
  const source: CourseSource = match[1] === "s1" ? "source1" : "source2";
  try {
    return { source, sourceCourseId: decodeURIComponent(match[2]!) };
  } catch {
    return { source, sourceCourseId: match[2]! };
  }
}

/* ------------------------------ normalization ----------------------------- */

function normalizeLesson(raw: unknown, chapterId: string, index: number): NormalizedLesson | null {
  const record = asRecord(raw);
  if (!record) return null;
  const title = str(record, "title", "name", "lessonName", "topic");
  if (!title) return null;
  const id = str(record, "id", "_id", "lessonId", "slug") ?? `${chapterId}-l${index + 1}`;
  const duration = num(record, "durationSeconds", "duration", "length");
  return {
    id,
    title,
    chapterId,
    durationSeconds: duration,
    videoUrl:
      str(record, "videoUrl", "video_url", "hlsUrl", "playbackUrl", "url", "streamUrl") ?? null,
    transcript: str(record, "transcript", "captions", "description") ?? null,
  };
}

function normalizeChapter(raw: unknown, courseKey: string, index: number): NormalizedChapter | null {
  const record = asRecord(raw);
  if (!record) return null;
  const title = str(record, "title", "name", "chapterName", "topic");
  if (!title) return null;
  const id = str(record, "id", "_id", "chapterId", "slug") ?? `${courseKey}-c${index + 1}`;
  const lessons = list(record, "lessons", "videos", "topics", "contents", "items")
    .map((entry, i) => normalizeLesson(entry, id, i))
    .filter((entry): entry is NormalizedLesson => Boolean(entry));
  return { id, title, subject: str(record, "subject", "subjectName"), lessons };
}

function normalizeNote(raw: unknown, courseKey: string, index: number): NormalizedNote | null {
  const record = asRecord(raw);
  if (!record) return null;
  const url = str(record, "url", "pdfUrl", "pdf_url", "fileUrl", "link", "downloadUrl");
  if (!url) return null;
  const title = str(record, "title", "name", "fileName") ?? `Notes ${index + 1}`;
  return { id: str(record, "id", "_id", "slug") ?? `${courseKey}-n${index + 1}`, title, url };
}

export function normalizeCourse(raw: unknown, source: CourseSource): NormalizedCourse | null {
  const record = asRecord(raw);
  if (!record) return null;

  const sourceCourseId = str(record, "id", "_id", "courseId", "batchId", "slug");
  const title = str(record, "title", "name", "batchName", "courseName");
  if (!sourceCourseId || !title) return null;

  const className = str(record, "className", "class", "classNameLabel", "std", "grade");
  const exam = str(record, "exam", "examName", "target", "stream");
  const key = compositeId(source, sourceCourseId);

  const chapters = list(record, "chapters", "subjectsWithChapters", "modules", "sections")
    .map((entry, index) => normalizeChapter(entry, key, index))
    .filter((entry): entry is NormalizedChapter => Boolean(entry));

  const looseLessons = list(record, "lessons", "videos")
    .map((entry, index) => normalizeLesson(entry, key, index))
    .filter((entry): entry is NormalizedLesson => Boolean(entry));

  const lessons = [...chapters.flatMap((chapter) => chapter.lessons), ...looseLessons];

  const notes = list(record, "notes", "pdfs", "attachments", "resources")
    .map((entry, index) => normalizeNote(entry, key, index))
    .filter((entry): entry is NormalizedNote => Boolean(entry));

  const subjects = names(record, "subjects", "subjectList");
  const chapterSubjects = chapters
    .map((chapter) => chapter.subject)
    .filter((value): value is string => Boolean(value));

  return {
    id: key,
    sourceCourseId,
    source,
    sourceLabel: SOURCE_LABEL[source],
    title,
    thumbnail:
      str(record, "thumbnail", "thumbnailUrl", "image", "imageUrl", "cover", "banner", "poster") ??
      null,
    description: str(record, "description", "summary", "about", "shortDescription") ?? null,
    category: deriveCategory(record, className, exam),
    className,
    exam,
    subjects: subjects.length ? subjects : Array.from(new Set(chapterSubjects)),
    teachers: names(record, "teachers", "educators", "faculty", "instructors", "tutors"),
    chapters,
    lessons,
    videos: lessons.filter((lesson) => Boolean(lesson.videoUrl)),
    notes,
  };
}

export function normalizeCourseList(raw: unknown[], source: CourseSource): NormalizedCourse[] {
  return raw
    .map((entry) => normalizeCourse(entry, source))
    .filter((entry): entry is NormalizedCourse => Boolean(entry));
}

/* --------------------------------- dedupe --------------------------------- */

function fingerprint(course: NormalizedCourse): string {
  return [
    course.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(batch|course|20\d\d|\d\.0)\b/g, "")
      .trim(),
    course.category,
    course.className?.toLowerCase() ?? "",
  ].join("|");
}

/** Keeps the richest record when the same course comes from both sources. */
export function dedupeCourses(courses: NormalizedCourse[]): NormalizedCourse[] {
  const byPrint = new Map<string, NormalizedCourse>();
  const richness = (course: NormalizedCourse) =>
    course.chapters.length * 3 +
    course.lessons.length +
    course.notes.length +
    (course.thumbnail ? 2 : 0) +
    (course.description ? 1 : 0);

  for (const course of courses) {
    const print = fingerprint(course);
    const existing = byPrint.get(print);
    if (!existing || richness(course) > richness(existing)) byPrint.set(print, course);
  }
  return Array.from(byPrint.values());
}

/* --------------------------------- search --------------------------------- */

export function matchesQuery(course: NormalizedCourse, query: string): boolean {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  const haystack = [
    course.title,
    course.description ?? "",
    course.category,
    course.className ?? "",
    course.exam ?? "",
    course.sourceLabel,
    ...course.subjects,
    ...course.teachers,
    ...course.chapters.map((chapter) => chapter.title),
    ...course.lessons.map((lesson) => lesson.title),
    ...course.notes.map((note) => note.title),
  ]
    .join(" ")
    .toLowerCase();
  return term.split(/\s+/).every((word) => haystack.includes(word));
}
