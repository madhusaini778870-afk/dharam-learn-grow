import type { StoredEnrollment, StoredProgress } from "@/services/authStore.server";
import {
  getUserEnrollmentsServer,
  enrollCourseServer,
  unenrollCourseServer,
  getUserProgressServer,
  saveProgressServer,
  markLectureCompletedServer,
} from "@/services/authService";

export type { StoredEnrollment, StoredProgress };
export type EnrolledCourse = StoredEnrollment;

export type BookmarkItem = {
  courseId: string;
  lessonId: string;
  title: string;
  courseTitle?: string;
  subjectId?: string;
  chapterId?: string;
  savedAt: string;
};

export type RecentLectureItem = {
  courseId: string;
  lessonId: string;
  title: string;
  courseTitle?: string;
  subjectId?: string;
  chapterId?: string;
  thumbnail?: string | null;
  timestampSeconds?: number;
  durationSeconds?: number;
  startedAt: string;
  isBookmarked?: boolean;
};

export type LocalLectureCompletion = {
  courseId: string;
  chapterId?: string;
  lessonId: string;
  completed: boolean;
  updatedAt: string;
};

export type ChapterProgressStats = {
  completedCount: number;
  totalCount: number;
  percentage: number;
  completedLessonIds: string[];
};

const COOKIE_NAME = "dhs_session_token";
const LOCAL_COMPLETION_STORAGE_KEY = "dharam_completed_lectures";
const LOCAL_CHAPTER_LESSONS_KEY = "dharam_chapter_lessons";
const LOCAL_RECENT_STORAGE_KEY = "dharam_recent_lectures";
const LOCAL_ENROLLMENTS_KEY = "dharam_local_enrollments";

function getLocalEnrollments(): StoredEnrollment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ENROLLMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalEnrollments(list: StoredEnrollment[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_ENROLLMENTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function getLocalCompletionMap(): Record<string, LocalLectureCompletion> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_COMPLETION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const map: Record<string, LocalLectureCompletion> = {};
      for (const item of parsed) {
        if (item?.courseId && item?.lessonId) {
          map[`${item.courseId}::${item.lessonId}`] = item;
        }
      }
      return map;
    }
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocalCompletionMap(map: Record<string, LocalLectureCompletion>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_COMPLETION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function getLocalChapterLessonsMap(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_CHAPTER_LESSONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalChapterLessonsMap(map: Record<string, string[]>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_CHAPTER_LESSONS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function getActiveToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const match = document.cookie.match(new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    if (match?.[2]) return decodeURIComponent(match[2]);
    return sessionStorage.getItem(COOKIE_NAME);
  } catch {
    return null;
  }
}

// In-memory cache per user session
let cachedEnrollments: StoredEnrollment[] = [];
let cachedProgress: StoredProgress[] = [];
let lastSyncToken: string | null = null;

export const studentStore = {
  getEnrollments(): StoredEnrollment[] {
    const local = getLocalEnrollments();
    const map = new Map<string, StoredEnrollment>();
    for (const item of local) {
      if (item.courseId) map.set(item.courseId, item);
    }
    const token = getActiveToken();
    if (token) {
      for (const item of cachedEnrollments) {
        if (item.courseId) map.set(item.courseId, item);
      }
    }
    return Array.from(map.values());
  },

  isEnrolled(courseId: string): boolean {
    const cleanId = (courseId || "").trim();
    if (!cleanId) return false;
    const token = getActiveToken();
    if (token && cachedEnrollments.some((item) => item.courseId === cleanId)) {
      return true;
    }
    const local = getLocalEnrollments();
    return local.some((item) => item.courseId === cleanId);
  },

  async syncUserData(): Promise<void> {
    const token = getActiveToken();
    if (!token) {
      cachedEnrollments = [];
      cachedProgress = [];
      lastSyncToken = null;
      return;
    }

    try {
      const [enrRes, progRes] = await Promise.all([
        getUserEnrollmentsServer({ data: { token } }),
        getUserProgressServer({ data: { token } }),
      ]);

      if (enrRes.success && enrRes.enrollments) {
        cachedEnrollments = enrRes.enrollments;
      }
      if (progRes.success && progRes.progress) {
        cachedProgress = progRes.progress;
        // Merge into local storage so local state always reflects latest data
        try {
          const map = getLocalCompletionMap();
          for (const p of progRes.progress) {
            if (p.completed) {
              const key = `${p.courseId}::${p.lessonId}`;
              map[key] = {
                courseId: p.courseId,
                chapterId: p.chapterId || map[key]?.chapterId,
                lessonId: p.lessonId,
                completed: true,
                updatedAt: p.updatedAt,
              };
            }
          }
          saveLocalCompletionMap(map);
        } catch {
          // ignore
        }
      }
      lastSyncToken = token;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dharam_enrollments_updated"));
        window.dispatchEvent(new CustomEvent("dharam_progress_updated"));
      }
    } catch {
      // ignore sync errors
    }
  },

  async enrollCourse(course: {
    id: string;
    title: string;
    category?: string | null;
    exam?: string | null;
    thumbnail?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    // 1. Always save to local storage immediately
    const local = getLocalEnrollments();
    const existing = local.find((e) => e.courseId === course.id);
    if (!existing) {
      local.unshift({
        courseId: course.id,
        courseTitle: course.title,
        exam: course.exam ?? course.category ?? null,
        thumbnail: course.thumbnail ?? null,
        enrolledAt: new Date().toISOString(),
      });
      saveLocalEnrollments(local);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dharam_enrollments_updated"));
    }

    const token = getActiveToken();
    if (!token) {
      // Guest or local mode enrollment succeeds immediately!
      return { success: true };
    }

    try {
      const res = await enrollCourseServer({
        data: {
          token,
          course: {
            id: course.id,
            title: course.title,
            exam: course.exam ?? course.category ?? null,
            thumbnail: course.thumbnail ?? null,
          },
        },
      });

      if (res.success && res.enrollments) {
        cachedEnrollments = res.enrollments;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("dharam_enrollments_updated"));
        }
        return { success: true };
      }
      return { success: true };
    } catch {
      return { success: true };
    }
  },

  async unenrollCourse(courseId: string): Promise<void> {
    const local = getLocalEnrollments().filter((e) => e.courseId !== courseId);
    saveLocalEnrollments(local);

    const token = getActiveToken();
    if (token) {
      try {
        const res = await unenrollCourseServer({
          data: { token, courseId },
        });
        if (res.success && res.enrollments) {
          cachedEnrollments = res.enrollments;
        }
      } catch {
        // ignore errors
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dharam_enrollments_updated"));
    }
  },

  getProgress(courseId: string): StoredProgress[] {
    const localMap = getLocalCompletionMap();
    const localList: StoredProgress[] = Object.values(localMap)
      .filter((item) => item.courseId === courseId && item.completed)
      .map((item) => ({
        courseId: item.courseId,
        lessonId: item.lessonId,
        chapterId: item.chapterId,
        secondsWatched: 0,
        durationSeconds: 0,
        completed: true,
        updatedAt: item.updatedAt,
      }));

    const token = getActiveToken();
    if (!token) return localList;

    // Merge in-memory server progress with local records
    const set = new Set(
      cachedProgress.filter((p) => p.courseId === courseId).map((p) => p.lessonId),
    );
    const merged = [...cachedProgress.filter((p) => p.courseId === courseId)];
    for (const loc of localList) {
      if (!set.has(loc.lessonId)) {
        merged.push(loc);
      }
    }
    return merged;
  },

  getLessonProgress(courseId: string, lessonId: string): StoredProgress | undefined {
    const localMap = getLocalCompletionMap();
    const localItem = localMap[`${courseId}::${lessonId}`];
    const inMem = cachedProgress.find((p) => p.courseId === courseId && p.lessonId === lessonId);

    if (inMem) {
      return {
        ...inMem,
        completed: inMem.completed || Boolean(localItem?.completed),
      };
    }
    if (localItem) {
      return {
        courseId,
        lessonId,
        chapterId: localItem.chapterId,
        secondsWatched: 0,
        durationSeconds: 0,
        completed: localItem.completed,
        updatedAt: localItem.updatedAt,
      };
    }
    return undefined;
  },

  isLessonCompleted(courseId: string, lessonId: string): boolean {
    const localMap = getLocalCompletionMap();
    const key = `${courseId}::${lessonId}`;
    if (localMap[key]?.completed) return true;

    const inMem = cachedProgress.find((p) => p.courseId === courseId && p.lessonId === lessonId);
    if (inMem?.completed) return true;

    if (typeof window !== "undefined") {
      try {
        const rawAwarded = localStorage.getItem("dharam_awarded_lessons");
        if (rawAwarded && rawAwarded.includes(key)) {
          const list: string[] = JSON.parse(rawAwarded);
          if (list.includes(key)) return true;
        }
      } catch {
        // ignore
      }
    }
    return false;
  },

  registerChapterLessons(courseId: string, chapterId: string, lessonIds: string[]): void {
    if (!courseId || !chapterId || !Array.isArray(lessonIds) || lessonIds.length === 0) return;
    try {
      const map = getLocalChapterLessonsMap();
      const key = `${courseId}::${chapterId}`;
      const existing = map[key] || [];
      const merged = Array.from(new Set([...existing, ...lessonIds]));
      map[key] = merged;
      saveLocalChapterLessonsMap(map);
    } catch {
      // ignore
    }
  },

  getChapterLessonIds(courseId: string, chapterId: string): string[] {
    const map = getLocalChapterLessonsMap();
    return map[`${courseId}::${chapterId}`] || [];
  },

  getChapterProgress(
    courseId: string,
    chapterId: string,
    totalLecturesHint?: number | null,
    knownLessonIds?: string[],
  ): ChapterProgressStats {
    const registeredLessons = this.getChapterLessonIds(courseId, chapterId);
    const candidateLessonIds = new Set<string>([...(knownLessonIds || []), ...registeredLessons]);

    const localMap = getLocalCompletionMap();
    const completedSet = new Set<string>();

    // 1. Check local completion map tagged with this chapterId or matching known lesson IDs
    for (const item of Object.values(localMap)) {
      if (item.courseId !== courseId || !item.completed) continue;
      if (item.chapterId && item.chapterId === chapterId) {
        completedSet.add(item.lessonId);
      } else if (candidateLessonIds.has(item.lessonId)) {
        completedSet.add(item.lessonId);
      }
    }

    // 2. Check cached in-memory progress
    for (const p of cachedProgress) {
      if (p.courseId !== courseId || !p.completed) continue;
      if (p.chapterId && p.chapterId === chapterId) {
        completedSet.add(p.lessonId);
      } else if (candidateLessonIds.has(p.lessonId)) {
        completedSet.add(p.lessonId);
      }
    }

    // 3. Check gamification awarded lessons
    if (candidateLessonIds.size > 0 && typeof window !== "undefined") {
      try {
        const rawAwarded = localStorage.getItem("dharam_awarded_lessons");
        if (rawAwarded) {
          const list: string[] = JSON.parse(rawAwarded);
          for (const entry of list) {
            const [cId, lId] = entry.split("::");
            if (cId === courseId && candidateLessonIds.has(lId)) {
              completedSet.add(lId);
            }
          }
        }
      } catch {
        // ignore
      }
    }

    const completedCount = completedSet.size;
    const reportedTotal =
      totalLecturesHint !== undefined && totalLecturesHint !== null && totalLecturesHint > 0
        ? totalLecturesHint
        : candidateLessonIds.size;
    const totalCount = Math.max(completedCount, reportedTotal);
    const percentage =
      totalCount > 0
        ? Math.min(100, Math.round((completedCount / totalCount) * 100))
        : completedCount > 0
          ? 100
          : 0;

    return {
      completedCount,
      totalCount,
      percentage,
      completedLessonIds: Array.from(completedSet),
    };
  },

  async markCompleted(
    courseId: string,
    lessonId: string,
    completed: boolean,
    chapterId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    // 1. Immediately persist to local storage
    const localMap = getLocalCompletionMap();
    const key = `${courseId}::${lessonId}`;
    if (completed) {
      localMap[key] = {
        courseId,
        chapterId: chapterId || localMap[key]?.chapterId,
        lessonId,
        completed: true,
        updatedAt: new Date().toISOString(),
      };
    } else {
      delete localMap[key];
    }
    saveLocalCompletionMap(localMap);

    // 2. Optimistic in-memory update
    const idx = cachedProgress.findIndex((p) => p.courseId === courseId && p.lessonId === lessonId);
    if (idx >= 0) {
      cachedProgress[idx].completed = completed;
      if (chapterId) cachedProgress[idx].chapterId = chapterId;
      cachedProgress[idx].updatedAt = new Date().toISOString();
    } else {
      cachedProgress.push({
        courseId,
        chapterId,
        lessonId,
        secondsWatched: 0,
        durationSeconds: 0,
        completed,
        updatedAt: new Date().toISOString(),
      });
    }

    // Always dispatch local event immediately so all UI and circular progress rings update in real-time
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("dharam_progress_updated", {
          detail: { courseId, lessonId, chapterId, completed },
        }),
      );
    }

    // If logged in, sync with server
    const token = getActiveToken();
    if (!token) {
      return { success: true };
    }

    try {
      await markLectureCompletedServer({
        data: { token, courseId, lessonId, completed },
      });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async saveWatchPosition(
    courseId: string,
    lessonId: string,
    seconds: number,
    duration: number,
    context?: {
      title?: string;
      courseTitle?: string;
      subjectId?: string;
      chapterId?: string;
      thumbnail?: string | null;
    },
  ): Promise<void> {
    // Record to recent lectures immediately
    if (context?.title) {
      this.recordRecentLecture({
        courseId,
        lessonId,
        title: context.title,
        courseTitle: context.courseTitle,
        subjectId: context.subjectId,
        chapterId: context.chapterId,
        thumbnail: context.thumbnail ?? null,
        timestampSeconds: seconds,
        durationSeconds: duration,
      });
    }

    const completed = duration > 0 && seconds >= duration * 0.9;
    if (completed) {
      const localMap = getLocalCompletionMap();
      const key = `${courseId}::${lessonId}`;
      localMap[key] = {
        courseId,
        chapterId: context?.chapterId || localMap[key]?.chapterId,
        lessonId,
        completed: true,
        updatedAt: new Date().toISOString(),
      };
      saveLocalCompletionMap(localMap);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("dharam_progress_updated", {
            detail: { courseId, lessonId, chapterId: context?.chapterId, completed: true },
          }),
        );
      }
    }

    const token = getActiveToken();
    if (!token) return; // Do not save unauthenticated watch positions to server

    const idx = cachedProgress.findIndex((p) => p.courseId === courseId && p.lessonId === lessonId);

    if (idx >= 0) {
      cachedProgress[idx].secondsWatched = Math.floor(seconds);
      if (duration > 0) cachedProgress[idx].durationSeconds = Math.floor(duration);
      if (completed) cachedProgress[idx].completed = true;
      if (context?.chapterId) cachedProgress[idx].chapterId = context.chapterId;
      cachedProgress[idx].updatedAt = new Date().toISOString();
    } else {
      cachedProgress.push({
        courseId,
        chapterId: context?.chapterId,
        lessonId,
        secondsWatched: Math.floor(seconds),
        durationSeconds: Math.floor(duration),
        completed,
        updatedAt: new Date().toISOString(),
      });
    }

    // Update enrollment lastWatched
    const enr = cachedEnrollments.find((item) => item.courseId === courseId);
    if (enr) {
      enr.lastWatchedLessonId = lessonId;
      enr.lastWatchedSeconds = Math.floor(seconds);
      if (context?.title) enr.lastWatchedLessonTitle = context.title;
      if (context?.subjectId) enr.lastWatchedSubjectId = context.subjectId;
      if (context?.chapterId) enr.lastWatchedChapterId = context.chapterId;
    }

    try {
      await saveProgressServer({
        data: {
          token,
          courseId,
          lessonId,
          secondsWatched: seconds,
          durationSeconds: duration,
          title: context?.title,
          subjectId: context?.subjectId,
          chapterId: context?.chapterId,
        },
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dharam_progress_updated"));
      }
    } catch {
      // ignore network errors for throttled progress ticks
    }
  },

  getLastWatched(courseId: string): StoredEnrollment | undefined {
    const token = getActiveToken();
    if (!token) return undefined;
    return cachedEnrollments.find((item) => item.courseId === courseId);
  },

  getStats(): {
    enrolledCount: number;
    completedLessonsCount: number;
    totalWatchedSeconds: number;
  } {
    const localMap = getLocalCompletionMap();
    const localCompletedCount = Object.values(localMap).filter((item) => item.completed).length;
    const completedInMem = cachedProgress.filter((p) => p.completed).length;
    const seconds = cachedProgress.reduce((acc, p) => acc + (p.secondsWatched || 0), 0);

    return {
      enrolledCount: cachedEnrollments.length,
      completedLessonsCount: Math.max(localCompletedCount, completedInMem),
      totalWatchedSeconds: seconds,
    };
  },

  getBookmarks(): Array<{
    courseId: string;
    lessonId: string;
    title: string;
    courseTitle?: string;
    subjectId?: string;
    chapterId?: string;
    savedAt: string;
  }> {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("dharam_saved_lectures");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  isBookmarked(lessonId: string): boolean {
    if (typeof window === "undefined") return false;
    const bookmarks = this.getBookmarks();
    return bookmarks.some((b) => b.lessonId === lessonId);
  },

  toggleBookmark(item: {
    courseId: string;
    lessonId: string;
    title: string;
    courseTitle?: string;
    subjectId?: string;
    chapterId?: string;
  }): boolean {
    if (typeof window === "undefined") return false;
    try {
      let bookmarks = this.getBookmarks();
      const exists = bookmarks.some((b) => b.lessonId === item.lessonId);
      if (exists) {
        bookmarks = bookmarks.filter((b) => b.lessonId !== item.lessonId);
      } else {
        bookmarks.unshift({
          ...item,
          savedAt: new Date().toISOString(),
        });
      }
      localStorage.setItem("dharam_saved_lectures", JSON.stringify(bookmarks));
      window.dispatchEvent(new CustomEvent("dharam_bookmarks_updated"));
      window.dispatchEvent(new CustomEvent("dharam_recent_updated"));
      return !exists;
    } catch {
      return false;
    }
  },

  recordRecentLecture(item: {
    courseId: string;
    lessonId: string;
    title: string;
    courseTitle?: string;
    subjectId?: string;
    chapterId?: string;
    thumbnail?: string | null;
    timestampSeconds?: number;
    durationSeconds?: number;
  }): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(LOCAL_RECENT_STORAGE_KEY);
      let list: RecentLectureItem[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];

      // Filter out existing to place newly watched at top
      list = list.filter((x) => x.lessonId !== item.lessonId);

      const isBookmarked = this.isBookmarked(item.lessonId);

      list.unshift({
        courseId: item.courseId,
        lessonId: item.lessonId,
        title: item.title,
        courseTitle: item.courseTitle,
        subjectId: item.subjectId,
        chapterId: item.chapterId,
        thumbnail: item.thumbnail ?? null,
        timestampSeconds: item.timestampSeconds,
        durationSeconds: item.durationSeconds,
        startedAt: new Date().toISOString(),
        isBookmarked,
      });

      // Keep up to 20 recent records
      list = list.slice(0, 20);
      localStorage.setItem(LOCAL_RECENT_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("dharam_recent_updated"));
    } catch {
      // ignore
    }
  },

  getRecentLectures(limit = 3): RecentLectureItem[] {
    if (typeof window === "undefined") return [];
    try {
      const rawRecent = localStorage.getItem(LOCAL_RECENT_STORAGE_KEY);
      const recentList: RecentLectureItem[] = rawRecent ? JSON.parse(rawRecent) : [];

      const bookmarks = this.getBookmarks();
      const bookmarkMap = new Map(bookmarks.map((b) => [b.lessonId, b]));

      // Merge unique lectures by lessonId
      const map = new Map<string, RecentLectureItem>();

      // 1. Add watched/started recent lectures
      for (const item of Array.isArray(recentList) ? recentList : []) {
        if (!item.lessonId) continue;
        map.set(item.lessonId, {
          ...item,
          isBookmarked: bookmarkMap.has(item.lessonId),
        });
      }

      // 2. Merge bookmarked lectures so user has quick access to them as well
      for (const b of bookmarks) {
        if (!map.has(b.lessonId)) {
          map.set(b.lessonId, {
            courseId: b.courseId,
            lessonId: b.lessonId,
            title: b.title,
            courseTitle: b.courseTitle,
            subjectId: b.subjectId,
            chapterId: b.chapterId,
            startedAt: b.savedAt || new Date().toISOString(),
            isBookmarked: true,
          });
        }
      }

      // Sort by latest startedAt or savedAt
      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      );

      return combined.slice(0, limit);
    } catch {
      return [];
    }
  },

  getLectureRating(lessonId: string): number | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("dharam_lecture_ratings");
      const ratings = raw ? JSON.parse(raw) : {};
      return typeof ratings[lessonId] === "number" ? ratings[lessonId] : null;
    } catch {
      return null;
    }
  },

  setLectureRating(lessonId: string, rating: number): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("dharam_lecture_ratings");
      const ratings = raw ? JSON.parse(raw) : {};
      ratings[lessonId] = rating;
      localStorage.setItem("dharam_lecture_ratings", JSON.stringify(ratings));
      window.dispatchEvent(
        new CustomEvent("dharam_ratings_updated", { detail: { lessonId, rating } }),
      );
    } catch {
      // ignore
    }
  },
};

// Listen to auth changes to immediately sync or clear
if (typeof window !== "undefined") {
  window.addEventListener("dhs_auth_changed", () => {
    studentStore.syncUserData();
  });
  // Initial sync
  setTimeout(() => {
    studentStore.syncUserData();
  }, 100);
}
