import { createServerFn } from "@tanstack/react-start";
import {
  compositeId,
  parseCompositeId,
  extractBatchId,
  plainText,
  categoryFor,
  buildAuthorizedPlayerUrl,
  SOURCE_LABEL,
  type Category,
  type NormalizedChapter,
  type NormalizedCourse,
  type NormalizedLesson,
  type NormalizedNote,
  type NormalizedDpp,
  type LiveClassSchedule,
  type SubjectRef,
} from "./courseNormalizer";
import { getRuntimeAdminConfig } from "./adminService";

/**
 * Course and Lecture API Service for Dharam Bhai Study.
 * Authorized Batch & Stream Source: https://pw.gemtara.in
 */

const GEMTARA_BASE = "https://pw.gemtara.in";
const GEMTARA_API_BASE = `${GEMTARA_BASE}/api`;

function getAdminPrimarySource(): string | null {
  try {
    const adminConfig = getRuntimeAdminConfig();
    if (adminConfig?.settings?.primarySourceUrl) {
      return adminConfig.settings.primarySourceUrl.replace(/\/+$/, "");
    }
  } catch {
    // ignore read error
  }
  return null;
}

function baseApiUrl(): string {
  const custom = getAdminPrimarySource();
  if (custom && !custom.includes("herokuapp") && !custom.includes("physicswallahx")) {
    return `${custom.replace(/\/+$/, "")}/api`;
  }
  return GEMTARA_API_BASE;
}

function gemtaraHeaders(): Record<string, string> {
  return {
    accept: "application/json, text/plain, */*",
    referer: `${GEMTARA_BASE}/study/batches`,
    origin: GEMTARA_BASE,
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  };
}

async function fetchFromGemtara<T>(pathAndQuery: string, timeoutMs = 8000): Promise<T | null> {
  const cleanPath = pathAndQuery.replace(/^\/+/, "");
  const root = baseApiUrl();
  const url = `${root}/${cleanPath}`;

  try {
    const res = await fetch(url, {
      headers: gemtaraHeaders(),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) {
      const json = (await res.json()) as T;
      return json;
    }
  } catch {
    // ignore error
  }
  return null;
}

/* ----------------------------- Vidyaverse Integration ----------------------------- */

export const VIDYAVERSE_BASE = "https://vidya-verse.ai.studio";
export const VIDYAVERSE_SW_DIRECT =
  "https://backend.multistreaming.site/api/courses?userId=1448640";
export const VIDYAVERSE_CLASSES_DIRECT_BASE = "https://backend.multistreaming.site/api/courses";

export type VidyaverseRawClass = {
  _id?: string;
  classId?: string;
  course?: string;
  title: string;
  description?: string;
  teacherName?: string;
  duration?: number;
  class_link?: string;
  mp4Recordings?: Array<{ url: string; quality: string; size?: number; _id?: string }>;
  classPdf?: Array<{ priority?: number; name: string; url: string }>;
  status?: string;
  isActive?: boolean;
};

export type VidyaverseRawTopic = {
  topicName: string;
  topicId?: string;
  classes: VidyaverseRawClass[];
};

export type VidyaverseRawCourse = {
  id: string;
  title: string;
  banner?: string;
  bannerSquare?: string | null;
  description?: string[] | string;
  short_description?: string;
  liveClassesCount?: number;
  recordedClassesCount?: number;
  category?: { _id?: string; categoryName?: string };
  mainCategory?: { _id?: string; mainCategoryName?: string };
  facultyDetails?: Array<{ name: string; designation?: string; image?: string }>;
  validity?: string;
  price?: number;
  discountPrice?: number;
  isLive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

let cachedVidyaverseCourses: { timestamp: number; courses: VidyaverseRawCourse[] } | null = null;
const cachedVidyaverseClasses = new Map<
  string,
  {
    timestamp: number;
    data: {
      course: Partial<VidyaverseRawCourse> | null;
      classes: VidyaverseRawTopic[];
    };
  }
>();

export async function getVidyaverseCourses(): Promise<VidyaverseRawCourse[]> {
  const now = Date.now();
  if (cachedVidyaverseCourses && now - cachedVidyaverseCourses.timestamp < 3 * 60 * 1000) {
    return cachedVidyaverseCourses.courses;
  }

  // 1. Try Vidyaverse proxy endpoint
  try {
    const res = await fetch(`${VIDYAVERSE_BASE}/api/sw/courses`, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      if (list.length > 0) {
        cachedVidyaverseCourses = { timestamp: now, courses: list };
        return list;
      }
    }
  } catch {
    // fallback to direct
  }

  // 2. Direct multistreaming endpoint
  try {
    const res = await fetch(VIDYAVERSE_SW_DIRECT, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json?.data) ? json.data : [];
      if (list.length > 0) {
        cachedVidyaverseCourses = { timestamp: now, courses: list };
        return list;
      }
    }
  } catch {
    // ignore
  }

  return cachedVidyaverseCourses?.courses ?? [];
}

export async function getVidyaverseClasses(
  courseId: string,
): Promise<{ course: Partial<VidyaverseRawCourse> | null; classes: VidyaverseRawTopic[] } | null> {
  const now = Date.now();
  const cleanId = extractBatchId(courseId);
  const cached = cachedVidyaverseClasses.get(cleanId);
  if (cached && now - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
  }

  // 1. Try Vidyaverse proxy endpoint
  try {
    const res = await fetch(
      `${VIDYAVERSE_BASE}/api/sw/courses/${encodeURIComponent(cleanId)}/classes`,
      {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        signal: AbortSignal.timeout(6000),
      },
    );
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.classes && Array.isArray(json.data.classes)) {
        cachedVidyaverseClasses.set(cleanId, { timestamp: now, data: json.data });
        return json.data;
      }
    }
  } catch {
    // fallback to direct
  }

  // 2. Try direct endpoint
  try {
    const res = await fetch(
      `${VIDYAVERSE_CLASSES_DIRECT_BASE}/${encodeURIComponent(cleanId)}/classes?populate=full`,
      {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        signal: AbortSignal.timeout(9000),
      },
    );
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.classes && Array.isArray(json.data.classes)) {
        cachedVidyaverseClasses.set(cleanId, { timestamp: now, data: json.data });
        return json.data;
      }
    }
  } catch {
    // ignore
  }

  return cached?.data ?? null;
}

export function normalizeVidyaverseCourse(c: VidyaverseRawCourse): NormalizedCourse {
  const cat = categoryFor(
    c.category?.categoryName || c.mainCategory?.mainCategoryName || null,
    null,
    c.title,
  );
  const facultyRaw = c.facultyDetails as any;
  const teacherList: string[] = [];
  let facultyPhoto: string | null = null;
  if (Array.isArray(facultyRaw)) {
    for (const f of facultyRaw) {
      if (f?.name && typeof f.name === "string" && f.name.trim()) teacherList.push(f.name.trim());
      if (!facultyPhoto && (f?.imageUrl || f?.image)) facultyPhoto = f.imageUrl || f.image;
    }
  } else if (facultyRaw && typeof facultyRaw === "object") {
    if (facultyRaw.name && typeof facultyRaw.name === "string") teacherList.push(facultyRaw.name.trim());
    facultyPhoto = facultyRaw.imageUrl || facultyRaw.image || null;
  }

  if (teacherList.length === 0) {
    if (c.title.toLowerCase().includes("gagan")) teacherList.push("Gagan Pratap Sir");
    else if (c.title.toLowerCase().includes("aman")) teacherList.push("Aman Vashishth Sir");
    else if (c.title.toLowerCase().includes("neeraj")) teacherList.push("Neeraj Sir");
    else teacherList.push("Vidyaverse Expert Faculty");
  }

  const descText = Array.isArray(c.description)
    ? c.description.join(" • ")
    : typeof c.description === "string"
      ? plainText(c.description)
      : c.short_description || "Comprehensive course lecture video and notes from Vidyaverse";

  const totalClasses = (c.liveClassesCount || 0) + (c.recordedClassesCount || 0);

  const coursePhoto =
    c.banner ||
    c.bannerSquare ||
    facultyPhoto ||
    (c.title.toLowerCase().includes("math")
      ? "/desk-physics.jpg"
      : c.title.toLowerCase().includes("chem")
        ? "/desk-chemistry.jpg"
        : "/lesson-backdrop.jpg");

  return {
    id: compositeId("vidyaverse", c.id),
    sourceCourseId: c.id,
    slug: null,
    source: "vidyaverse",
    sourceLabel: SOURCE_LABEL.vidyaverse,
    sourceUrl: `${VIDYAVERSE_BASE}/courses/${c.id}`,
    sourceNote: "Vidyaverse Course",
    title: c.title,
    thumbnail: coursePhoto,
    description: descText,
    category: cat,
    className: null,
    exam: c.category?.categoryName || "Competitive Exams",
    language: "Hinglish",
    startDate: c.createdAt || null,
    subjects: [c.category?.categoryName || "Full Course"],
    subjectRefs: [
      {
        id: c.id,
        name: c.category?.categoryName || "Full Course",
        lectureCount: totalClasses > 0 ? totalClasses : null,
        teachers: teacherList,
        imageId: "/defaultSubject.svg",
      },
    ],
    teachers: teacherList,
    chapters: [],
    lessons: [],
    videos: [],
    notes: [],
    validity: c.validity || null,
    price: c.price || null,
    discountPrice: c.discountPrice || null,
    isLive: c.isLive || false,
  };
}

export type CoursePage = {
  courses: NormalizedCourse[];
  nextCursor: number | null;
  state: {
    label: string;
    status: "ok" | "error";
    message: string | null;
    count: number;
  };
};

export type CourseDetailResult =
  { status: "ok"; course: NormalizedCourse } | { status: "unavailable"; reason: string };

const UNREACHABLE = "The public course source could not be reached right now.";

/* ----------------------------- Catalogue Batches ----------------------------- */

type RawCatalogueBatch = {
  _id?: string;
  id?: string;
  batch_id?: string;
  name?: string;
  byName?: string;
  startDate?: string | null;
  start_date?: string | null;
  endDate?: string | null;
  end_date?: string | null;
  language?: string | null;
  previewImage?: { baseUrl?: string; key?: string } | string | null;
  photo?: string | null;
  feeTotal?: number | null;
  type?: string | null;
  slug?: string | null;
  exam?: string | string[] | null;
  className?: string | null;
  class?: string | null;
};

let cachedCatalogue: RawCatalogueBatch[] | null = null;
let cachedCatalogueExpiry = 0;
const CATALOGUE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

async function getCatalogueBatches(): Promise<RawCatalogueBatch[]> {
  const now = Date.now();
  if (cachedCatalogue && now < cachedCatalogueExpiry && cachedCatalogue.length > 0) {
    return cachedCatalogue;
  }

  // Fetch batches across pages from pw.gemtara.in/api/AllBatches
  const allBatches: RawCatalogueBatch[] = [];
  const seenIds = new Set<string>();

  try {
    const pagePromises = [1, 2, 3, 4, 5].map((page) =>
      fetchFromGemtara<{ data?: RawCatalogueBatch[] } | RawCatalogueBatch[]>(
        `AllBatches?page=${page}`,
        7000,
      ),
    );

    const results = await Promise.all(pagePromises);
    for (const res of results) {
      if (!res) continue;
      const list = Array.isArray(res) ? res : res.data;
      if (Array.isArray(list)) {
        for (const item of list) {
          const id = item._id || item.id || item.slug;
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            allBatches.push(item);
          }
        }
      }
    }

    if (allBatches.length > 0) {
      cachedCatalogue = allBatches;
      cachedCatalogueExpiry = now + CATALOGUE_TTL_MS;
      return cachedCatalogue;
    }
  } catch {
    // fallback below
  }

  return cachedCatalogue ?? [];
}

async function searchBatchesRemote(query: string): Promise<RawCatalogueBatch[]> {
  try {
    const res = await fetchFromGemtara<{ data?: RawCatalogueBatch[] } | RawCatalogueBatch[]>(
      `searchBatch?name=${encodeURIComponent(query)}`,
      6000,
    );
    if (res) {
      const list = Array.isArray(res) ? res : res.data;
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

/* -------------------------------- Helpers -------------------------------- */

function inferCategory(
  title: string,
  rawExam?: string | string[] | null,
  rawClass?: string | null,
): Category {
  const examStr = Array.isArray(rawExam) ? rawExam.join(" ") : (rawExam ?? "");
  return categoryFor(examStr, rawClass ?? null, title);
}

function buildUrl(
  image: { baseUrl?: string; key?: string; name?: string } | string | null | undefined,
): string | null {
  if (!image) return null;
  if (typeof image === "string") {
    const trimmed = image.trim();
    if (!trimmed) return null;
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("//")
    ) {
      return trimmed;
    }
    return `https://static.pw.live/${trimmed.replace(/^\/+/, "")}`;
  }
  const fileKey = (image.key || image.name || "").trim();
  if (!image.baseUrl && fileKey) {
    if (fileKey.startsWith("http://") || fileKey.startsWith("https://")) return fileKey;
    return `https://static.pw.live/${encodeURIComponent(fileKey.replace(/^\/+/, ""))}`;
  }
  if (!image.baseUrl && !fileKey) return null;
  if (image.baseUrl && fileKey) {
    const root = image.baseUrl.endsWith("/") ? image.baseUrl : `${image.baseUrl}/`;
    return `${root}${encodeURIComponent(fileKey.replace(/^\/+/, ""))}`;
  }
  if (image.baseUrl) {
    return image.baseUrl;
  }
  return null;
}

function fromCatalogueItem(raw: RawCatalogueBatch): NormalizedCourse | null {
  const sourceCourseId = raw._id ?? raw.id ?? raw.batch_id ?? raw.slug;
  const title = (raw.name ?? "").trim();
  if (!sourceCourseId || !title) return null;

  const rawExam = raw.exam ?? null;
  const rawClass = raw.className ?? raw.class ?? null;
  const category = inferCategory(title, rawExam, rawClass);
  const className = rawClass ? `Class ${rawClass}` : null;
  const exam = category === "JEE" ? "JEE" : category === "NEET" ? "NEET" : null;
  const thumbnail = buildUrl(raw.previewImage ?? raw.photo);

  return {
    id: compositeId("source1", sourceCourseId),
    sourceCourseId,
    slug: raw.slug ?? null,
    source: "source1",
    sourceLabel: SOURCE_LABEL.source1,
    sourceUrl: `${GEMTARA_BASE}/study/batches/${sourceCourseId}`,
    sourceNote: "Dharam Bhai Study Verified Batch",
    title,
    thumbnail,
    description: raw.byName ?? null,
    category,
    className,
    exam,
    language: raw.language ?? "Hinglish",
    startDate: raw.startDate ?? raw.start_date ?? null,
    subjects: [],
    subjectRefs: [],
    teachers: [],
    chapters: [],
    lessons: [],
    videos: [],
    notes: [],
  };
}

function parseDurationToSeconds(duration: string | number | null | undefined): number | null {
  if (typeof duration === "number") return duration;
  if (!duration || typeof duration !== "string") return null;
  const parts = duration.split(":").map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

type RawTeacher = { firstName?: string; lastName?: string; name?: string };

function teacherName(entry: RawTeacher | string | null | undefined): string | null {
  if (!entry) return null;
  if (typeof entry === "string") return entry.trim() || null;
  const full = [entry.firstName, entry.lastName].filter(Boolean).join(" ").trim();
  return full || entry.name?.trim() || null;
}

type RawGemtaraSubject = {
  _id?: string;
  id?: string;
  subject?: string;
  name?: string;
  slug?: string;
  tagCount?: number;
  lectureCount?: number;
  imageId?: { baseUrl?: string; key?: string } | string;
  teacherIds?: Array<RawTeacher | string>;
};

type RawGemtaraChapter = {
  _id?: string;
  id?: string;
  name?: string;
  topic?: string;
  slug?: string;
  videos?: number;
  notes?: number;
  exercises?: number;
  lectureVideos?: number;
};

type RawContent = {
  _id?: string;
  topic?: string;
  url?: string | null;
  urlType?: string | null;
  scheduleDate?: string | null;
  createdAt?: string | null;
  videoDetails?: {
    name?: string;
    duration?: string;
    image?: string;
    videoUrl?: string;
    _id?: string;
    order?: number;
  } | null;
  homeworkIds?: {
    topic?: string;
    createdAt?: string | null;
    attachmentIds?: { baseUrl?: string; key?: string; name?: string }[];
  }[];
  chapterId?: string | null;
  teachers?: Array<RawTeacher | string>;
};

export type NormalizedDppTest = NormalizedDpp;

/* ------------------------------- Server Functions -------------------------------- */

/**
 * Fetch available study batches from pw.gemtara.in
 */
export const fetchCourses = createServerFn({ method: "GET" })
  .inputValidator(
    (
      input:
        | {
            q?: string;
            category?: Category;
            cursor?: number;
            source?: "all" | "vidyaverse" | "gemtara";
          }
        | undefined,
    ) => ({
      q: String(input?.q ?? "").slice(0, 120),
      category: input?.category,
      cursor: Math.max(1, Number(input?.cursor ?? 1)),
      source: (input?.source ?? "vidyaverse") as "all" | "vidyaverse" | "gemtara",
    }),
  )
  .handler(async ({ data }): Promise<CoursePage> => {
    try {
      const adminConfig = getRuntimeAdminConfig();
      const disabledSet = new Set([
        ...(adminConfig.disabledCourseIds ?? []),
        ...(adminConfig.disabledBatchIds ?? []),
      ]);
      const pageSize = 24;
      const query = data.q.trim().toLowerCase();

      // Fetch all Vidyaverse courses (exclusive source)
      const rawVv = await getVidyaverseCourses();
      const vidyaverseCourses: NormalizedCourse[] = [];

      for (const item of rawVv) {
        if (!item || !item.id) continue;
        if (disabledSet.has(item.id) || disabledSet.has(`vv-${item.id}`)) continue;

        const norm = normalizeVidyaverseCourse(item);
        if (data.category && norm.category !== data.category) continue;
        if (query) {
          const text =
            `${norm.title} ${norm.description} ${norm.teachers.join(" ")} ${norm.exam}`.toLowerCase();
          if (!text.includes(query)) continue;
        }
        vidyaverseCourses.push(norm);
      }

      const total = vidyaverseCourses.length;
      const startIndex = (data.cursor - 1) * pageSize;
      const paged = vidyaverseCourses.slice(startIndex, startIndex + pageSize);
      const hasMore = startIndex + pageSize < total;

      return {
        courses: paged,
        nextCursor: hasMore ? data.cursor + 1 : null,
        state: {
          label: SOURCE_LABEL.vidyaverse,
          status: "ok",
          message: null,
          count: total,
        },
      };
    } catch (err) {
      return {
        courses: [],
        nextCursor: null,
        state: {
          label: "Courses",
          status: "error",
          message: err instanceof Error ? err.message : "Failed to load courses",
          count: 0,
        },
      };
    }
  });

/**
 * Batch Details: subjects, instructors, description from pw.gemtara.in/api/BatchInfo
 */
export const fetchCourseDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { courseId: string }) => ({ courseId: String(input.courseId) }))
  .handler(async ({ data }): Promise<CourseDetailResult> => {
    const adminConfig = getRuntimeAdminConfig();
    const disabledSet = new Set([
      ...adminConfig.disabledCourseIds,
      ...adminConfig.disabledBatchIds,
    ]);

    if (disabledSet.has(data.courseId)) {
      return { status: "unavailable", reason: "This course has been deactivated." };
    }

    // 1. Custom admin course match
    const customMatch = adminConfig.customCourses.find((c) => c.id === data.courseId);
    if (customMatch) {
      const customNotes: NormalizedNote[] = adminConfig.customNotes
        .filter((n) => n.courseId === data.courseId)
        .map((n) => ({ id: n.id, title: n.title, url: n.url }));

      return {
        status: "ok",
        course: {
          id: customMatch.id,
          sourceCourseId: customMatch.id,
          source: "source1",
          sourceLabel: "Dharam Bhai Study",
          sourceUrl: null,
          sourceNote: "Dharam Bhai Study Special Batch",
          title: customMatch.title,
          thumbnail: customMatch.thumbnail,
          description: customMatch.description,
          category: customMatch.category,
          className: customMatch.className,
          exam: customMatch.exam,
          language: "Hinglish",
          startDate: null,
          subjects: customMatch.subjects,
          subjectRefs: customMatch.subjectRefs,
          teachers: Array.from(new Set(customMatch.subjectRefs.flatMap((s) => s.teachers))),
          chapters: [],
          lessons: [],
          videos: [],
          notes: customNotes,
        },
      };
    }

    // 2. Vidyaverse course match
    const cleanBatchId = extractBatchId(data.courseId);
    if (!cleanBatchId) {
      return { status: "unavailable", reason: "Invalid batch identifier." };
    }
    if (disabledSet.has(cleanBatchId) || disabledSet.has(`vv-${cleanBatchId}`)) {
      return { status: "unavailable", reason: "This course has been deactivated." };
    }

    // 2. Vidyaverse course match (primary & exclusive source)
    try {
      const classesData = await getVidyaverseClasses(cleanBatchId);
      const allVv = await getVidyaverseCourses();
      const meta = allVv.find((c) => c.id === cleanBatchId) || classesData?.course;

      if (classesData?.classes || meta) {
        const title = meta?.title || classesData?.course?.title || "Vidyaverse Course";
        const cat = categoryFor(
          meta?.category?.categoryName || meta?.mainCategory?.mainCategoryName || null,
          null,
          title,
        );

        const subjectRefs: SubjectRef[] = [];
        const notes: NormalizedNote[] = [];
        const allTeachers = new Set<string>();

        for (const t of classesData?.classes || []) {
          const topicTeachers = Array.from(
            new Set((t.classes || []).map((c) => c.teacherName).filter(Boolean)),
          ) as string[];
          topicTeachers.forEach((tea) => allTeachers.add(tea));

          subjectRefs.push({
            id: t.topicId || t.topicName,
            slug: null,
            name: t.topicName,
            lectureCount: t.classes?.length || 0,
            teachers: topicTeachers,
            imageId: "/defaultSubject.svg",
          });

          for (const cls of t.classes || []) {
            for (const pdf of cls.classPdf || []) {
              if (pdf.url) {
                notes.push({
                  id: `${cls._id || "cls"}-pdf-${notes.length}`,
                  title: pdf.name || `${cls.title} (PDF)`,
                  url: pdf.url,
                  type: "notes",
                });
              }
            }
          }
        }

        if (allTeachers.size === 0) {
          if (meta?.facultyDetails?.length) {
            meta.facultyDetails.forEach((f) => {
              if (f && typeof f.name === "string" && f.name.trim()) {
                allTeachers.add(f.name.trim());
              }
            });
          } else {
            if (title.toLowerCase().includes("gagan")) allTeachers.add("Gagan Pratap Sir");
            else if (title.toLowerCase().includes("aman")) allTeachers.add("Aman Vashishth Sir");
            else allTeachers.add("Vidyaverse Expert Faculty");
          }
        }

        const desc =
          (Array.isArray(meta?.description) ? meta?.description.join(" • ") : meta?.description) ||
          meta?.short_description ||
          "Full course lecture videos and class PDFs from Vidyaverse";

        return {
          status: "ok",
          course: {
            id: compositeId("vidyaverse", cleanBatchId),
            sourceCourseId: cleanBatchId,
            slug: null,
            source: "vidyaverse",
            sourceLabel: SOURCE_LABEL.vidyaverse,
            sourceUrl: `${VIDYAVERSE_BASE}/courses/${cleanBatchId}`,
            sourceNote: "Vidyaverse Course",
            title,
            thumbnail:
              meta?.banner ||
              meta?.bannerSquare ||
              (meta?.facultyDetails as any)?.imageUrl ||
              "/desk-physics.jpg",
            description: desc,
            category: cat,
            className: null,
            exam: meta?.category?.categoryName || "Competitive Exams",
            language: "Hinglish",
            startDate: meta?.createdAt || null,
            subjects: subjectRefs.map((s) => s.name),
            subjectRefs,
            teachers: Array.from(allTeachers),
            chapters: [],
            lessons: [],
            videos: [],
            notes,
            validity: meta?.validity || null,
            price: meta?.price || null,
            discountPrice: meta?.discountPrice || null,
            isLive: meta?.isLive || false,
          },
        };
      }

      return {
        status: "unavailable",
        reason: "Course not found in Vidyaverse catalog.",
      };
    } catch {
      return {
        status: "unavailable",
        reason: "Could not connect to Vidyaverse stream servers.",
      };
    }
  });

/**
 * Chapters (topics) inside a subject: pw.gemtara.in/api/SubjectInfo
 */
function formatSeconds(sec: number | null | undefined): string | null {
  if (typeof sec !== "number" || isNaN(sec) || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}h ${remM}m`;
  }
  return `${m}m ${s}s`;
}

export const fetchChapters = createServerFn({ method: "GET" })
  .inputValidator((input: { courseId: string; subjectId: string }) => ({
    courseId: String(input.courseId),
    subjectId: String(input.subjectId),
  }))
  .handler(
    async ({
      data,
    }): Promise<
      { status: "ok"; chapters: NormalizedChapter[] } | { status: "unavailable"; reason: string }
    > => {
      const adminConfig = getRuntimeAdminConfig();

      // Check if custom admin course
      const customCourse = adminConfig.customCourses.find((c) => c.id === data.courseId);
      if (customCourse) {
        const matchingLectures = adminConfig.customLectures.filter(
          (l) => l.courseId === data.courseId && l.subjectId === data.subjectId,
        );
        const chapterMap = new Map<string, { title: string; count: number }>();
        chapterMap.set(`chap-${data.subjectId}-01`, {
          title: `${customCourse.subjectRefs.find((s) => s.id === data.subjectId)?.name ?? "Core"} Masterclass & Key Concepts`,
          count: matchingLectures.length,
        });

        for (const lec of matchingLectures) {
          const current = chapterMap.get(lec.chapterId) ?? { title: "Complete Topic", count: 0 };
          current.count += 1;
          chapterMap.set(lec.chapterId, current);
        }

        const chapters: NormalizedChapter[] = Array.from(chapterMap.entries()).map(
          ([chapId, meta]) => ({
            id: chapId,
            title: meta.title,
            subject: null,
            videoCount: meta.count,
            noteCount: adminConfig.customNotes.filter((n) => n.courseId === data.courseId).length,
            lessons: [],
          }),
        );
        return { status: "ok", chapters };
      }

      // Check Vidyaverse course (exclusive source)
      try {
        const rawCourseId = extractBatchId(data.courseId);
        const classesData = await getVidyaverseClasses(rawCourseId);
        if (classesData?.classes && classesData.classes.length > 0) {
          const chapters: NormalizedChapter[] = classesData.classes.map((t) => ({
            id: t.topicId || t.topicName,
            title: t.topicName,
            subject: t.topicName,
            videoCount: t.classes?.length || 0,
            noteCount: t.classes?.reduce((acc, c) => acc + (c.classPdf?.length || 0), 0) || 0,
            lessons: [],
          }));
          return { status: "ok", chapters };
        }
        return { status: "ok", chapters: [] };
      } catch {
        return { status: "unavailable", reason: "Could not retrieve Vidyaverse course topics." };
      }
    },
  );

export type ChapterContentsResult =
  | {
      status: "ok";
      lessons: NormalizedLesson[];
      notes: NormalizedNote[];
      dppNotes: NormalizedNote[];
      dppVideos: NormalizedLesson[];
      dppTests: NormalizedDpp[];
    }
  | { status: "unavailable"; reason: string };

/**
 * Lectures, notes, DPP resources for a chapter: pw.gemtara.in/api/TopicInfo
 */
export const fetchChapterContents = createServerFn({ method: "GET" })
  .inputValidator(
    (input: { courseId: string; subjectId: string; chapterId: string; chapterSlug?: string }) => ({
      courseId: String(input.courseId),
      subjectId: String(input.subjectId),
      chapterId: String(input.chapterId),
      chapterSlug: input.chapterSlug ? String(input.chapterSlug) : undefined,
    }),
  )
  .handler(async ({ data }): Promise<ChapterContentsResult> => {
    const adminConfig = getRuntimeAdminConfig();
    const lessons: NormalizedLesson[] = [];
    const notes: NormalizedNote[] = [];
    const dppNotes: NormalizedNote[] = [];
    const dppVideos: NormalizedLesson[] = [];
    const dppTests: NormalizedDpp[] = [];

    const seenLessonIds = new Set<string>();
    const seenNoteIds = new Set<string>();
    const seenDppNoteIds = new Set<string>();
    const seenDppVideoIds = new Set<string>();

    // Add custom admin lectures
    const customLectures = adminConfig.customLectures.filter(
      (l) => l.courseId === data.courseId && l.chapterId === data.chapterId,
    );
    for (const cl of customLectures) {
      if (seenLessonIds.has(cl.id)) continue;
      seenLessonIds.add(cl.id);
      lessons.push({
        id: cl.id,
        title: cl.title,
        chapterId: data.chapterId,
        durationSeconds: cl.durationSeconds ?? 3600,
        durationFormatted: null,
        videoUrl: cl.videoUrl,
        videoType: cl.videoUrl.includes(".mpd") ? "dash" : "hls",
        posterUrl: null,
        order: cl.order,
        notesUrl: cl.notesUrl ?? null,
      });
    }

    // Add custom admin notes
    const customNotes = adminConfig.customNotes.filter(
      (n) => n.courseId === data.courseId && n.chapterId === data.chapterId,
    );
    for (const cn of customNotes) {
      if (seenNoteIds.has(cn.id)) continue;
      seenNoteIds.add(cn.id);
      notes.push({ id: cn.id, title: cn.title, url: cn.url, type: "notes" });
    }

    // Check Vidyaverse course (primary & exclusive source)
    try {
      const rawCourseId = extractBatchId(data.courseId);
      const classesData = await getVidyaverseClasses(rawCourseId);
      if (classesData?.classes) {
        const matchedTopic = classesData.classes.find(
          (t) =>
            t.topicId === data.chapterId ||
            t.topicName === data.chapterId ||
            t.topicId === data.subjectId ||
            t.topicName === data.subjectId,
        );

        const targetClasses = matchedTopic
          ? matchedTopic.classes
          : classesData.classes.flatMap((t) => t.classes);

        for (let i = 0; i < (targetClasses || []).length; i++) {
          const cls = targetClasses[i];
          const directStream = cls.class_link || cls.mp4Recordings?.[0]?.url || "";
          const isHls = directStream.includes(".m3u8");
          const durationSec = typeof cls.duration === "number" ? cls.duration : null;

          lessons.push({
            id: cls._id || cls.classId || `vv-lec-${i}`,
            title: cls.title,
            chapterId: data.chapterId,
            durationSeconds: durationSec,
            durationFormatted: formatSeconds(durationSec),
            videoUrl: directStream,
            videoType: isHls ? "hls" : "direct",
            playerEmbedUrl: directStream,
            studyRatnaUrl: null,
            pwMarcoUrl: directStream,
            pwMarcoPlayerUrl: directStream,
            posterUrl: null,
            notesUrl: cls.classPdf?.[0]?.url || null,
            order: i + 1,
            mp4Recordings: cls.mp4Recordings,
            teacherName: cls.teacherName || null,
          });

          for (let pIdx = 0; pIdx < (cls.classPdf || []).length; pIdx++) {
            const pdf = cls.classPdf[pIdx];
            if (pdf.url) {
              notes.push({
                id: `${cls._id || "cls"}-note-${pIdx}`,
                title: pdf.name || `${cls.title} Notes (PDF)`,
                url: pdf.url,
                type: "notes",
              });
            }
          }
        }

        return {
          status: "ok",
          lessons,
          notes,
          dppNotes,
          dppVideos,
          dppTests,
        };
      }
    } catch {
      // ignore
    }

    return {
      status: "ok",
      lessons,
      notes,
      dppNotes,
      dppVideos,
      dppTests,
    };
  });

  export type LiveClass = LiveClassSchedule;

/**
 * Today's live and scheduled classes for a course.
 */
export const fetchTodaySchedule = createServerFn({ method: "GET" })
  .inputValidator((input: { courseId: string }) => ({ courseId: String(input.courseId) }))
  .handler(
    async ({
      data,
    }): Promise<
      { status: "ok"; classes: LiveClassSchedule[] } | { status: "unavailable"; reason: string }
    > => {
      return { status: "ok", classes: [] };
    },
  );

export type LectureStreamResult =
  | {
      status: "ok";
      source: "gemtara";
      videoUrl: string | null;
      videoType: "hls" | "dash" | "direct" | "youtube" | "embed";
      playerEmbedUrl: string | null;
      clearKeys?: Record<string, string> | null;
      stream: {
        videoUrl: string | null;
        videoType: "hls" | "dash" | "direct" | "youtube" | "embed";
      };
      studyRatnaUrl?: string | null;
      pwMarcoUrl?: string | null;
      pwMarcoPlayerUrl?: string | null;
    }
  | { status: "unavailable"; reason: string };

/**
 * Resolves authorized video stream and player URL for a given lecture
 */
export async function resolveLectureSourceStream(params: {
  videoId?: string;
  topic?: string;
  batchId?: string;
  subjectId?: string;
  chapterId?: string;
}): Promise<LectureStreamResult> {
  const vidId = params.videoId ? String(params.videoId).trim() : "";
  if (!vidId) {
    return { status: "unavailable", reason: "Lecture ID missing." };
  }

  const batchId = extractBatchId(params.batchId);
  const subjectId = params.subjectId ?? "";
  const topic = params.topic ?? "Lecture";

  // Build authorized web player embed URL from source
  const playerEmbedUrl = buildAuthorizedPlayerUrl({
    videoId: vidId,
    batchId,
    subjectId,
    topicId: params.chapterId,
    title: topic,
  });

  // Call pw.gemtara.in/api/get-video-with-keys
  if (batchId && subjectId) {
    try {
      const res = await fetchFromGemtara<{
        url?: string;
        signedUrl?: string;
        clearKeys?: Record<string, string>;
      }>(
        `get-video-with-keys?batchId=${encodeURIComponent(batchId)}&subjectId=${encodeURIComponent(subjectId)}&childId=${encodeURIComponent(vidId)}`,
        6000,
      );

      if (res?.url) {
        const fullStreamUrl = res.signedUrl ? `${res.url}${res.signedUrl}` : res.url;
        const vType = fullStreamUrl.includes(".mpd") ? "dash" : "hls";

        return {
          status: "ok",
          source: "gemtara",
          videoUrl: fullStreamUrl,
          videoType: vType,
          playerEmbedUrl,
          clearKeys: res.clearKeys ?? null,
          stream: {
            videoUrl: fullStreamUrl,
            videoType: vType,
          },
          studyRatnaUrl: null,
          pwMarcoUrl: fullStreamUrl,
          pwMarcoPlayerUrl: playerEmbedUrl,
        };
      }
    } catch {
      // fallback to embed
    }
  }

  return {
    status: "ok",
    source: "gemtara",
    videoUrl: null,
    videoType: "embed",
    playerEmbedUrl,
    stream: {
      videoUrl: null,
      videoType: "embed",
    },
    studyRatnaUrl: null,
    pwMarcoUrl: null,
    pwMarcoPlayerUrl: playerEmbedUrl,
  };
}

export const resolveLectureStreamServerFn = createServerFn({ method: "GET" })
  .inputValidator(
    (input: { topic?: string; lessonId?: string; batchId?: string; subjectId?: string }) => ({
      topic: input.topic ? String(input.topic) : undefined,
      lessonId: input.lessonId ? String(input.lessonId) : undefined,
      batchId: input.batchId ? String(input.batchId) : undefined,
      subjectId: input.subjectId ? String(input.subjectId) : undefined,
    }),
  )
  .handler(async ({ data }): Promise<LectureStreamResult> => {
    return resolveLectureSourceStream({
      videoId: data.lessonId,
      topic: data.topic,
      batchId: data.batchId,
      subjectId: data.subjectId,
    });
  });

export type ScheduleDetailResult =
  { status: "ok"; lesson: NormalizedLesson } | { status: "unavailable"; reason: string };

/**
 * Fetch schedule & video details for a specific lecture from pw.gemtara.in
 */
export const fetchScheduleDetails = createServerFn({ method: "GET" })
  .inputValidator((input: { courseId: string; subjectId?: string; lessonId: string }) => ({
    courseId: String(input.courseId),
    subjectId: input.subjectId ? String(input.subjectId) : undefined,
    lessonId: String(input.lessonId),
  }))
  .handler(async ({ data }): Promise<ScheduleDetailResult> => {
    const batchId = extractBatchId(data.courseId);
    const lessonId = data.lessonId;
    const subjectId = data.subjectId ?? "";

    let topic = "Course Lecture";
    let durationSeconds: number | null = null;
    let durationFormatted: string | null = null;
    let posterUrl: string | null = null;
    let notesUrl: string | null = null;
    let directStreamUrl: string | null = null;

    // Check Vidyaverse course (primary & exclusive source)
    try {
      const rawCourseId = extractBatchId(data.courseId);
      const classesData = await getVidyaverseClasses(rawCourseId);
      if (classesData?.classes) {
        for (const t of classesData.classes) {
          const found = t.classes.find(
            (c) => c._id === lessonId || c.classId === lessonId || c.title.includes(lessonId),
          );
          if (found) {
            const stream = found.class_link || found.mp4Recordings?.[0]?.url || "";
            const isHls = stream.includes(".m3u8");
            const durationSec = typeof found.duration === "number" ? found.duration : null;

            return {
              status: "ok",
              lesson: {
                id: lessonId,
                title: found.title,
                chapterId: t.topicId || t.topicName,
                durationSeconds: durationSec,
                durationFormatted: formatSeconds(durationSec),
                videoUrl: stream,
                videoType: isHls ? "hls" : "direct",
                playerEmbedUrl: stream,
                studyRatnaUrl: null,
                pwMarcoUrl: stream,
                pwMarcoPlayerUrl: stream,
                posterUrl: null,
                notesUrl: found.classPdf?.[0]?.url || null,
                mp4Recordings: found.mp4Recordings,
                teacherName: found.teacherName || null,
              },
            };
          }
        }
      }
    } catch {
      // fallback
    }

    // 1. Fetch Schedule metadata
    if (batchId && subjectId) {
      try {
        const scheduleRes = await fetchFromGemtara<{
          success?: boolean;
          data?: RawContent;
        }>(
          `Schedule?BatchId=${encodeURIComponent(batchId)}&SubjectId=${encodeURIComponent(subjectId)}&ContentId=${encodeURIComponent(lessonId)}`,
          7000,
        );

        const scheduleData = scheduleRes?.data;
        if (scheduleData) {
          topic = scheduleData.topic || scheduleData.videoDetails?.name || topic;
          durationSeconds = parseDurationToSeconds(scheduleData.videoDetails?.duration);
          durationFormatted = scheduleData.videoDetails?.duration ?? null;
          posterUrl = buildUrl(scheduleData.videoDetails?.image);

          // Check if YouTube
          if (
            scheduleData.urlType === "youtube" ||
            (scheduleData.url && isYouTubeUrl(scheduleData.url))
          ) {
            const ytId = extractYouTubeId(scheduleData.url);
            if (ytId) {
              directStreamUrl = `https://www.youtube.com/embed/${ytId}`;
            }
          }

          // Check if class notes are attached
          for (const hw of scheduleData.homeworkIds ?? []) {
            for (const att of hw.attachmentIds ?? []) {
              const url = buildUrl(att);
              if (url) {
                notesUrl = url;
                break;
              }
            }
            if (notesUrl) break;
          }
        }
      } catch {
        // ignore error
      }

      // 2. Fetch authenticated video URL with keys if not already a stream
      if (!directStreamUrl) {
        try {
          const videoRes = await fetchFromGemtara<{
            url?: string;
            signedUrl?: string;
            clearKeys?: Record<string, string>;
          }>(
            `get-video-with-keys?batchId=${encodeURIComponent(batchId)}&subjectId=${encodeURIComponent(subjectId)}&childId=${encodeURIComponent(lessonId)}`,
            6000,
          );

          if (videoRes?.url) {
            directStreamUrl = videoRes.signedUrl
              ? `${videoRes.url}${videoRes.signedUrl}`
              : videoRes.url;
          }
        } catch {
          // ignore
        }
      }
    }

    // Build authorized web player embed URL
    const isYt = Boolean(directStreamUrl && isYouTubeUrl(directStreamUrl));
    const playerEmbedUrl = isYt
      ? directStreamUrl
      : buildAuthorizedPlayerUrl({
          videoId: lessonId,
          batchId,
          subjectId,
          title: topic,
        });

    const isDirectAvailable = Boolean(directStreamUrl);
    const vType = isYt
      ? "youtube"
      : isDirectAvailable
        ? directStreamUrl!.includes(".mpd")
          ? "dash"
          : "hls"
        : "embed";

    return {
      status: "ok",
      lesson: {
        id: lessonId,
        title: topic,
        chapterId: null,
        durationSeconds,
        durationFormatted,
        videoUrl: directStreamUrl || null,
        videoType: vType,
        playerEmbedUrl,
        studyRatnaUrl: null,
        pwMarcoUrl: directStreamUrl || null,
        pwMarcoPlayerUrl: playerEmbedUrl,
        posterUrl,
        notesUrl,
      },
    };
  });
