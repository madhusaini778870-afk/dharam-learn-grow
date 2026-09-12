/**
 * One normalized course format for the whole app, so every screen renders the
 * same shape. Pure functions only — safe on client and server.
 *
 * Nothing here invents data: every field is either present in the public source
 * payload or left null/empty.
 */

export type CourseSource = "source1";

export const SOURCE_LABEL: Record<CourseSource, string> = {
  source1: "Public source",
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
  posterUrl?: string | null;
  transcript?: string | null;
};

export type NormalizedChapter = {
  id: string;
  title: string;
  subject?: string | null;
  videoCount?: number | null;
  noteCount?: number | null;
  lessons: NormalizedLesson[];
};

export type NormalizedNote = {
  id: string;
  title: string;
  url: string;
};

export type SubjectRef = {
  id: string;
  name: string;
  lectureCount: number | null;
  teachers: string[];
};

export type NormalizedCourse = {
  /** Composite id, unique across sources (used in routes). */
  id: string;
  /** Id exactly as returned by the source. */
  sourceCourseId: string;
  source: CourseSource;
  sourceLabel: string;
  /** Public page this course is listed on, when one is actually available. */
  sourceUrl?: string | null;
  sourceNote?: string | null;
  title: string;
  thumbnail: string | null;
  description: string | null;
  category: Category;
  className: string | null;
  exam: string | null;
  language?: string | null;
  startDate?: string | null;
  subjects: string[];
  subjectRefs: SubjectRef[];
  teachers: string[];
  chapters: NormalizedChapter[];
  lessons: NormalizedLesson[];
  videos: NormalizedLesson[];
  notes: NormalizedNote[];
};

/* -------------------------------- category -------------------------------- */

export function categoryFor(exam: string | null, className: string | null): Category {
  const target = (exam ?? "").toUpperCase();
  if (target.includes("NEET")) return "NEET";
  if (target.includes("JEE") || target.includes("IIT")) return "JEE";
  const cls = (className ?? "").trim();
  if (cls === "9") return "Class 9";
  if (cls === "10") return "Class 10";
  if (cls === "11") return "Class 11";
  if (cls === "12") return "Class 12";
  return "Other";
}

/* --------------------------------- text ----------------------------------- */

/** Turns the source's HTML description into readable plain text. */
export function plainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|tr)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------------------------------- ids ----------------------------------- */

const PREFIX: Record<CourseSource, string> = { source1: "s1" };

export function compositeId(source: CourseSource, sourceCourseId: string): string {
  return `${PREFIX[source]}-${encodeURIComponent(sourceCourseId)}`;
}

export function parseCompositeId(
  id: string,
): { source: CourseSource; sourceCourseId: string } | null {
  const match = /^s1-(.+)$/.exec(id);
  if (!match) return null;
  try {
    return { source: "source1", sourceCourseId: decodeURIComponent(match[1]!) };
  } catch {
    return { source: "source1", sourceCourseId: match[1]! };
  }
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
    ...course.subjects,
    ...course.teachers,
  ]
    .join(" ")
    .toLowerCase();
  return term.split(/\s+/).every((word) => haystack.includes(word));
}
