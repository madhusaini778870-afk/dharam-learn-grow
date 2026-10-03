import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type VideoChatMessage = {
  id: string;
  courseId: string;
  lessonId: string;
  userId: string;
  userName: string;
  userRole: "student" | "admin" | "instructor";
  userAvatar?: string | null;
  text: string;
  isQuestion: boolean;
  timestampSeconds?: number | null;
  createdAt: string;
  reactions: Record<string, string[]>; // e.g. { "👍": ["userId1"], "💡": ["userId2"] }
};

type VideoChatDatabase = {
  // Key format: `${courseId}:::${lessonId}`
  threads: Record<string, VideoChatMessage[]>;
};

const DB_PATH = path.join(process.cwd(), "src", "data", "video-chats.json");

function getThreadKey(courseId: string, lessonId: string): string {
  return `${courseId.trim()}:::${lessonId.trim()}`;
}

function readDb(): VideoChatDatabase {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        threads: parsed.threads ?? {},
      };
    }
  } catch (err) {
    console.error("Failed to read video chat database:", err);
  }
  return { threads: {} };
}

function writeDb(db: VideoChatDatabase): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tempPath = `${DB_PATH}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), "utf-8");
    fs.renameSync(tempPath, DB_PATH);
  } catch (err) {
    console.error("Failed to write video chat database:", err);
  }
}

export function getLessonChat(courseId: string, lessonId: string): VideoChatMessage[] {
  const db = readDb();
  const key = getThreadKey(courseId, lessonId);
  const messages = db.threads[key] ?? [];

  // Return sorted chronologically (oldest first, newest at the bottom)
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function addLessonChatMessage(params: {
  courseId: string;
  lessonId: string;
  userId: string;
  userName: string;
  userRole: "student" | "admin" | "instructor";
  userAvatar?: string | null;
  text: string;
  isQuestion: boolean;
  timestampSeconds?: number | null;
}): VideoChatMessage {
  const db = readDb();
  const key = getThreadKey(params.courseId, params.lessonId);
  if (!db.threads[key]) {
    db.threads[key] = generateInitialMessages(params.courseId, params.lessonId);
  }

  const newMessage: VideoChatMessage = {
    id: `msg_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    courseId: params.courseId,
    lessonId: params.lessonId,
    userId: params.userId || `user_${Date.now()}`,
    userName: params.userName.trim() || "Student",
    userRole: params.userRole || "student",
    userAvatar: params.userAvatar ?? null,
    text: params.text.trim(),
    isQuestion: Boolean(params.isQuestion),
    timestampSeconds:
      typeof params.timestampSeconds === "number" && params.timestampSeconds >= 0
        ? Math.floor(params.timestampSeconds)
        : null,
    createdAt: new Date().toISOString(),
    reactions: {},
  };

  db.threads[key].push(newMessage);
  writeDb(db);
  return newMessage;
}

export function toggleMessageReaction(params: {
  courseId: string;
  lessonId: string;
  messageId: string;
  userId: string;
  reaction: string;
}): { success: boolean; reactions: Record<string, string[]> } {
  const db = readDb();
  const key = getThreadKey(params.courseId, params.lessonId);
  const thread = db.threads[key];
  if (!thread) return { success: false, reactions: {} };

  const message = thread.find((m) => m.id === params.messageId);
  if (!message) return { success: false, reactions: {} };

  if (!message.reactions) {
    message.reactions = {};
  }

  const currentList = message.reactions[params.reaction] ?? [];
  const hasUser = currentList.includes(params.userId);

  if (hasUser) {
    message.reactions[params.reaction] = currentList.filter((u) => u !== params.userId);
    if (message.reactions[params.reaction].length === 0) {
      delete message.reactions[params.reaction];
    }
  } else {
    message.reactions[params.reaction] = [...currentList, params.userId];
  }

  writeDb(db);
  return { success: true, reactions: message.reactions };
}

export function deleteLessonChatMessage(params: {
  courseId: string;
  lessonId: string;
  messageId: string;
  userId: string;
  isAdmin: boolean;
}): boolean {
  const db = readDb();
  const key = getThreadKey(params.courseId, params.lessonId);
  const thread = db.threads[key];
  if (!thread) return false;

  const targetIndex = thread.findIndex((m) => m.id === params.messageId);
  if (targetIndex === -1) return false;

  const target = thread[targetIndex];
  // Allow if owner or admin
  if (target.userId !== params.userId && !params.isAdmin) {
    return false;
  }

  thread.splice(targetIndex, 1);
  writeDb(db);
  return true;
}
