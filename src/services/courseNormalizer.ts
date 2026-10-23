/**
 * One normalized course format for the whole app, so every screen renders the
 * same shape. Pure functions only — safe on client and server.
 *
 * Nothing here invents data: every field is either present in the public source
 * payload (or added by an admin inside this app) or left null/empty.
 */

export type CourseSource = "source1" | "admin";

export const SOURCE_LABEL: Record<CourseSource, string> = {
  source1: "Public source",
  admin: "Dharam Bhai Study",
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

/** How a lesson can be played, based only on what the source published. */
export type PlaybackKind = "direct" | "embed" | "none";

export type NormalizedLesson = {
  id: string;
  title: string;
  chapterId?: string | null;
  durationSeconds?: number | null;
  /** Progressive/HLS file that our own player can play. */
  videoUrl?: string | null;
  /** Authorized public embed (e.g. YouTube) used when there is no direct file. */
  embedUrl?: string | null;
  playback: PlaybackKind;
  posterUrl?: string | null;
  teacher?: string | null;
  transcript?: string | null;
  notesUrl?: string | null;
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

export function asCategory(value: string | null | undefined): Category {
  const match = CATEGORIES.find((item) => item === value);
  return match ?? "Other";
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

/* --------------------------------- video ---------------------------------- */

const DIRECT_FILE = /\.(m3u8|mpd|mp4|webm|m4v|mov)(\?|#|$)/i;
const YOUTUBE = /(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/i;

/** Extracts a YouTube video id from any of its public URL shapes. */
export function youtubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /[?&]v=([A-Za-z0-9_-]{6,})/,
    /\/embed\/([A-Za-z0-9_-]{6,})/,
    /\/shorts\/([A-Za-z0-9_-]{6,})/,
    /\/live\/([A-Za-z0-9_-]{6,})/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(url);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * Decides how a published URL can be played. A direct media file plays in our
 * own player; an authorized public YouTube link plays in its official embed;
 * anything else is treated as not publicly playable (never bypassed).
 */
export function resolvePlayback(
  url: string | null | undefined,
  urlType?: string | null,
): { playback: PlaybackKind; videoUrl: string | null; embedUrl: string | null } {
  const value = (url ?? "").trim();
  if (!value || !/^https?:\/\//i.test(value)) {
    return { playback: "none", videoUrl: null, embedUrl: null };
  }
  if (DIRECT_FILE.test(value) || urlType === "hls" || urlType === "mp4") {
    return { playback: "direct", videoUrl: value, embedUrl: null };
  }
  if (YOUTUBE.test(value) || urlType === "youtube") {
    const id = youtubeId(value);
    if (!id) return { playback: "none", videoUrl: null, embedUrl: null };
    return {
      playback: "embed",
      videoUrl: null,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`,
    };
  }
  return { playback: "none", videoUrl: null, embedUrl: null };
}

/** "01:12:30" / "12:30" / "930" (seconds) -> seconds. */
export function durationToSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value !== "string" || !value.trim()) return null;
  const parts = value.trim().split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return null;
  if (parts.length === 1) return Math.round(parts[0]!);
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  return null;
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (input: number) => String(input).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/* ---------------------------------- ids ----------------------------------- */

const PREFIX: Record<CourseSource, string> = { source1: "s1", admin: "ad" };

export function compositeId(source: CourseSource, sourceCourseId: string): string {
  return `${PREFIX[source]}-${encodeURIComponent(sourceCourseId)}`;
}

export function parseCompositeId(
  id: string,
): { source: CourseSource; sourceCourseId: string } | null {
  const match = /^(s1|ad)-(.+)$/.exec(id);
  if (!match) return null;
  const source: CourseSource = match[1] === "ad" ? "admin" : "source1";
  try {
    return { source, sourceCourseId: decodeURIComponent(match[2]!) };
  } catch {
    return { source, sourceCourseId: match[2]! };
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
