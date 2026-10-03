import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type AdminSettings = {
  primarySourceUrl: string;
  secondarySourceUrl: string;
  batchListingUrl: string;
  additionalSourceUrl?: string;
  videoCdnSourceUrl?: string;
  whatsappChannelUrl: string;
  sourceListFn: string;
  allowGuestDownloads: boolean;
};

export type AdminAnnouncement = {
  id: string;
  title: string;
  message: string;
  date: string;
  type: "urgent" | "announcement" | "update";
};

export type AdminCourse = {
  id: string;
  title: string;
  exam: string | null;
  category: "JEE" | "NEET" | "Class 9" | "Class 10" | "Class 11" | "Class 12" | "Other";
  className: string | null;
  description: string | null;
  thumbnail: string | null;
  enabled: boolean;
  source: string;
  sourceLabel: string;
  subjects: string[];
  subjectRefs: {
    id: string;
    name: string;
    lectureCount: number | null;
    teachers: string[];
  }[];
};

export type AdminBatch = {
  id: string;
  name: string;
  category: string;
  sourceLink: string;
  enabled: boolean;
  thumbnail?: string | null;
};

export type AdminLecture = {
  id: string;
  courseId: string;
  subjectId: string;
  chapterId: string;
  title: string;
  order: number;
  videoUrl: string;
  notesUrl?: string | null;
  durationSeconds?: number | null;
};

export type AdminNote = {
  id: string;
  courseId: string;
  subjectId?: string;
  chapterId: string;
  title: string;
  url: string;
};

export type AdminBook = {
  id: string;
  title: string;
  subject: string;
  category: string;
  author?: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: string;
  thumbnail?: string | null;
  description?: string;
  uploadedAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  target: string;
  enrolledCount: number;
  completedLectures: number;
  progressPercent: number;
  status: "active" | "disabled";
  joinedDate: string;
};

export type AdminConfig = {
  settings: AdminSettings;
  disabledCourseIds: string[];
  disabledBatchIds: string[];
  customCourses: AdminCourse[];
  customBatches: AdminBatch[];
  customLectures: AdminLecture[];
  customNotes: AdminNote[];
  customBooks: AdminBook[];
  announcements: AdminAnnouncement[];
  users: AdminUser[];
};

const DEFAULT_CONFIG: AdminConfig = {
  settings: {
    primarySourceUrl: "https://pw.gemtara.in/",
    secondarySourceUrl: "",
    batchListingUrl: "https://pw.gemtara.in/study/batches",
    videoCdnSourceUrl: "https://pw.gemtara.in/",
    whatsappChannelUrl: "https://whatsapp.com/channel/0029VbB3XKSK0IBqD72ndg2i",
    telegramChannelUrl: "https://t.me/mrlokygamer",
    sourceListFn: "auto",
    allowGuestDownloads: true,
  },
  disabledCourseIds: [],
  disabledBatchIds: [],
  customCourses: [],
  customBatches: [],
  customLectures: [],
  customNotes: [],
  customBooks: [],
  announcements: [
    {
      id: "ann-welcome",
      title: "Welcome to Dharam Bhai Study",
      message:
        "Access verified study batches, video lectures, notes, and AI doubt assistance for JEE & NEET.",
      date: new Date().toISOString(),
      type: "announcement",
    },
  ],
  users: [],
};

const CONFIG_PATH = path.join(process.cwd(), "src", "data", "admin-config.json");

export function readConfig(): AdminConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        settings: {
          ...DEFAULT_CONFIG.settings,
          ...(parsed.settings ?? {}),
        },
        disabledCourseIds: parsed.disabledCourseIds ?? [],
        disabledBatchIds: parsed.disabledBatchIds ?? [],
        customCourses: parsed.customCourses ?? [],
        customBatches: parsed.customBatches ?? [],
        customLectures: parsed.customLectures ?? [],
        customNotes: parsed.customNotes ?? [],
        customBooks: parsed.customBooks ?? [],
        announcements: parsed.announcements ?? DEFAULT_CONFIG.announcements,
        users: parsed.users ?? [],
      };
    }
  } catch (err) {
    console.error("Failed to read admin config:", err);
  }
  return DEFAULT_CONFIG;
}

export function writeConfig(data: AdminConfig): void {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write admin config:", err);
  }
}

// In-memory token store for admin session
const ACTIVE_ADMIN_TOKENS = new Set<string>();

export function createAdminToken(): string {
  const token = `dharam_adm_${Date.now()}_${crypto.randomBytes(16).toString("hex")}`;
  ACTIVE_ADMIN_TOKENS.add(token);
  return token;
}

export function isValidToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return ACTIVE_ADMIN_TOKENS.has(token);
}
