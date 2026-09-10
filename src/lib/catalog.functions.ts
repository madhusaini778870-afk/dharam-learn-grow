import { createServerFn } from "@tanstack/react-start";

/**
 * Course catalog access.
 *
 * The app never invents course data. It reads from an authorized/public course
 * endpoint configured server-side as CATALOG_API_BASE_URL. When that endpoint is
 * not configured (or does not answer with usable data), every screen shows an
 * explicit "catalog unavailable" state instead of placeholder content.
 */

export type Lesson = {
  id: string;
  title: string;
  durationSeconds?: number | null;
  videoUrl?: string | null;
  transcript?: string | null;
};

export type Chapter = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  title: string;
  exam?: string | null;
  subject?: string | null;
  description?: string | null;
  educator?: string | null;
  thumbnailUrl?: string | null;
  chapters?: Chapter[];
  notes?: { id: string; title: string; url: string }[];
};

export type CatalogResult<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable"; reason: string };

const UNAVAILABLE_REASON =
  "Course catalog is temporarily unavailable because an authorized data endpoint is required.";

function baseUrl(): string | null {
  const raw = process.env["CATALOG_API_BASE_URL"];
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

async function readJson(path: string): Promise<unknown | null> {
  const base = baseUrl();
  if (!base) return null;
  try {
    const response = await fetch(`${base}${path}`, {
      headers: {
        accept: "application/json",
        ...(process.env["CATALOG_API_KEY"]
          ? { authorization: `Bearer ${process.env["CATALOG_API_KEY"]}` }
          : {}),
      },
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export const listCourses = createServerFn({ method: "GET" })
  .inputValidator((input: { exam?: string; page?: number } | undefined) => ({
    exam: input?.exam,
    page: input?.page ?? 1,
  }))
  .handler(async ({ data }): Promise<CatalogResult<{ courses: Course[]; hasMore: boolean }>> => {
    const query = new URLSearchParams({ page: String(data.page) });
    if (data.exam) query.set("exam", data.exam);
    const payload = await readJson(`/courses?${query.toString()}`);
    const courses = (payload as { courses?: Course[] } | null)?.courses;
    if (!Array.isArray(courses)) {
      return { status: "unavailable", reason: UNAVAILABLE_REASON };
    }
    return {
      status: "ok",
      data: {
        courses,
        hasMore: Boolean((payload as { hasMore?: boolean }).hasMore),
      },
    };
  });

export const getCourse = createServerFn({ method: "GET" })
  .inputValidator((input: { courseId: string }) => input)
  .handler(async ({ data }): Promise<CatalogResult<Course>> => {
    const payload = await readJson(`/courses/${encodeURIComponent(data.courseId)}`);
    const course = (payload as { course?: Course } | null)?.course;
    if (!course || typeof course.id !== "string") {
      return { status: "unavailable", reason: UNAVAILABLE_REASON };
    }
    return { status: "ok", data: course };
  });

export const listNotes = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogResult<{ id: string; title: string; url: string; subject?: string }[]>> => {
    const payload = await readJson(`/notes`);
    const notes = (payload as { notes?: { id: string; title: string; url: string }[] } | null)?.notes;
    if (!Array.isArray(notes)) {
      return { status: "unavailable", reason: UNAVAILABLE_REASON };
    }
    return { status: "ok", data: notes };
  },
);

export const searchCatalog = createServerFn({ method: "GET" })
  .inputValidator((input: { q: string }) => input)
  .handler(async ({ data }): Promise<CatalogResult<{
    courses: Course[];
    lessons: { id: string; title: string; courseId: string }[];
    notes: { id: string; title: string; url: string }[];
  }>> => {
    const payload = await readJson(`/search?q=${encodeURIComponent(data.q)}`);
    if (!payload || typeof payload !== "object") {
      return { status: "unavailable", reason: UNAVAILABLE_REASON };
    }
    const result = payload as {
      courses?: Course[];
      lessons?: { id: string; title: string; courseId: string }[];
      notes?: { id: string; title: string; url: string }[];
    };
    return {
      status: "ok",
      data: {
        courses: result.courses ?? [],
        lessons: result.lessons ?? [],
        notes: result.notes ?? [],
      },
    };
  });

export const CATALOG_UNAVAILABLE_MESSAGE = UNAVAILABLE_REASON;
