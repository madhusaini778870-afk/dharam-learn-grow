/**
 * One normalized course format for the whole app, so every screen renders the
 * same shape. Pure functions only — safe on client and server.
 *
 * Nothing here invents data: every field is either present in the public source
 * payload or left null/empty.
 */

export type CourseSource = "source1" | "vidyaverse";

export const SOURCE_LABEL: Record<CourseSource, string> = {
  source1: "PW Batches (Gemtara)",
  vidyaverse: "Vidyaverse (Selection Way)",
};

export const VIDYAVERSE_BASE = "https://vidya-verse.ai.studio";
export const VIDYAVERSE_MULTISTREAM_BASE = "https://backend.multistreaming.site/api";

export type Category =
  | "JEE"
  | "NEET"
  | "Airforce & Defence"
  | "UPSC"
  | "CA & Commerce"
  | "SSC & Govt"
  | "Class 12"
  | "Class 11"
  | "Class 10"
  | "Class 9"
  | "Foundation"
  | "Other";

export const CATEGORIES: Category[] = [
  "JEE",
  "NEET",
  "Airforce & Defence",
  "UPSC",
  "CA & Commerce",
  "SSC & Govt",
  "Class 12",
  "Class 11",
  "Class 10",
  "Class 9",
  "Foundation",
  "Other",
];

export type NormalizedLesson = {
  id: string;
  title: string;
  chapterId?: string | null;
  durationSeconds?: number | null;
  durationFormatted?: string | null;
  videoUrl?: string | null;
  videoType?: "hls" | "dash" | "direct" | "embed" | "unavailable";
  playerEmbedUrl?: string | null;
  studyRatnaUrl?: string | null;
  pwMarcoUrl?: string | null;
  pwMarcoPlayerUrl?: string | null;
  posterUrl?: string | null;
  transcript?: string | null;
  notesUrl?: string | null;
  order?: number;
  date?: string | null;
  mp4Recordings?: Array<{ quality: string; url: string; size?: number }>;
  teacherName?: string | null;
};

export type NormalizedDpp = {
  id: string;
  title: string;
  type: "pdf" | "video" | "test";
  url?: string | null;
  videoUrl?: string | null;
  videoType?: "hls" | "dash" | "direct" | "embed" | "unavailable";
  playerEmbedUrl?: string | null;
  studyRatnaUrl?: string | null;
  pwMarcoUrl?: string | null;
  pwMarcoPlayerUrl?: string | null;
  posterUrl?: string | null;
  durationSeconds?: number | null;
  durationFormatted?: string | null;
  totalQuestions?: number | null;
  totalMarks?: number | null;
  maxDuration?: number | null;
  actions?: string[];
  date?: string | null;
};

export type LiveClassSchedule = {
  id: string;
  topic: string;
  subjectId: string | null;
  subjectName?: string | null;
  batchSubjectId?: string | null;
  status: "live" | "upcoming" | "ended";
  startTime: string | null;
  endTime: string | null;
  timeRangeFormatted?: string | null;
  image: string | null;
  lectureType?: string | null;
  batchId?: string | null;
};

export function parseDurationToSeconds(
  duration: string | number | null | undefined,
): number | null {
  if (typeof duration === "number") return duration;
  if (!duration || typeof duration !== "string") return null;
  const parts = duration.split(":").map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

/**
 * Primary Video Lecture CDN source requested for high-speed course playback
 */
export const GEMTARA_BASE = "https://pw.gemtara.in";
export const GEMTARA_BATCHES_URL = "https://pw.gemtara.in/study/batches";
export const VIDCLOUD_PLAYER_BASE = "https://vidcloud.eu.org/play.php";

/**
 * Extracts a YouTube video ID from various YouTube URL formats.
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("?")[0] || null;
    }
    const vParam = parsed.searchParams.get("v");
    if (vParam && vParam.length === 11) return vParam;
    const match = parsed.pathname.match(/\/(embed|v|shorts)\/([a-zA-Z0-9_-]{11})/);
    if (match && match[2]) return match[2];
  } catch {
    const rawMatch = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=))([a-zA-Z0-9_-]{11})/,
    );
    if (rawMatch && rawMatch[1]) return rawMatch[1];
  }
  return null;
}

export function isYouTubeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return lower.includes("youtube.com") || lower.includes("youtu.be");
}

export function buildAuthorizedPlayerUrl(params: {
  videoId?: string | null;
  videoKey?: string | null;
  title?: string | null;
  batchId?: string | null;
  subjectId?: string | null;
  topicId?: string | null;
  videoType?: string | null;
  bookingId?: string | null;
  slug?: string | null;
  url?: string | null;
}): string {
  if (params.url && isYouTubeUrl(params.url)) {
    const ytId = extractYouTubeId(params.url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;
  }

  const vid = params.videoId || params.videoKey || "";
  if (!vid) return "";

  // If YouTube ID itself was passed
  if (vid.length === 11 && !/^[a-fA-F0-9]{24}$/.test(vid)) {
    return `https://www.youtube.com/embed/${vid}`;
  }

  const query = new URLSearchParams();
  query.set("batch_id", params.batchId || "");
  query.set("subject_id", params.subjectId || "");
  if (params.topicId) {
    query.set("topic_id", params.topicId);
  }
  query.set("video_id", vid);
  query.set("typeId", "6a8dab3ba9fc2530d9243a34");
  if (params.title) {
    query.set("video_name", params.title);
  }
  query.set("video_img", "");
  query.set("video_type", "new");
  query.set("play_type", "Lecture");
  return `${VIDCLOUD_PLAYER_BASE}?${query.toString()}`;
}

// Deprecated alias for backwards compatibility
export const mapToPwMarcoPlayerUrl = buildAuthorizedPlayerUrl;
export const mapToStudyRatnaCdn = (urlOrKey?: string | null): string | null => {
  return isPlayableMediaUrl(urlOrKey) ? urlOrKey : null;
};

/**
 * Helper to determine if a string is a genuine playable media stream/file URL
 * and definitely NOT an HTML webpage, batch listing, or server script.
 */
export function isPlayableMediaUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return false;

  const lower = trimmed.toLowerCase();
  // Strictly reject webpages, batch routes, php scripts, or forbidden domains
  if (
    lower.includes("pwxmarco") ||
    lower.includes("play.php") ||
    lower.includes("/batch/") ||
    lower.includes("/batches") ||
    lower.includes("/study/") ||
    lower.includes(".html") ||
    lower.includes(".php") ||
    lower.includes("litespeed")
  ) {
    return false;
  }

  // Reject StudyRatna CDN website links that redirect to Telegram
  if (lower.includes("s2-cdn.studyratna.cc") || lower.includes("studyratna.cc")) {
    return false;
  }

  // Strictly reject placeholder / demo test streams
  if (lower.includes("mux.dev") || lower.includes("oceans.mp4")) {
    return false;
  }

  // Must have direct media stream or video container extension
  if (
    lower.includes(".m3u8") ||
    lower.includes(".mp4") ||
    lower.includes(".webm") ||
    lower.includes(".mpd")
  ) {
    return true;
  }

  return false;
}

export function resolvePlayableVideo(raw: {
  _id?: string | null;
  id?: string | null;
  url?: string | null;
  videoUrl?: string | null;
  urlType?: string | null;
  videoDetails?: {
    name?: string;
    duration?: string | number;
    image?: string;
    videoUrl?: string;
    hls_url?: string;
    embedCode?: string;
    video_id?: string;
    _id?: string;
  } | null;
  ytStreamUrl?: string | null;
  batchId?: string | null;
  subjectId?: string | null;
  topic?: string | null;
  slug?: string | null;
}): {
  videoUrl: string | null;
  videoType: "hls" | "dash" | "direct" | "youtube" | "embed";
  durationSeconds: number | null;
  playerEmbedUrl: string | null;
  studyRatnaUrl: string | null;
  pwMarcoUrl: string | null;
  pwMarcoPlayerUrl: string | null;
} {
  const durationSeconds = parseDurationToSeconds(raw.videoDetails?.duration);

  // Extract source identifiers
  const vidKey =
    (typeof raw.videoDetails?._id === "string" ? raw.videoDetails._id : "") ||
    (typeof raw.videoDetails?.video_id === "string" && raw.videoDetails.video_id.length > 15
      ? raw.videoDetails.video_id
      : "") ||
    (typeof raw._id === "string" ? raw._id : "") ||
    (typeof raw.id === "string" ? raw.id : "");

  // Candidate video streams from raw metadata
  const candidates: (string | null | undefined)[] = [
    raw.videoDetails?.videoUrl,
    raw.videoUrl,
    raw.videoDetails?.hls_url,
    raw.url,
    raw.ytStreamUrl,
  ];

  // 1. Check for YouTube stream or urlType === "youtube"
  if (raw.urlType === "youtube" || candidates.some((c) => isYouTubeUrl(c))) {
    const ytCand = candidates.find((c) => isYouTubeUrl(c)) || raw.url || raw.videoUrl;
    const ytId = extractYouTubeId(ytCand);
    if (ytId) {
      const ytEmbed = `https://www.youtube.com/embed/${ytId}`;
      return {
        videoUrl: ytEmbed,
        videoType: "youtube",
        durationSeconds,
        playerEmbedUrl: ytEmbed,
        studyRatnaUrl: null,
        pwMarcoUrl: null,
        pwMarcoPlayerUrl: ytEmbed,
      };
    }
  }

  let resolvedStreamUrl: string | null = null;
  let detectedType: "hls" | "dash" | "direct" | "youtube" | "embed" = "hls";

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") continue;
    const str = candidate.trim();
    if (!str || isYouTubeUrl(str)) continue;

    // Check MPEG-DASH
    if (str.includes(".mpd")) {
      resolvedStreamUrl = str;
      detectedType = "dash";
      break;
    }

    // Check HLS (.m3u8)
    if (str.includes(".m3u8")) {
      resolvedStreamUrl = str;
      detectedType = "hls";
      break;
    }

    // Direct MP4 / WebM
    if (str.includes(".mp4") || str.includes(".webm")) {
      resolvedStreamUrl = str;
      detectedType = "direct";
      break;
    }

    // PenPencil / CloudFront media
    if (str.includes("cloudfront.net") || raw.urlType === "penpencilvdo") {
      if (isPlayableMediaUrl(str)) {
        resolvedStreamUrl = str;
        detectedType = str.includes(".mpd") ? "dash" : "hls";
        break;
      }
    }
  }

  // Build authorized web player embed URL from source
  const playerEmbedUrl = vidKey
    ? buildAuthorizedPlayerUrl({
        videoId: vidKey,
        videoKey:
          typeof raw.videoDetails?.video_id === "string" ? raw.videoDetails.video_id : vidKey,
        title: raw.topic || raw.videoDetails?.name,
        batchId: raw.batchId,
        subjectId: raw.subjectId,
        slug: raw.slug,
        url: raw.url || raw.videoUrl,
      })
    : null;

  const finalVideoUrl = isPlayableMediaUrl(resolvedStreamUrl) ? resolvedStreamUrl : null;

  if (!finalVideoUrl && playerEmbedUrl) {
    detectedType = "embed";
  }

  return {
    videoUrl: finalVideoUrl,
    videoType: detectedType,
    durationSeconds,
    playerEmbedUrl,
    studyRatnaUrl: null,
    pwMarcoUrl: null,
    pwMarcoPlayerUrl: playerEmbedUrl,
  };
}

export type NormalizedChapter = {
  id: string;
  title: string;
  slug?: string | null;
  subject?: string | null;
  videoCount?: number | null;
  noteCount?: number | null;
  dppCount?: number | null;
  lessons: NormalizedLesson[];
  notes?: NormalizedNote[];
  dppNotes?: NormalizedNote[];
  dppVideos?: NormalizedLesson[];
  dppTests?: NormalizedDpp[];
};

export type NormalizedNote = {
  id: string;
  title: string;
  url: string;
  type?: "notes" | "dpp";
  date?: string | null;
};

export type SubjectRef = {
  id: string;
  slug?: string | null;
  name: string;
  lectureCount: number | null;
  teachers: string[];
  imageId?: string | null;
};

export type NormalizedCourse = {
  /** Composite id, unique across sources (used in routes). */
  id: string;
  /** Id exactly as returned by the source. */
  sourceCourseId: string;
  slug?: string | null;
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
  dpps?: NormalizedDpp[];
  validity?: string | null;
  price?: number | null;
  discountPrice?: number | null;
  isLive?: boolean | null;
};

/* -------------------------------- category -------------------------------- */

export function categoryFor(
  exam: string | null,
  className: string | null,
  title?: string | null,
): Category {
  const target = `${exam ?? ""} ${title ?? ""}`.toLowerCase();
  const cls = (className ?? "").trim();

  // Defence & Airforce
  if (
    target.includes("airforce") ||
    target.includes("agniveer") ||
    target.includes("nda") ||
    target.includes("cds") ||
    target.includes("afcat") ||
    target.includes("defence") ||
    target.includes("navy") ||
    target.includes("shaurya")
  ) {
    return "Airforce & Defence";
  }

  // UPSC & Civil Services
  if (
    target.includes("upsc") ||
    target.includes("ias") ||
    target.includes("civil services") ||
    target.includes("sankalp") ||
    target.includes("prahar") ||
    target.includes("state pcs") ||
    target.includes("bpsc") ||
    target.includes("uppsc")
  ) {
    return "UPSC";
  }

  // CA & Commerce
  if (
    target.includes("ca ") ||
    target.includes("ca-") ||
    target.includes("ca foundation") ||
    target.includes("ca inter") ||
    target.includes("ca final") ||
    target.includes("commerce") ||
    target.includes("cma") ||
    target.includes("cs executive") ||
    target.includes("aarambh")
  ) {
    return "CA & Commerce";
  }

  // SSC & Govt Exams
  if (
    target.includes("ssc") ||
    target.includes("cgl") ||
    target.includes("chsl") ||
    target.includes("banking") ||
    target.includes("ibps") ||
    target.includes("railway") ||
    target.includes("rrb") ||
    target.includes("ntpc") ||
    target.includes("daroga") ||
    target.includes("upsi") ||
    target.includes("police") ||
    target.includes("selection batch") ||
    target.includes("govt")
  ) {
    return "SSC & Govt";
  }

  // Engineering & Medical
  if (
    target.includes("jee") ||
    target.includes("iit") ||
    target.includes("arjuna") ||
    target.includes("lakshya jee") ||
    target.includes("prayas")
  ) {
    return "JEE";
  }

  if (
    target.includes("neet") ||
    target.includes("yakeen") ||
    target.includes("aiims") ||
    target.includes("lakshya neet")
  ) {
    return "NEET";
  }

  // School Classes & Boards
  if (cls === "12" || target.includes("class 12") || target.includes("12th")) return "Class 12";
  if (cls === "11" || target.includes("class 11") || target.includes("11th")) return "Class 11";
  if (
    cls === "10" ||
    target.includes("class 10") ||
    target.includes("10th") ||
    target.includes("udaan")
  )
    return "Class 10";
  if (
    cls === "9" ||
    target.includes("class 9") ||
    target.includes("9th") ||
    target.includes("neev")
  )
    return "Class 9";

  // Foundation & Olympiads
  if (target.includes("foundation") || target.includes("olympiad") || target.includes("ntse")) {
    return "Foundation";
  }

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

const PREFIX: Record<CourseSource, string> = {
  source1: "s1",
  vidyaverse: "vv",
};

export function compositeId(source: CourseSource, sourceCourseId: string): string {
  return `${PREFIX[source]}-${encodeURIComponent(sourceCourseId)}`;
}

export function parseCompositeId(
  id: string,
): { source: CourseSource; sourceCourseId: string } | null {
  if (!id || typeof id !== "string") return null;
  const s1Match = /^s1-(.+)$/.exec(id);
  if (s1Match) {
    try {
      return { source: "source1", sourceCourseId: decodeURIComponent(s1Match[1]!) };
    } catch {
      return { source: "source1", sourceCourseId: s1Match[1]! };
    }
  }
  const vvMatch = /^(?:vv|sw)-(.+)$/.exec(id);
  if (vvMatch) {
    try {
      return { source: "vidyaverse", sourceCourseId: decodeURIComponent(vvMatch[1]!) };
    } catch {
      return { source: "vidyaverse", sourceCourseId: vvMatch[1]! };
    }
  }
  return null;
}

/**
 * Extracts a normalized batchId from any format:
 * - https://vidya-verse.ai.studio/courses/6ab25570b2d758e23476cd66
 * - https://pw.gemtara.in/study/batches/668e594d6e9c0b117b9b1d9c
 * - /study/batches/668e594d6e9c0b117b9b1d9c
 * - vv-6ab25570b2d758e23476cd66
 * - s1-668e594d6e9c0b117b9b1d9c
 * - 668e594d6e9c0b117b9b1d9c
 */
export function extractBatchId(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";
  let clean = input
    .trim()
    .replace(/^[<"']+|[>"']+$/g, "")
    .trim();

  if (clean.includes("/study/batches/")) {
    const after = clean.split("/study/batches/")[1]?.split(/[?#&]/)[0];
    if (after) clean = after;
  } else if (clean.includes("/batches/")) {
    const after = clean.split("/batches/")[1]?.split(/[?#&]/)[0];
    if (after) clean = after;
  } else if (clean.includes("/courses/")) {
    const after = clean.split("/courses/")[1]?.split(/[?#&]/)[0];
    if (after) clean = after;
  } else if (clean.includes("/course/")) {
    const after = clean.split("/course/")[1]?.split(/[?#&]/)[0];
    if (after) clean = after;
  } else if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      const url = new URL(clean);
      const segments = url.pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1];
      if (last) clean = last;
    } catch {
      // ignore
    }
  }

  const parsed = parseCompositeId(clean);
  if (parsed) return parsed.sourceCourseId;
  return clean.replace(/^(?:s1|vv|sw)-/, "").trim();
}

/* --------------------------------- search --------------------------------- */

export function matchesQuery(course: NormalizedCourse, query: string): boolean {
  if (!course) return false;
  const term = query.trim().toLowerCase();
  if (!term) return true;
  const subjects = Array.isArray(course.subjects) ? course.subjects : [];
  const teachers = Array.isArray(course.teachers) ? course.teachers : [];
  const haystack = [
    course.title ?? "",
    course.description ?? "",
    course.category ?? "",
    course.className ?? "",
    course.exam ?? "",
    ...subjects,
    ...teachers,
  ]
    .join(" ")
    .toLowerCase();
  return term.split(/\s+/).every((word) => haystack.includes(word));
}
