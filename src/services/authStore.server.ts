import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type UserEnrollment = {
  id: string;
  courseId: string;
  courseTitle: string;
  exam: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  lastWatchedLessonId?: string | null;
  lastWatchedLessonTitle?: string | null;
  lastWatchedSubjectId?: string | null;
  lastWatchedChapterId?: string | null;
  lastWatchedSeconds?: number;
};

export type UserProgress = {
  courseId: string;
  lessonId: string;
  secondsWatched: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: string;
};

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // salt:hash (pbkdf2)
  role: "student" | "admin";
  targetExam?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
  resetToken?: string | null;
  resetTokenExpires?: number | null;
  enrollments: UserEnrollment[];
  progress: UserProgress[];
};

export type StoredSession = {
  token: string;
  userId: string;
  role: "student" | "admin";
  createdAt: number;
  expiresAt: number;
};

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  targetExam?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  status: "active" | "disabled";
  createdAt: string;
  user_metadata: {
    full_name: string;
    name: string;
    avatar_url?: string;
  };
};

const USERS_PATH = path.join(process.cwd(), "src", "data", "users.json");
const SESSIONS_PATH = path.join(process.cwd(), "src", "data", "sessions.json");
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// -------------------------------------------------------------
// Database IO
// -------------------------------------------------------------

export function readUsers(): StoredUser[] {
  let list: StoredUser[] = [];
  try {
    if (fs.existsSync(USERS_PATH)) {
      const raw = fs.readFileSync(USERS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }
  } catch (err) {
    console.error("Failed to read users database:", err);
  }

  // Ensure default admin account is present with admin privileges
  const adminEmail = "madhusaini778870@gmail.com";
  const existingAdmin = list.find((u) => u.email.toLowerCase() === adminEmail);
  const adminHash =
    "ccce69666b0ac1d7893bb9b36eb282e9:0216de5feacde4c6455fb404d6f02da6bf914037fbe3545e7e1bb3d66d49586c95bf4085c630ec5e5fbf0bb90771015011106475656646b7973fe6c3c1a56b0e";

  if (!existingAdmin) {
    list.unshift({
      id: "usr_admin_madhu",
      name: "LAKSHYA (Admin)",
      email: adminEmail,
      passwordHash: adminHash,
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enrollments: [],
      progress: [],
    });
    writeUsers(list);
  } else if (existingAdmin.role !== "admin" || !existingAdmin.passwordHash) {
    existingAdmin.role = "admin";
    existingAdmin.passwordHash = adminHash;
    writeUsers(list);
  }

  return list;
}

export function writeUsers(users: StoredUser[]): void {
  try {
    const dir = path.dirname(USERS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write users database:", err);
  }
}

export function readSessions(): StoredSession[] {
  try {
    if (fs.existsSync(SESSIONS_PATH)) {
      const raw = fs.readFileSync(SESSIONS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Failed to read sessions database:", err);
  }
  return [];
}

export function writeSessions(sessions: StoredSession[]): void {
  try {
    const dir = path.dirname(SESSIONS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SESSIONS_PATH, JSON.stringify(sessions, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write sessions database:", err);
  }
}

// -------------------------------------------------------------
// Cryptographic Password Hashing & Timing-Safe Verification
// -------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(originalHash, "hex"),
    );
  } catch {
    return false;
  }
}

export function toSafeUser(user: StoredUser): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    targetExam: user.targetExam,
    phoneNumber: user.phoneNumber,
    avatarUrl: user.avatarUrl,
    status: user.status,
    createdAt: user.createdAt,
    user_metadata: {
      full_name: user.name,
      name: user.name,
      avatar_url: user.avatarUrl,
    },
  };
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters." };
  }
  return { valid: true };
}

// -------------------------------------------------------------
// Core Authentication Operations
// -------------------------------------------------------------

export function createSession(userId: string, role: "student" | "admin"): StoredSession {
  const token = `dhs_${crypto.randomBytes(32).toString("hex")}`;
  const session: StoredSession = {
    token,
    userId,
    role,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  const sessions = readSessions();
  const now = Date.now();
  const activeSessions = sessions.filter((s) => s.expiresAt > now);
  activeSessions.push(session);
  writeSessions(activeSessions);
  return session;
}

export function getSessionUser(
  token: string | null | undefined,
): { session: StoredSession; user: StoredUser } | null {
  if (!token) return null;
  const sessions = readSessions();
  const session = sessions.find((s) => s.token === token && s.expiresAt > Date.now());
  if (!session) return null;

  const users = readUsers();
  const user = users.find((u) => u.id === session.userId && u.status !== "disabled");
  if (!user) return null;

  return { session, user };
}

export function destroySession(token: string | null | undefined): void {
  if (!token) return;
  const sessions = readSessions();
  const filtered = sessions.filter((s) => s.token !== token);
  writeSessions(filtered);
}

export function registerUser(params: {
  name: string;
  email: string;
  password: string;
  role?: "student" | "admin";
}): { success: boolean; user?: StoredUser; error?: string } {
  const cleanName = params.name.trim();
  const cleanEmail = params.email.trim().toLowerCase();

  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: "Please enter your full name." };
  }

  if (!validateEmail(cleanEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const passCheck = validatePassword(params.password);
  if (!passCheck.valid) {
    return { success: false, error: passCheck.error };
  }

  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return {
      success: false,
      error: "An account with this email already exists. Please sign in instead.",
    };
  }

  const now = new Date().toISOString();
  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    name: cleanName,
    email: cleanEmail,
    passwordHash: hashPassword(params.password),
    role: params.role ?? "student",
    status: "active",
    createdAt: now,
    updatedAt: now,
    enrollments: [],
    progress: [],
  };

  users.push(newUser);
  writeUsers(users);

  return { success: true, user: newUser };
}

export function loginUser(
  emailInput: string,
  passwordInput: string,
  requiredRole?: "admin" | "student",
): { success: boolean; user?: StoredUser; error?: string } {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!email || !password) {
    return { success: false, error: "Please enter both email and password." };
  }

  const users = readUsers();
  const user = users.find((u) => u.email.toLowerCase() === email);

  if (!user) {
    return { success: false, error: "Invalid email or password." };
  }

  if (user.status === "disabled") {
    return { success: false, error: "This account has been deactivated. Please contact support." };
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return { success: false, error: "Invalid email or password." };
  }

  if (requiredRole && user.role !== requiredRole) {
    if (requiredRole === "admin") {
      return { success: false, error: "Access denied. Administrator privileges required." };
    }
  }

  return { success: true, user };
}

// -------------------------------------------------------------
// Forgot Password Flow (Timing/Enumeration Safe)
// -------------------------------------------------------------

export function requestPasswordReset(rawEmail: string): { success: boolean; resetToken?: string } {
  const email = rawEmail.trim().toLowerCase();
  const users = readUsers();
  const user = users.find((u) => u.email.toLowerCase() === email);

  if (!user) {
    // In all cases, return success to prevent email harvesting/enumeration
    return { success: true };
  }

  const resetToken = crypto.randomBytes(24).toString("hex");
  user.resetToken = resetToken;
  user.resetTokenExpires = Date.now() + 3600 * 1000; // 1 hour validity
  user.updatedAt = new Date().toISOString();
  writeUsers(users);

  return { success: true, resetToken };
}

export function resetPassword(
  token: string,
  newPassword: string,
): { success: boolean; error?: string } {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { success: false, error: "Reset token is required." };
  }

  const passCheck = validatePassword(newPassword);
  if (!passCheck.valid) {
    return { success: false, error: passCheck.error };
  }

  const users = readUsers();
  const now = Date.now();
  const user = users.find(
    (u) =>
      u.resetToken === cleanToken &&
      typeof u.resetTokenExpires === "number" &&
      u.resetTokenExpires > now,
  );

  if (!user) {
    return { success: false, error: "Invalid or expired reset token. Please request a new one." };
  }

  user.passwordHash = hashPassword(newPassword);
  user.resetToken = null;
  user.resetTokenExpires = null;
  user.updatedAt = new Date().toISOString();
  writeUsers(users);

  // Invalidate any active sessions for this user for security
  const sessions = readSessions();
  const updatedSessions = sessions.filter((s) => s.userId !== user.id);
  writeSessions(updatedSessions);

  return { success: true };
}

// -------------------------------------------------------------
// Administrator Setup & Authentication
// -------------------------------------------------------------

export function hasAdminUser(): boolean {
  const users = readUsers();
  return users.some((u) => u.role === "admin" && u.status !== "disabled");
}

export function setupFirstAdmin(
  name: string,
  email: string,
  password: string,
): { success: boolean; user?: StoredUser; error?: string } {
  if (hasAdminUser()) {
    return { success: false, error: "An administrator account already exists. Please sign in." };
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: "Please enter your administrator full name." };
  }

  if (!validateEmail(cleanEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const passCheck = validatePassword(password);
  if (!passCheck.valid) {
    return { success: false, error: passCheck.error };
  }

  const users = readUsers();
  const now = new Date().toISOString();
  let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (user) {
    user.role = "admin";
    user.name = cleanName;
    user.passwordHash = hashPassword(password);
    user.updatedAt = now;
  } else {
    user = {
      id: `usr_adm_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
      enrollments: [],
      progress: [],
    };
    users.push(user);
  }

  writeUsers(users);
  return { success: true, user };
}

// -------------------------------------------------------------
// User-Isolated Learning Data
// -------------------------------------------------------------

export function getUserEnrollments(userId: string): UserEnrollment[] {
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  return user?.enrollments || [];
}

export function enrollUserCourse(
  userId: string,
  course: { id: string; title: string; exam?: string | null; thumbnail?: string | null },
): UserEnrollment[] {
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");

  if (!user.enrollments.some((e) => e.courseId === course.id)) {
    user.enrollments.unshift({
      id: `enr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      courseId: course.id,
      courseTitle: course.title,
      exam: course.exam ?? null,
      thumbnailUrl: course.thumbnail ?? null,
      createdAt: new Date().toISOString(),
    });
    user.updatedAt = new Date().toISOString();
    writeUsers(users);
  }
  return user.enrollments;
}

export function unenrollUserCourse(userId: string, courseId: string): UserEnrollment[] {
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");

  user.enrollments = user.enrollments.filter((e) => e.courseId !== courseId);
  user.updatedAt = new Date().toISOString();
  writeUsers(users);
  return user.enrollments;
}

export function getUserProgress(userId: string, courseId?: string): UserProgress[] {
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return [];
  if (courseId) {
    return user.progress.filter((p) => p.courseId === courseId);
  }
  return user.progress;
}

export function saveUserProgress(
  userId: string,
  progress: {
    courseId: string;
    lessonId: string;
    secondsWatched: number;
    durationSeconds: number;
    title?: string;
    subjectId?: string;
    chapterId?: string;
  },
): void {
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return;

  const completed =
    progress.durationSeconds > 0 && progress.secondsWatched >= progress.durationSeconds * 0.9;
  const idx = user.progress.findIndex(
    (p) => p.courseId === progress.courseId && p.lessonId === progress.lessonId,
  );
  const now = new Date().toISOString();

  if (idx >= 0) {
    user.progress[idx].secondsWatched = Math.floor(progress.secondsWatched);
    if (progress.durationSeconds > 0)
      user.progress[idx].durationSeconds = Math.floor(progress.durationSeconds);
    if (completed) user.progress[idx].completed = true;
    user.progress[idx].updatedAt = now;
  } else {
    user.progress.push({
      courseId: progress.courseId,
      lessonId: progress.lessonId,
      secondsWatched: Math.floor(progress.secondsWatched),
      durationSeconds: Math.floor(progress.durationSeconds),
      completed,
      updatedAt: now,
    });
  }

  // Update enrollment lastWatched
  const enr = user.enrollments.find((e) => e.courseId === progress.courseId);
  if (enr) {
    enr.lastWatchedLessonId = progress.lessonId;
    enr.lastWatchedSeconds = Math.floor(progress.secondsWatched);
    if (progress.title) enr.lastWatchedLessonTitle = progress.title;
    if (progress.subjectId) enr.lastWatchedSubjectId = progress.subjectId;
    if (progress.chapterId) enr.lastWatchedChapterId = progress.chapterId;
  }

  user.updatedAt = now;
  writeUsers(users);
}

export function markUserLessonCompleted(
  userId: string,
  courseId: string,
  lessonId: string,
  completed: boolean,
): void {
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return;

  const idx = user.progress.findIndex((p) => p.courseId === courseId && p.lessonId === lessonId);
  const now = new Date().toISOString();

  if (idx >= 0) {
    user.progress[idx].completed = completed;
    user.progress[idx].updatedAt = now;
  } else {
    user.progress.push({
      courseId,
      lessonId,
      secondsWatched: 0,
      durationSeconds: 0,
      completed,
      updatedAt: now,
    });
  }

  user.updatedAt = now;
  writeUsers(users);
}

export function updateUserProfile(
  userId: string,
  data: { name?: string; targetExam?: string; phoneNumber?: string; avatarUrl?: string },
): SafeUser {
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");

  if (data.name && data.name.trim()) user.name = data.name.trim();
  if (data.targetExam !== undefined) user.targetExam = data.targetExam;
  if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber;
  if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl || undefined;
  user.updatedAt = new Date().toISOString();

  writeUsers(users);
  return toSafeUser(user);
}

// -------------------------------------------------------------
// Admin Management of Users
// -------------------------------------------------------------

export function getAdminUsersList(): {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  target: string;
  enrolledCount: number;
  completedLectures: number;
  progressPercent: number;
  status: "active" | "disabled";
  joinedDate: string;
}[] {
  const users = readUsers();
  return users.map((u) => {
    const enrolledCount = u.enrollments?.length || 0;
    const completedLectures = u.progress?.filter((p) => p.completed)?.length || 0;
    const totalProgress = u.progress?.length || 0;
    const progressPercent =
      totalProgress > 0 ? Math.round((completedLectures / totalProgress) * 100) : 0;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      target: u.targetExam || "JEE & NEET",
      enrolledCount,
      completedLectures,
      progressPercent,
      status: u.status,
      joinedDate: u.createdAt.slice(0, 10),
    };
  });
}
