import { createServerFn } from "@tanstack/react-start";
import type { SafeUser, UserEnrollment, UserProgress } from "./authStore.server";

export type { SafeUser, UserEnrollment, UserProgress };

export type AuthResponse = {
  success: boolean;
  user?: SafeUser;
  token?: string;
  error?: string;
};

// -------------------------------------------------------------
// Registration & Login
// -------------------------------------------------------------

export const registerUserServer = createServerFn({ method: "POST" })
  .validator(
    (
      d: { name?: string; email?: string; password?: string; confirmPassword?: string } | undefined,
    ) => ({
      name: String(d?.name ?? "").trim(),
      email: String(d?.email ?? "").trim(),
      password: String(d?.password ?? "").trim(),
      confirmPassword: String(d?.confirmPassword ?? "").trim(),
    }),
  )
  .handler(async ({ data }): Promise<AuthResponse> => {
    if (!data.name || data.name.length < 2) {
      return { success: false, error: "Please enter your full name (at least 2 characters)." };
    }
    if (!data.email) {
      return { success: false, error: "Please enter your email address." };
    }
    if (!data.password || data.password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }
    if (data.password !== data.confirmPassword) {
      return { success: false, error: "Passwords do not match." };
    }

    const { registerUser, createSession, toSafeUser } = await import("./authStore.server");
    const regResult = registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: "student",
    });

    if (!regResult.success || !regResult.user) {
      return { success: false, error: regResult.error ?? "Registration failed." };
    }

    const session = createSession(regResult.user.id, regResult.user.role);
    return {
      success: true,
      user: toSafeUser(regResult.user),
      token: session.token,
    };
  });

export const loginUserServer = createServerFn({ method: "POST" })
  .validator((d: { email?: string; password?: string } | undefined) => ({
    email: String(d?.email ?? "").trim(),
    password: String(d?.password ?? "").trim(),
  }))
  .handler(async ({ data }): Promise<AuthResponse> => {
    if (!data.email || !data.password) {
      return { success: false, error: "Please enter both email and password." };
    }

    const { loginUser, createSession, toSafeUser } = await import("./authStore.server");
    const loginResult = loginUser(data.email, data.password);

    if (!loginResult.success || !loginResult.user) {
      return { success: false, error: loginResult.error ?? "Invalid email or password." };
    }

    const session = createSession(loginResult.user.id, loginResult.user.role);
    return {
      success: true,
      user: toSafeUser(loginResult.user),
      token: session.token,
    };
  });

// -------------------------------------------------------------
// Admin Authentication & Setup
// -------------------------------------------------------------

export const checkAdminSetupServer = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ hasAdmin: boolean }> => {
    const { hasAdminUser } = await import("./authStore.server");
    return { hasAdmin: hasAdminUser() };
  },
);

export const setupFirstAdminServer = createServerFn({ method: "POST" })
  .validator(
    (
      d: { name?: string; email?: string; password?: string; confirmPassword?: string } | undefined,
    ) => ({
      name: String(d?.name ?? "").trim(),
      email: String(d?.email ?? "").trim(),
      password: String(d?.password ?? "").trim(),
      confirmPassword: String(d?.confirmPassword ?? "").trim(),
    }),
  )
  .handler(async ({ data }): Promise<AuthResponse> => {
    if (data.password !== data.confirmPassword) {
      return { success: false, error: "Passwords do not match." };
    }

    const { setupFirstAdmin, createSession, toSafeUser } = await import("./authStore.server");
    const result = setupFirstAdmin(data.name, data.email, data.password);

    if (!result.success || !result.user) {
      return { success: false, error: result.error ?? "Failed to initialize administrator." };
    }

    const session = createSession(result.user.id, "admin");
    return {
      success: true,
      user: toSafeUser(result.user),
      token: session.token,
    };
  });

export const adminLoginServer = createServerFn({ method: "POST" })
  .validator((d: { email?: string; password?: string } | undefined) => ({
    email: String(d?.email ?? "").trim(),
    password: String(d?.password ?? "").trim(),
  }))
  .handler(async ({ data }): Promise<AuthResponse> => {
    const { loginUser, createSession, toSafeUser } = await import("./authStore.server");
    const result = loginUser(data.email, data.password, "admin");

    if (!result.success || !result.user) {
      return { success: false, error: result.error ?? "Invalid administrator credentials." };
    }

    const session = createSession(result.user.id, "admin");
    return {
      success: true,
      user: toSafeUser(result.user),
      token: session.token,
    };
  });

// -------------------------------------------------------------
// Session Validation & Logout
// -------------------------------------------------------------

export const getSessionServer = createServerFn({ method: "POST" })
  .validator((d: { token?: string } | undefined) => ({
    token: String(d?.token ?? ""),
  }))
  .handler(
    async ({
      data,
    }): Promise<{
      authenticated: boolean;
      user: SafeUser | null;
      role?: "student" | "admin";
    }> => {
      if (!data.token) return { authenticated: false, user: null };

      const { getSessionUser, toSafeUser } = await import("./authStore.server");
      const record = getSessionUser(data.token);

      if (!record) {
        return { authenticated: false, user: null };
      }

      return {
        authenticated: true,
        user: toSafeUser(record.user),
        role: record.session.role,
      };
    },
  );

export const logoutServer = createServerFn({ method: "POST" })
  .validator((d: { token?: string } | undefined) => ({
    token: String(d?.token ?? ""),
  }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const { destroySession } = await import("./authStore.server");
    destroySession(data.token);
    return { success: true };
  });

// -------------------------------------------------------------
// Forgot & Reset Password
// -------------------------------------------------------------

export const requestPasswordResetServer = createServerFn({ method: "POST" })
  .validator((d: { email?: string } | undefined) => ({
    email: String(d?.email ?? "").trim(),
  }))
  .handler(
    async ({ data }): Promise<{ success: boolean; message: string; resetToken?: string }> => {
      const { requestPasswordReset } = await import("./authStore.server");
      const result = requestPasswordReset(data.email);

      return {
        success: true,
        message:
          "If an account with that email exists, reset instructions and a reset code have been generated.",
        resetToken: result.resetToken,
      };
    },
  );

export const resetPasswordServer = createServerFn({ method: "POST" })
  .validator(
    (d: { token?: string; newPassword?: string; confirmPassword?: string } | undefined) => ({
      token: String(d?.token ?? "").trim(),
      newPassword: String(d?.newPassword ?? "").trim(),
      confirmPassword: String(d?.confirmPassword ?? "").trim(),
    }),
  )
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    if (data.newPassword !== data.confirmPassword) {
      return { success: false, error: "Passwords do not match." };
    }

    const { resetPassword } = await import("./authStore.server");
    return resetPassword(data.token, data.newPassword);
  });

// -------------------------------------------------------------
// User Profile & Isolation
// -------------------------------------------------------------

export const updateProfileServer = createServerFn({ method: "POST" })
  .validator(
    (
      d:
        | {
            token?: string;
            name?: string;
            targetExam?: string;
            phoneNumber?: string;
            avatarUrl?: string;
          }
        | undefined,
    ) => ({
      token: String(d?.token ?? ""),
      name: d?.name ? String(d.name).trim() : undefined,
      targetExam: d?.targetExam ? String(d.targetExam).trim() : undefined,
      phoneNumber: d?.phoneNumber ? String(d.phoneNumber).trim() : undefined,
      avatarUrl: d?.avatarUrl !== undefined ? String(d.avatarUrl).trim() : undefined,
    }),
  )
  .handler(async ({ data }): Promise<{ success: boolean; user?: SafeUser; error?: string }> => {
    const { getSessionUser, updateUserProfile } = await import("./authStore.server");
    const auth = getSessionUser(data.token);
    if (!auth) return { success: false, error: "Unauthorized. Please sign in." };

    try {
      const updated = updateUserProfile(auth.user.id, {
        name: data.name,
        targetExam: data.targetExam,
        phoneNumber: data.phoneNumber,
        avatarUrl: data.avatarUrl,
      });
      return { success: true, user: updated };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

// -------------------------------------------------------------
// Isolated User Learning Data (Enrollments & Progress)
// -------------------------------------------------------------

export const getUserEnrollmentsServer = createServerFn({ method: "POST" })
  .validator((d: { token?: string } | undefined) => ({
    token: String(d?.token ?? ""),
  }))
  .handler(async ({ data }): Promise<{ success: boolean; enrollments: UserEnrollment[] }> => {
    const { getSessionUser, getUserEnrollments } = await import("./authStore.server");
    const auth = getSessionUser(data.token);
    if (!auth) return { success: false, enrollments: [] };

    const list = getUserEnrollments(auth.user.id);
    return { success: true, enrollments: list };
  });

export const enrollCourseServer = createServerFn({ method: "POST" })
  .validator(
    (
      d:
        | {
            token?: string;
            course?: {
              id: string;
              title: string;
              exam?: string | null;
              thumbnail?: string | null;
            };
          }
        | undefined,
    ) => ({
      token: String(d?.token ?? ""),
      course: d?.course,
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{ success: boolean; enrollments?: UserEnrollment[]; error?: string }> => {
      if (!data.course?.id) return { success: false, error: "Course details required." };

      const { getSessionUser, enrollUserCourse } = await import("./authStore.server");
      const auth = getSessionUser(data.token);
      if (!auth) return { success: false, error: "Please log in to enroll in this course." };

      const enrollments = enrollUserCourse(auth.user.id, data.course);
      return { success: true, enrollments };
    },
  );

export const unenrollCourseServer = createServerFn({ method: "POST" })
  .validator((d: { token?: string; courseId?: string } | undefined) => ({
    token: String(d?.token ?? ""),
    courseId: String(d?.courseId ?? ""),
  }))
  .handler(
    async ({
      data,
    }): Promise<{ success: boolean; enrollments?: UserEnrollment[]; error?: string }> => {
      const { getSessionUser, unenrollUserCourse } = await import("./authStore.server");
      const auth = getSessionUser(data.token);
      if (!auth) return { success: false, error: "Unauthorized" };

      const enrollments = unenrollUserCourse(auth.user.id, data.courseId);
      return { success: true, enrollments };
    },
  );

export const getUserProgressServer = createServerFn({ method: "POST" })
  .validator((d: { token?: string; courseId?: string } | undefined) => ({
    token: String(d?.token ?? ""),
    courseId: d?.courseId ? String(d.courseId) : undefined,
  }))
  .handler(async ({ data }): Promise<{ success: boolean; progress: UserProgress[] }> => {
    const { getSessionUser, getUserProgress } = await import("./authStore.server");
    const auth = getSessionUser(data.token);
    if (!auth) return { success: false, progress: [] };

    const progress = getUserProgress(auth.user.id, data.courseId);
    return { success: true, progress };
  });

export const saveProgressServer = createServerFn({ method: "POST" })
  .validator(
    (
      d:
        | {
            token?: string;
            courseId?: string;
            lessonId?: string;
            secondsWatched?: number;
            durationSeconds?: number;
            title?: string;
            subjectId?: string;
            chapterId?: string;
          }
        | undefined,
    ) => ({
      token: String(d?.token ?? ""),
      courseId: String(d?.courseId ?? ""),
      lessonId: String(d?.lessonId ?? ""),
      secondsWatched: Number(d?.secondsWatched ?? 0),
      durationSeconds: Number(d?.durationSeconds ?? 0),
      title: d?.title ? String(d.title) : undefined,
      subjectId: d?.subjectId ? String(d.subjectId) : undefined,
      chapterId: d?.chapterId ? String(d.chapterId) : undefined,
    }),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const { getSessionUser, saveUserProgress } = await import("./authStore.server");
    const auth = getSessionUser(data.token);
    if (!auth) return { success: false };

    saveUserProgress(auth.user.id, {
      courseId: data.courseId,
      lessonId: data.lessonId,
      secondsWatched: data.secondsWatched,
      durationSeconds: data.durationSeconds,
      title: data.title,
      subjectId: data.subjectId,
      chapterId: data.chapterId,
    });
    return { success: true };
  });

export const markLectureCompletedServer = createServerFn({ method: "POST" })
  .validator(
    (
      d: { token?: string; courseId?: string; lessonId?: string; completed?: boolean } | undefined,
    ) => ({
      token: String(d?.token ?? ""),
      courseId: String(d?.courseId ?? ""),
      lessonId: String(d?.lessonId ?? ""),
      completed: Boolean(d?.completed),
    }),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const { getSessionUser, markUserLessonCompleted } = await import("./authStore.server");
    const auth = getSessionUser(data.token);
    if (!auth) return { success: false };

    markUserLessonCompleted(auth.user.id, data.courseId, data.lessonId, data.completed);
    return { success: true };
  });

// -------------------------------------------------------------
// Admin Users List Endpoint
// -------------------------------------------------------------

export const getAdminUsersServer = createServerFn({ method: "POST" })
  .validator((d: { adminToken?: string } | undefined) => ({
    adminToken: String(d?.adminToken ?? ""),
  }))
  .handler(
    async ({
      data,
    }): Promise<{
      status: "ok" | "error";
      users?: ReturnType<typeof import("./authStore.server").getAdminUsersList>;
      message?: string;
    }> => {
      const { getSessionUser, getAdminUsersList } = await import("./authStore.server");
      const auth = getSessionUser(data.adminToken);

      if (!auth || auth.user.role !== "admin") {
        return { status: "error", message: "Unauthorized: Administrator access required." };
      }

      return { status: "ok", users: getAdminUsersList() };
    },
  );

// -------------------------------------------------------------
// Real Learners XP Leaderboard (No Fake Profiles)
// -------------------------------------------------------------

export type RealLeaderboardEntry = {
  id: string;
  name: string;
  email: string;
  xp: number;
  completedLectures: number;
  streak: number;
  target: string;
  badge: string;
  role: string;
  avatar: string;
};

export const getRealLeaderboardServer = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    status: "ok";
    learners: RealLeaderboardEntry[];
    totalRealLearners: number;
  }> => {
    const { readUsers } = await import("./authStore.server");
    const allUsers = readUsers().filter((u) => u.status !== "disabled");

    const learners: RealLeaderboardEntry[] = allUsers.map((u) => {
      const completedLectures = (u.progress || []).filter((p) => p.completed).length;
      // Real XP calculation: 25 XP per completed lecture + role / activity bonus
      const xp = completedLectures * 25 + (u.role === "admin" ? 35 : 10);
      const examName = u.enrollments?.[0]?.exam || "JEE / NEET";
      const target = u.target || `${examName} Aspirant`;

      const badge =
        u.role === "admin"
          ? "Official Admin · PW Mentor"
          : completedLectures >= 20
            ? "PW Master Scholar"
            : completedLectures >= 5
              ? "PW Star Learner"
              : "Active Learner";

      return {
        id: u.id,
        name: u.name || "Student",
        email: u.email,
        xp,
        completedLectures,
        streak: Math.max(1, Math.min(30, completedLectures + 1)),
        target,
        badge,
        role: u.role,
        avatar:
          u.avatarUrl ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      };
    });

    // Sort strictly by real XP descending
    learners.sort((a, b) => b.xp - a.xp || b.completedLectures - a.completedLectures);

    return {
      status: "ok",
      learners,
      totalRealLearners: learners.length,
    };
  },
);
