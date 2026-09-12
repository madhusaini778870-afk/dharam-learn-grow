import { createServerFn } from "@tanstack/react-start";
import {
  compositeId,
  dedupeCourses,
  matchesQuery,
  normalizeCourse,
  normalizeCourseList,
  parseCompositeId,
  SOURCE_LABEL,
  type CourseSource,
  type NormalizedCourse,
} from "./courseNormalizer";
import { listedBatches } from "./publicBatches";

/**
 * Combined course catalog for both authorized sources.
 *
 * Endpoints are never invented and never hardcoded to a protected page: each
 * source reads its base URL (and optional secret key) from server-side env vars.
 * When a source has no configured authorized endpoint, it is reported as
 * "API not configured" — no placeholder or fake courses are ever produced.
 *
 * Server env vars (never exposed to the browser):
 *   SOURCE1_API_BASE_URL / SOURCE1_API_KEY / SOURCE1_COURSES_PATH
 *   SOURCE2_API_BASE_URL / SOURCE2_API_KEY / SOURCE2_COURSES_PATH
 */

export type SourceState = {
  source: CourseSource;
  label: string;
  status: "ok" | "not_configured" | "error";
  message: string | null;
  count: number;
};

export type CatalogPayload = {
  courses: NormalizedCourse[];
  sources: SourceState[];
};

export type CourseDetailResult =
  | { status: "ok"; course: NormalizedCourse }
  | { status: "unavailable"; reason: string };

const NOT_CONFIGURED =
  "API not configured — an authorized course endpoint for this source has not been provided yet.";

const MAX_PAGES = 40;

function config(source: CourseSource) {
  const prefix = source === "source1" ? "SOURCE1" : "SOURCE2";
  const base =
    process.env[`${prefix}_API_BASE_URL`] ??
    (source === "source1" ? process.env["CATALOG_API_BASE_URL"] : undefined);
  return {
    base: base ? base.replace(/\/$/, "") : null,
    key: process.env[`${prefix}_API_KEY`] ?? null,
    path:
      process.env[`${prefix}_COURSES_PATH`] ?? (source === "source1" ? "/courses" : "/batches"),
  };
}

async function readJson(
  url: string,
  key: string | null,
): Promise<{ ok: true; payload: unknown } | { ok: false; message: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        ...(key ? { authorization: `Bearer ${key}` } : {}),
      },
    });
    if (!response.ok) {
      return { ok: false, message: `The source responded with status ${response.status}.` };
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      return { ok: false, message: "The source did not return course data in a readable format." };
    }
    return { ok: true, payload: (await response.json()) as unknown };
  } catch {
    return { ok: false, message: "The source could not be reached." };
  }
}

function itemsOf(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  if (!record) return [];
  for (const key of ["courses", "batches", "data", "items", "results", "docs"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    const nested = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
    if (nested) {
      for (const inner of ["courses", "batches", "items", "results", "docs"]) {
        if (Array.isArray(nested[inner])) return nested[inner] as unknown[];
      }
    }
  }
  return [];
}

function hasMore(payload: unknown, received: number): boolean {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  if (record) {
    for (const key of ["hasMore", "has_more", "hasNextPage", "next"]) {
      const value = record[key];
      if (typeof value === "boolean") return value;
      if (typeof value === "string" && value) return true;
    }
  }
  // No explicit flag: keep paging while pages come back full.
  return received >= 20;
}

/** Loads every available page from one source. */
async function loadSource(
  source: CourseSource,
): Promise<{ courses: NormalizedCourse[]; state: SourceState }> {
  const { base, key, path } = config(source);
  const label = SOURCE_LABEL[source];

  if (!base) {
    return {
      courses: [],
      state: { source, label, status: "not_configured", message: NOT_CONFIGURED, count: 0 },
    };
  }

  const collected: NormalizedCourse[] = [];
  let firstError: string | null = null;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = `${base}${path}${path.includes("?") ? "&" : "?"}page=${page}&limit=50`;
    const result = await readJson(url, key);
    if (!result.ok) {
      if (page === 1) firstError = result.message;
      break;
    }
    const items = itemsOf(result.payload);
    if (items.length === 0) break;
    collected.push(...normalizeCourseList(items, source));
    if (!hasMore(result.payload, items.length)) break;
  }

  if (firstError) {
    return {
      courses: [],
      state: { source, label, status: "error", message: firstError, count: 0 },
    };
  }

  const unique = new Map(collected.map((course) => [course.id, course]));
  const courses = Array.from(unique.values());
  return {
    courses,
    state: { source, label, status: "ok", message: null, count: courses.length },
  };
}

/** Publicly listed batches supplied by the app owner (no API needed). */
function loadListing(): { courses: NormalizedCourse[]; state: SourceState } {
  const courses = listedBatches();
  return {
    courses,
    state: {
      source: "listing",
      label: SOURCE_LABEL.listing,
      status: "ok",
      message: "Publicly listed batches. Links open the public listing page only.",
      count: courses.length,
    },
  };
}

/** Complete combined catalog: all pages from both sources, duplicates removed. */
export const fetchCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogPayload> => {
    const [first, second] = await Promise.all([loadSource("source1"), loadSource("source2")]);
    const listing = loadListing();
    const courses = dedupeCourses([
      ...listing.courses,
      ...first.courses,
      ...second.courses,
    ]).sort((a, b) => a.title.localeCompare(b.title));
    return { courses, sources: [listing.state, first.state, second.state] };
  },
);

/** Search across the complete combined catalog. */
export const searchCatalogCourses = createServerFn({ method: "GET" })
  .inputValidator((input: { q: string }) => ({ q: String(input?.q ?? "").slice(0, 120) }))
  .handler(async ({ data }): Promise<CatalogPayload> => {
    const [first, second] = await Promise.all([loadSource("source1"), loadSource("source2")]);
    const listing = loadListing();
    const courses = dedupeCourses([
      ...listing.courses,
      ...first.courses,
      ...second.courses,
    ]).filter((course) => matchesQuery(course, data.q));
    return { courses, sources: [listing.state, first.state, second.state] };
  });

/** Course details for one course, resolved back to its own source. */
export const fetchCourseDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { courseId: string }) => ({ courseId: String(input.courseId) }))
  .handler(async ({ data }): Promise<CourseDetailResult> => {
    const parsed = parseCompositeId(data.courseId);
    if (!parsed) {
      return { status: "unavailable", reason: "This course reference is not valid." };
    }

    if (parsed.source === "listing") {
      const match = listedBatches().find((course) => course.id === data.courseId);
      return match
        ? { status: "ok", course: match }
        : { status: "unavailable", reason: "This batch is no longer listed." };
    }

    const { base, key, path } = config(parsed.source);
    const label = SOURCE_LABEL[parsed.source];
    if (!base) {
      return { status: "unavailable", reason: `${label}: ${NOT_CONFIGURED}` };
    }

    const detail = await readJson(
      `${base}${path}/${encodeURIComponent(parsed.sourceCourseId)}`,
      key,
    );
    if (detail.ok) {
      const record =
        detail.payload && typeof detail.payload === "object"
          ? (detail.payload as Record<string, unknown>)
          : null;
      const candidate =
        record && !Array.isArray(record)
          ? (record["course"] ?? record["batch"] ?? record["data"] ?? record)
          : detail.payload;
      const course = normalizeCourse(candidate, parsed.source);
      if (course) return { status: "ok", course };
    }

    // Fall back to the list endpoint, which some catalogs use for full records.
    const fromList = await loadSource(parsed.source);
    const match = fromList.courses.find(
      (course) => course.id === compositeId(parsed.source, parsed.sourceCourseId),
    );
    if (match) return { status: "ok", course: match };

    return {
      status: "unavailable",
      reason:
        fromList.state.message ??
        `${label} did not return details for this course. Please try again.`,
    };
  });
