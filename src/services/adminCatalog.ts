import { supabase } from "@/integrations/supabase/client";
import {
  asCategory,
  compositeId,
  durationToSeconds,
  resolvePlayback,
  SOURCE_LABEL,
  type NormalizedChapter,
  type NormalizedCourse,
  type NormalizedLesson,
  type NormalizedNote,
} from "./courseNormalizer";

/**
 * Courses, lectures and notes added inside Dharam Bhai Study by an admin, plus
 * the admin's hide/rename overrides for courses coming from the public source.
 * Everything is read through the database's own access rules.
 */

export type AdminCourseRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  class_name: string | null;
  exam: string | null;
  source_url: string | null;
  enabled: boolean;
};

export type AdminLectureRow = {
  id: string;
  course_id: string;
  subject: string;
  chapter: string;
  title: string;
  order_index: number;
  video_url: string | null;
  notes_url: string | null;
  enabled: boolean;
};

export type AdminNoteRow = {
  id: string;
  course_id: string;
  title: string;
  url: string;
  enabled: boolean;
};

export type CourseOverrideRow = {
  course_id: string;
  hidden: boolean;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
};

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "general";
}

function toLesson(row: AdminLectureRow): NormalizedLesson {
  const resolved = resolvePlayback(row.video_url);
  return {
    id: row.id,
    title: row.title,
    chapterId: slug(row.chapter),
    durationSeconds: durationToSeconds(null),
    videoUrl: resolved.videoUrl,
    embedUrl: resolved.embedUrl,
    playback: resolved.playback,
    posterUrl: null,
    teacher: null,
    transcript: null,
    notesUrl: row.notes_url,
  };
}

export function adminCourseToNormalized(
  row: AdminCourseRow,
  lectures: AdminLectureRow[] = [],
  notes: AdminNoteRow[] = [],
): NormalizedCourse {
  const subjects = Array.from(new Set(lectures.map((item) => item.subject)));
  const chapters: NormalizedChapter[] = [];
  for (const lecture of lectures) {
    const id = slug(lecture.chapter);
    let chapter = chapters.find((item) => item.id === id && item.subject === lecture.subject);
    if (!chapter) {
      chapter = {
        id,
        title: lecture.chapter,
        subject: lecture.subject,
        videoCount: 0,
        noteCount: 0,
        lessons: [],
      };
      chapters.push(chapter);
    }
    const lesson = toLesson(lecture);
    chapter.lessons.push(lesson);
    chapter.videoCount = (chapter.videoCount ?? 0) + (lesson.playback === "none" ? 0 : 1);
    chapter.noteCount = (chapter.noteCount ?? 0) + (lecture.notes_url ? 1 : 0);
  }
  const lessons = chapters.flatMap((chapter) => chapter.lessons);
  const normalizedNotes: NormalizedNote[] = notes.map((note) => ({
    id: note.id,
    title: note.title,
    url: note.url,
  }));

  return {
    id: compositeId("admin", row.id),
    sourceCourseId: row.id,
    source: "admin",
    sourceLabel: SOURCE_LABEL.admin,
    sourceUrl: row.source_url,
    sourceNote: row.source_url ? "Public source page" : null,
    title: row.title,
    thumbnail: row.thumbnail_url,
    description: row.description,
    category: asCategory(row.category),
    className: row.class_name,
    exam: row.exam,
    language: null,
    startDate: null,
    subjects: subjects.length ? subjects : [],
    subjectRefs: subjects.map((name) => ({
      id: slug(name),
      name,
      lectureCount: lectures.filter((item) => item.subject === name).length,
      teachers: [],
    })),
    teachers: [],
    chapters,
    lessons,
    videos: lessons.filter((lesson) => lesson.playback !== "none"),
    notes: normalizedNotes,
  };
}

/** All enabled admin-added courses (catalogue cards). */
export async function loadAdminCourses(): Promise<NormalizedCourse[]> {
  const { data, error } = await supabase
    .from("admin_courses")
    .select("id, title, description, thumbnail_url, category, class_name, exam, source_url, enabled")
    .eq("enabled", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as AdminCourseRow[]).map((row) => adminCourseToNormalized(row));
}

/** One admin-added course with its lectures and notes. */
export async function loadAdminCourse(courseId: string): Promise<NormalizedCourse | null> {
  const [courseResult, lectureResult, noteResult] = await Promise.all([
    supabase
      .from("admin_courses")
      .select("id, title, description, thumbnail_url, category, class_name, exam, source_url, enabled")
      .eq("id", courseId)
      .maybeSingle(),
    supabase
      .from("admin_lectures")
      .select("id, course_id, subject, chapter, title, order_index, video_url, notes_url, enabled")
      .eq("course_id", courseId)
      .eq("enabled", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("admin_notes")
      .select("id, course_id, title, url, enabled")
      .eq("course_id", courseId)
      .eq("enabled", true),
  ]);
  if (courseResult.error) throw courseResult.error;
  const row = courseResult.data as AdminCourseRow | null;
  if (!row || !row.enabled) return null;
  return adminCourseToNormalized(
    row,
    (lectureResult.data ?? []) as AdminLectureRow[],
    (noteResult.data ?? []) as AdminNoteRow[],
  );
}

/** Admin hide/rename decisions for public-source courses. */
export async function loadOverrides(): Promise<Map<string, CourseOverrideRow>> {
  const { data, error } = await supabase
    .from("course_overrides")
    .select("course_id, hidden, title, description, thumbnail_url");
  if (error) throw error;
  return new Map(((data ?? []) as CourseOverrideRow[]).map((row) => [row.course_id, row]));
}

/** Applies admin overrides to a public-source course list. */
export function applyOverrides(
  courses: NormalizedCourse[],
  overrides: Map<string, CourseOverrideRow> | undefined,
): NormalizedCourse[] {
  if (!overrides || overrides.size === 0) return courses;
  const out: NormalizedCourse[] = [];
  for (const course of courses) {
    const override = overrides.get(course.id) ?? overrides.get(course.sourceCourseId);
    if (override?.hidden) continue;
    out.push(
      override
        ? {
            ...course,
            title: override.title ?? course.title,
            description: override.description ?? course.description,
            thumbnail: override.thumbnail_url ?? course.thumbnail,
          }
        : course,
    );
  }
  return out;
}
