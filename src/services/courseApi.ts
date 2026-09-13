import { createServerFn } from "@tanstack/react-start";
import {
  compositeId,
  parseCompositeId,
  plainText,
  categoryFor,
  durationToSeconds,
  resolvePlayback,
  SOURCE_LABEL,
  type Category,
  type NormalizedChapter,
  type NormalizedCourse,
  type NormalizedLesson,
  type NormalizedNote,
  type SubjectRef,
} from "./courseNormalizer";

/**
 * Course data for Dharam Bhai Study.
 *
 * Everything is read from the publicly accessible endpoints of the source site
 * (no login, no payment wall, no protected content, nothing invented):
 *   - batch list  : public server endpoint used by its own public /batches page
 *   - batch detail: GET /api/content/v3/batches/:batchId/details
 *   - chapters    : GET /api/content/v2/batches/:batchId/subject/:subjectId/topics
 *   - lectures    : GET /api/content/v2/batches/:id/subject/:sid/contents?...
 *   - live today  : GET /api/content/v2/batches/:batchId/todays-schedule
 *
 * Base URL and list-function id are overridable with server-side env vars and
 * are never exposed to the browser.
 */

const DEFAULT_BASE = "https://physicswallahx.vercel.app";
const DEFAULT_LIST_FN = "dcdd884992863281da512f5f2bd74792beaca0ccee0911be66efc30e089df11f";

function base(): string {
  return (process.env["SOURCE_SITE_URL"] ?? DEFAULT_BASE).replace(/\/$/, "");
}

function listFn(): string {
  return process.env["SOURCE_LIST_FN"] ?? DEFAULT_LIST_FN;
}

function headers(): Record<string, string> {
  return {
    accept: "application/x-tss-framed, application/x-ndjson, application/json",
    "x-tsr-serverfn": "true",
    referer: `${base()}/batches`,
    "user-agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/141 Mobile Safari/537.36",
  };
}

export type SourceState = {
  label: string;
  status: "ok" | "error";
  message: string | null;
  count: number;
};

export type CoursePage = {
  courses: NormalizedCourse[];
  nextCursor: number | null;
  state: SourceState;
};

export type CourseDetailResult =
  | { status: "ok"; course: NormalizedCourse }
  | { status: "unavailable"; reason: string };

const UNREACHABLE = "The public course source could not be reached right now.";

/* ------------------------------ framed decode ------------------------------ */

type Framed = { t: number; s?: unknown; a?: Framed[]; p?: { k: string[]; v: Framed[] } };

function decodeFramed(node: Framed | null | undefined): unknown {
  if (!node) return null;
  switch (node.t) {
    case 9:
      return (node.a ?? []).map((child) => decodeFramed(child));
    case 10: {
      const out: Record<string, unknown> = {};
      const keys = node.p?.k ?? [];
      const values = node.p?.v ?? [];
      keys.forEach((key, index) => {
        out[key] = decodeFramed(values[index]);
      });
      return out;
    }
    default:
      return node.s ?? null;
  }
}

/* --------------------------------- fetchers -------------------------------- */

/** Public JSON proxy on the source site: { success, data }. */
async function content<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${base()}/api/content/${path}`, { headers: headers() });
    if (!response.ok) return null;
    const payload = (await response.json()) as { success?: boolean; data?: T } | null;
    if (!payload || payload.success === false) return null;
    return (payload.data ?? null) as T | null;
  } catch {
    return null;
  }
}

type RawBatch = {
  batchId?: string;
  id?: string;
  name?: string;
  photo?: string | null;
  exam?: string | null;
  className?: string | null;
  language?: string | null;
  startDate?: string | null;
};

/** One page of the public batch list. */
async function listPage(
  q: string,
  page: number,
  pageSize: number,
): Promise<{ items: RawBatch[]; hasMore: boolean } | null> {
  const payload = JSON.stringify({
    t: {
      t: 10,
      i: 0,
      p: {
        k: ["data"],
        v: [
          {
            t: 10,
            i: 1,
            p: {
              k: ["q", "page", "pageSize"],
              v: [
                { t: 1, s: q },
                { t: 0, s: page },
                { t: 0, s: pageSize },
              ],
            },
            o: 0,
          },
        ],
      },
      o: 0,
    },
    f: 63,
    m: [],
  });

  try {
    const response = await fetch(
      `${base()}/_serverFn/${listFn()}?payload=${encodeURIComponent(payload)}`,
      { headers: headers() },
    );
    if (!response.ok) return null;
    const decoded = decodeFramed((await response.json()) as Framed) as {
      result?: { items?: RawBatch[]; hasMore?: boolean };
    } | null;
    const result = decoded?.result;
    if (!result || !Array.isArray(result.items)) return null;
    return { items: result.items, hasMore: Boolean(result.hasMore) };
  } catch {
    return null;
  }
}

/* -------------------------------- normalize -------------------------------- */

function fromListItem(raw: RawBatch): NormalizedCourse | null {
  const sourceCourseId = raw.batchId ?? raw.id;
  const title = raw.name?.trim();
  if (!sourceCourseId || !title) return null;
  const className = raw.className ? `Class ${raw.className}` : null;
  return {
    id: compositeId("source1", sourceCourseId),
    sourceCourseId,
    source: "source1",
    sourceLabel: SOURCE_LABEL.source1,
    sourceUrl: `${base()}/batch/${sourceCourseId}`,
    sourceNote: "Public course page",
    title,
    thumbnail: raw.photo ?? null,
    description: null,
    category: categoryFor(raw.exam ?? null, raw.className ?? null),
    className,
    exam: raw.exam ? raw.exam.replace(/_/g, " ") : null,
    language: raw.language ?? null,
    startDate: raw.startDate ?? null,
    subjects: [],
    subjectRefs: [],
    teachers: [],
    chapters: [],
    lessons: [],
    videos: [],
    notes: [],
  };
}

type RawSubject = {
  _id?: string;
  subject?: string;
  lectureCount?: number;
  teacherIds?: { firstName?: string; lastName?: string; name?: string }[];
};

type RawTeacher = { firstName?: string; lastName?: string; name?: string };

function teacherName(entry: RawTeacher | null | undefined): string | null {
  const full = [entry?.firstName, entry?.lastName].filter(Boolean).join(" ").trim();
  return full || entry?.name?.trim() || null;
}

/* ------------------------------- server fns -------------------------------- */

/**
 * A page of the public catalog. Category filtering scans forward through the
 * source pages so a filtered page still comes back full.
 */
export const fetchCourses = createServerFn({ method: "GET" })
  .inputValidator(
    (input: { q?: string; category?: Category; cursor?: number } | undefined) => ({
      q: String(input?.q ?? "").slice(0, 120),
      category: input?.category,
      cursor: Math.max(1, Number(input?.cursor ?? 1)),
    }),
  )
  .handler(async ({ data }): Promise<CoursePage> => {
    const wanted = 24;
    const collected: NormalizedCourse[] = [];
    let page = data.cursor;
    let hasMore = true;
    let scans = 0;

    while (hasMore && collected.length < wanted && scans < 8) {
      const result = await listPage(data.q, page, 48);
      scans += 1;
      if (!result) {
        if (collected.length === 0) {
          return {
            courses: [],
            nextCursor: null,
            state: { label: SOURCE_LABEL.source1, status: "error", message: UNREACHABLE, count: 0 },
          };
        }
        break;
      }
      for (const item of result.items) {
        const course = fromListItem(item);
        if (!course) continue;
        if (data.category && course.category !== data.category) continue;
        collected.push(course);
      }
      hasMore = result.hasMore;
      page += 1;
    }

    return {
      courses: collected,
      nextCursor: hasMore ? page : null,
      state: {
        label: SOURCE_LABEL.source1,
        status: "ok",
        message: null,
        count: collected.length,
      },
    };
  });

/** Full public details for one course: subjects, teachers, description. */
export const fetchCourseDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { courseId: string }) => ({ courseId: String(input.courseId) }))
  .handler(async ({ data }): Promise<CourseDetailResult> => {
    const parsed = parseCompositeId(data.courseId);
    if (!parsed) return { status: "unavailable", reason: "This course reference is not valid." };

    const batchId = parsed.sourceCourseId;
    const raw = await content<Record<string, unknown>>(`v3/batches/${encodeURIComponent(batchId)}/details`);
    if (!raw) return { status: "unavailable", reason: UNREACHABLE };

    const rawSubjects = Array.isArray(raw["subjects"]) ? (raw["subjects"] as RawSubject[]) : [];
    const subjectRefs: SubjectRef[] = rawSubjects
      .filter((subject) => subject._id && subject.subject)
      .map((subject) => ({
        id: subject._id!,
        name: subject.subject!,
        lectureCount: typeof subject.lectureCount === "number" ? subject.lectureCount : null,
        teachers: (subject.teacherIds ?? [])
          .map((teacher) => teacherName(teacher))
          .filter((name): name is string => Boolean(name)),
      }));

    const exam = Array.isArray(raw["exam"]) ? (raw["exam"] as string[])[0] ?? null : null;
    const className = typeof raw["class"] === "string" ? (raw["class"] as string) : null;
    const notes: NormalizedNote[] = [];
    const batchPdf = raw["batchPdfUrl"];
    if (typeof batchPdf === "string" && batchPdf.startsWith("http")) {
      notes.push({ id: `${batchId}-batch-pdf`, title: "Batch planner (PDF)", url: batchPdf });
    }

    return {
      status: "ok",
      course: {
        id: compositeId("source1", batchId),
        sourceCourseId: batchId,
        source: "source1",
        sourceLabel: SOURCE_LABEL.source1,
        sourceUrl: `${base()}/batch/${batchId}`,
        sourceNote: "Public course page",
        title: String(raw["name"] ?? "Course"),
        thumbnail:
          typeof raw["previewImage"] === "object" && raw["previewImage"]
            ? buildUrl(raw["previewImage"] as { baseUrl?: string; key?: string })
            : null,
        description:
          plainText(String(raw["description"] ?? "")) ||
          plainText(String(raw["shortDescription"] ?? "")) ||
          null,
        category: categoryFor(exam, className),
        className: className ? `Class ${className}` : null,
        exam: exam ? exam.replace(/_/g, " ") : null,
        language: typeof raw["language"] === "string" ? (raw["language"] as string) : null,
        startDate: typeof raw["startDate"] === "string" ? (raw["startDate"] as string) : null,
        subjects: subjectRefs.map((subject) => subject.name),
        subjectRefs,
        teachers: Array.from(new Set(subjectRefs.flatMap((subject) => subject.teachers))),
        chapters: [],
        lessons: [],
        videos: [],
        notes,
      },
    };
  });

function buildUrl(image: { baseUrl?: string; key?: string } | null): string | null {
  if (!image?.baseUrl || !image.key) return null;
  const root = image.baseUrl.endsWith("/") ? image.baseUrl : `${image.baseUrl}/`;
  return `${root}${image.key.replace(/^\/+/, "")}`;
}

/** Chapters (topics) inside one subject of a course. */
export const fetchChapters = createServerFn({ method: "GET" })
  .inputValidator((input: { courseId: string; subjectId: string }) => ({
    courseId: String(input.courseId),
    subjectId: String(input.subjectId),
  }))
  .handler(async ({ data }): Promise<{ status: "ok"; chapters: NormalizedChapter[] } | { status: "unavailable"; reason: string }> => {
    const parsed = parseCompositeId(data.courseId);
    if (!parsed) return { status: "unavailable", reason: "This course reference is not valid." };
    const raw = await content<
      { _id?: string; name?: string; videos?: number; notes?: number; lectureVideos?: number }[]
    >(
      `v2/batches/${encodeURIComponent(parsed.sourceCourseId)}/subject/${encodeURIComponent(
        data.subjectId,
      )}/topics`,
    );
    if (!raw) return { status: "unavailable", reason: UNREACHABLE };
    const chapters: NormalizedChapter[] = raw
      .filter((topic) => topic._id && topic.name)
      .map((topic) => ({
        id: topic._id!,
        title: topic.name!,
        subject: null,
        videoCount: typeof topic.videos === "number" ? topic.videos : null,
        noteCount: typeof topic.notes === "number" ? topic.notes : null,
        lessons: [],
      }));
    return { status: "ok", chapters };
  });

type RawContent = {
  _id?: string;
  topic?: string;
  url?: string | null;
  urlType?: string | null;
  videoUrl?: string | null;
  embedUrl?: string | null;
  teachers?: RawTeacher[] | null;
  videoDetails?: {
    name?: string;
    duration?: string | number;
    image?: string;
    videoUrl?: string | null;
    embedCode?: string | null;
    findKey?: string | null;
  } | null;
  homeworkIds?: {
    topic?: string;
    attachmentIds?: { baseUrl?: string; key?: string; name?: string }[];
  }[];
};

/** First publicly published URL for a lecture, whatever field it arrived in. */
function lectureUrl(item: RawContent): { url: string | null; urlType: string | null } {
  const candidates: (string | null | undefined)[] = [
    item.videoDetails?.videoUrl,
    item.videoUrl,
    item.url,
    item.embedUrl,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && /^https?:\/\//i.test(candidate.trim())) {
      return { url: candidate.trim(), urlType: item.urlType ?? null };
    }
  }
  return { url: null, urlType: item.urlType ?? null };
}

/** Lectures and notes published inside one chapter. */
export const fetchChapterContents = createServerFn({ method: "GET" })
  .inputValidator((input: { courseId: string; subjectId: string; chapterId: string }) => ({
    courseId: String(input.courseId),
    subjectId: String(input.subjectId),
    chapterId: String(input.chapterId),
  }))
  .handler(
    async ({
      data,
    }): Promise<
      | { status: "ok"; lessons: NormalizedLesson[]; notes: NormalizedNote[] }
      | { status: "unavailable"; reason: string }
    > => {
      const parsed = parseCompositeId(data.courseId);
      if (!parsed) return { status: "unavailable", reason: "This course reference is not valid." };
      const root = `v2/batches/${encodeURIComponent(parsed.sourceCourseId)}/subject/${encodeURIComponent(
        data.subjectId,
      )}/contents`;
      const query = `page=1&tag=${encodeURIComponent(data.chapterId)}`;

      const [videos, noteItems] = await Promise.all([
        content<RawContent[]>(`${root}?${query}&contentType=videos`),
        content<RawContent[]>(`${root}?${query}&contentType=notes`),
      ]);

      if (!videos && !noteItems) return { status: "unavailable", reason: UNREACHABLE };

      const lessons: NormalizedLesson[] = (videos ?? [])
        .filter((item) => item._id)
        .map((item) => {
          const { url, urlType } = lectureUrl(item);
          const resolved = resolvePlayback(url, urlType);
          return {
            id: item._id!,
            title: item.topic ?? item.videoDetails?.name ?? "Lecture",
            chapterId: data.chapterId,
            durationSeconds: durationToSeconds(item.videoDetails?.duration),
            videoUrl: resolved.videoUrl,
            embedUrl: resolved.embedUrl,
            playback: resolved.playback,
            posterUrl: item.videoDetails?.image ?? null,
            teacher: (item.teachers ?? []).map(teacherName).filter(Boolean)[0] ?? null,
            transcript: null,
            notesUrl: null,
          };
        });

      const notes: NormalizedNote[] = [];
      for (const item of noteItems ?? []) {
        for (const homework of item.homeworkIds ?? []) {
          for (const attachment of homework.attachmentIds ?? []) {
            const url = buildUrl(attachment);
            if (!url) continue;
            notes.push({
              id: `${item._id ?? "n"}-${attachment.key ?? notes.length}`,
              title: homework.topic ?? attachment.name ?? "Notes (PDF)",
              url,
            });
          }
        }
      }

      return { status: "ok", lessons, notes };
    },
  );

export type LiveClass = {
  id: string;
  topic: string;
  subjectId: string | null;
  startTime: string | null;
  endTime: string | null;
  image: string | null;
};

/** Today's publicly listed schedule for a course. */
export const fetchTodaySchedule = createServerFn({ method: "GET" })
  .inputValidator((input: { courseId: string }) => ({ courseId: String(input.courseId) }))
  .handler(
    async ({
      data,
    }): Promise<
      { status: "ok"; classes: LiveClass[] } | { status: "unavailable"; reason: string }
    > => {
      const parsed = parseCompositeId(data.courseId);
      if (!parsed) return { status: "unavailable", reason: "This course reference is not valid." };
      const raw = await content<
        {
          _id?: string;
          type?: string;
          data?: {
            _id?: string;
            topic?: string;
            startTime?: string;
            endTime?: string;
            batchSubjectId?: string;
            subjectId?: string | { _id?: string };
            videoDetails?: { image?: string; name?: string };
          };
        }[]
      >(`v2/batches/${encodeURIComponent(parsed.sourceCourseId)}/todays-schedule`);
      if (!raw) return { status: "unavailable", reason: UNREACHABLE };

      const classes: LiveClass[] = raw
        .map((entry) => entry.data ?? {})
        .filter((entry) => entry._id)
        .map((entry) => ({
          id: entry._id!,
          topic: entry.topic ?? entry.videoDetails?.name ?? "Class",
          subjectId:
            entry.batchSubjectId ??
            (typeof entry.subjectId === "string" ? entry.subjectId : entry.subjectId?._id ?? null),
          startTime: entry.startTime ?? null,
          endTime: entry.endTime ?? null,
          image: entry.videoDetails?.image ?? null,
        }));

      return { status: "ok", classes };
    },
  );
