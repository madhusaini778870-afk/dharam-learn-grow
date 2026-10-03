// Gamification Store: XP, Daily Study Streak, and Course/App Ratings
// Adheres strictly to requirements:
// - +25 XP for each completed course video
// - Daily streak login tracking as in PW (Physics Wallah) app
// - Streak history and visual 7-day tracker
// - Course and App ratings persistence

import { studentStore } from "@/services/studentStore";

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  isActiveToday: boolean;
  activeDates: string[]; // List of YYYY-MM-DD strings
}

export interface ReviewItem {
  id: string;
  courseId?: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  tags?: string[];
  createdAt: string;
  isUserReview?: boolean;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  badge: string;
  isCurrentUser?: boolean;
  target?: string;
}

export interface LeaderboardData {
  topRanks: LeaderboardUser[];
  currentUserRank: LeaderboardUser;
  nextRankGap: number;
  totalLearners: number;
}

const STORAGE_KEYS = {
  XP_BONUS: "dhs_gamification_bonus_xp",
  STREAK: "dhs_gamification_streak",
  AWARDED_LESSONS: "dhs_gamification_awarded_lessons",
  REVIEWS: "dhs_course_reviews",
  APP_RATING: "dhs_app_rating",
};

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const gamificationStore = {
  // Snapshot of current gamification state (XP + Streak)
  getState(): { xp: number; streak: StreakInfo } {
    return {
      xp: this.getXp(),
      streak: this.getStreak(),
    };
  },

  // 1. XP Management
  // Each completed course video yields 25 XP
  getXp(): number {
    if (typeof window === "undefined") return 0;
    try {
      const stats = studentStore.getStats();
      const completedLectures = stats.completedLessonsCount || 0;
      const baseVideoXp = completedLectures * 25;

      const bonusRaw = localStorage.getItem(STORAGE_KEYS.XP_BONUS);
      const bonusXp = bonusRaw ? parseInt(bonusRaw, 10) || 0 : 0;

      return baseVideoXp + bonusXp;
    } catch {
      return 0;
    }
  },

  // Awards 25 XP for a completed video lecture
  awardLectureCompletion(courseId: string, lessonId: string): { awarded: boolean; newXp: number } {
    if (typeof window === "undefined") return { awarded: false, newXp: 0 };
    try {
      const awardedRaw = localStorage.getItem(STORAGE_KEYS.AWARDED_LESSONS);
      const awardedList: string[] = awardedRaw ? JSON.parse(awardedRaw) : [];
      const key = `${courseId}::${lessonId}`;

      if (!awardedList.includes(key)) {
        awardedList.push(key);
        localStorage.setItem(STORAGE_KEYS.AWARDED_LESSONS, JSON.stringify(awardedList));

        // Mark active streak day for today as well
        this.recordActivity();

        // Dispatch notification event
        window.dispatchEvent(
          new CustomEvent("dharam_xp_awarded", {
            detail: { amount: 25, reason: "Video Lecture Completed" },
          }),
        );
        window.dispatchEvent(new CustomEvent("dharam_gamification_updated"));

        return { awarded: true, newXp: this.getXp() };
      }

      return { awarded: false, newXp: this.getXp() };
    } catch {
      return { awarded: false, newXp: this.getXp() };
    }
  },

  addBonusXp(amount: number, reason = "Bonus Reward"): void {
    if (typeof window === "undefined" || amount <= 0) return;
    try {
      const current = parseInt(localStorage.getItem(STORAGE_KEYS.XP_BONUS) || "0", 10) || 0;
      localStorage.setItem(STORAGE_KEYS.XP_BONUS, String(current + amount));
      window.dispatchEvent(
        new CustomEvent("dharam_xp_awarded", {
          detail: { amount, reason },
        }),
      );
      window.dispatchEvent(new CustomEvent("dharam_gamification_updated"));
    } catch {
      // ignore
    }
  },

  // 2. Daily Study Streak (Physics Wallah style)
  getStreak(): StreakInfo {
    const today = getTodayString();
    const fallback: StreakInfo = {
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
      isActiveToday: true,
      activeDates: [today],
    };

    if (typeof window === "undefined") return fallback;

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STREAK);
      if (!raw) {
        // First login -> start with 1 day streak
        localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(fallback));
        return fallback;
      }

      const data = JSON.parse(raw) as StreakInfo;

      // Check if active today
      const isActiveToday = data.lastActiveDate === today;

      return {
        ...data,
        currentStreak: typeof data.currentStreak === "number" ? data.currentStreak : 1,
        longestStreak: typeof data.longestStreak === "number" ? data.longestStreak : 1,
        activeDates: Array.isArray(data.activeDates) ? data.activeDates : [today],
        isActiveToday,
      };
    } catch {
      return fallback;
    }
  },

  // Call on app boot or daily login
  recordDailyLogin(): { isNewDay: boolean; currentStreak: number; bonusEarned: boolean } {
    if (typeof window === "undefined") {
      return { isNewDay: false, currentStreak: 1, bonusEarned: false };
    }

    try {
      const today = getTodayString();
      const yesterday = getYesterdayString();
      const raw = localStorage.getItem(STORAGE_KEYS.STREAK);

      let currentStreak = 1;
      let longestStreak = 1;
      let activeDates: string[] = [today];
      let isNewDay = false;
      let bonusEarned = false;

      if (raw) {
        const parsed = JSON.parse(raw) as StreakInfo;
        activeDates = Array.isArray(parsed.activeDates) ? parsed.activeDates : [];
        longestStreak = parsed.longestStreak || 1;

        if (parsed.lastActiveDate === today) {
          // Already logged in today
          currentStreak = parsed.currentStreak || 1;
          isNewDay = false;
        } else if (parsed.lastActiveDate === yesterday) {
          // Consecutive streak!
          currentStreak = (parsed.currentStreak || 1) + 1;
          longestStreak = Math.max(longestStreak, currentStreak);
          isNewDay = true;
          bonusEarned = true;
          // Award 10 bonus XP for keeping daily streak
          this.addBonusXp(10, "Daily Streak Bonus");
        } else {
          // Streak missed by more than 1 day
          currentStreak = 1;
          isNewDay = true;
        }
      } else {
        isNewDay = true;
      }

      if (!activeDates.includes(today)) {
        activeDates.push(today);
      }

      const updated: StreakInfo = {
        currentStreak,
        longestStreak,
        lastActiveDate: today,
        isActiveToday: true,
        activeDates: activeDates.slice(-30), // keep last 30 days
      };

      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("dharam_gamification_updated"));

      return { isNewDay, currentStreak, bonusEarned };
    } catch {
      return { isNewDay: false, currentStreak: 1, bonusEarned: false };
    }
  },

  recordActivity(): void {
    if (typeof window === "undefined") return;
    try {
      const today = getTodayString();
      const streak = this.getStreak();
      if (!streak.activeDates.includes(today)) {
        streak.activeDates.push(today);
      }
      streak.isActiveToday = true;
      streak.lastActiveDate = today;
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streak));
      window.dispatchEvent(new CustomEvent("dharam_gamification_updated"));
    } catch {
      // ignore
    }
  },

  // 3. Course and App Reviews
  getCourseReviews(courseId: string): ReviewItem[] {
    const defaultReviews: ReviewItem[] = [
      {
        id: "rev-1",
        courseId,
        userName: "Aman Sharma",
        rating: 5,
        comment:
          "Best batch for revision! Lakshya Prince sir and faculty cover deep concepts with great problem solving tips.",
        tags: ["Concept Clarity", "Top Faculty"],
        createdAt: "2 days ago",
      },
      {
        id: "rev-2",
        courseId,
        userName: "Priya Verma",
        rating: 5,
        comment:
          "The DPP sheets and notes are extremely high yield. Solved all previous year questions smoothly.",
        tags: ["Quality DPPs", "Crisp Notes"],
        createdAt: "5 days ago",
      },
      {
        id: "rev-3",
        courseId,
        userName: "Rohan Patel",
        rating: 4,
        comment:
          "Very helpful video lectures. Loved the in-player speed controls and doubts solver.",
        tags: ["Doubt Solving"],
        createdAt: "1 week ago",
      },
    ];

    if (typeof window === "undefined") return defaultReviews;

    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.REVIEWS}_${courseId}`);
      if (!raw) return defaultReviews;
      const userReviews: ReviewItem[] = JSON.parse(raw);
      return [...userReviews, ...defaultReviews];
    } catch {
      return defaultReviews;
    }
  },

  addCourseReview(
    courseId: string,
    review: {
      userName: string;
      rating: number;
      comment: string;
      tags?: string[];
    },
  ): ReviewItem {
    const newRev: ReviewItem = {
      id: `user-rev-${Date.now()}`,
      courseId,
      userName: review.userName.trim() || "Student",
      rating: Math.max(1, Math.min(5, review.rating)),
      comment: review.comment.trim(),
      tags: review.tags ?? [],
      createdAt: "Just now",
      isUserReview: true,
    };

    if (typeof window !== "undefined") {
      try {
        const key = `${STORAGE_KEYS.REVIEWS}_${courseId}`;
        const raw = localStorage.getItem(key);
        const list: ReviewItem[] = raw ? JSON.parse(raw) : [];
        list.unshift(newRev);
        localStorage.setItem(key, JSON.stringify(list));

        // Award 15 XP for submitting a course review
        this.addBonusXp(15, "Course Review Reward");
        window.dispatchEvent(new CustomEvent("dharam_reviews_updated"));
      } catch {
        // ignore
      }
    }

    return newRev;
  },

  // App rating
  getAppRating(): { rating: number; feedback?: string } | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.APP_RATING);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveAppRating(rating: number, feedback?: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.APP_RATING,
        JSON.stringify({
          rating: Math.max(1, Math.min(5, rating)),
          feedback: feedback?.trim() || "",
          timestamp: new Date().toISOString(),
        }),
      );
      this.addBonusXp(20, "App Rating Reward");
      window.dispatchEvent(new CustomEvent("dharam_app_rating_updated"));
    } catch {
      // ignore
    }
  },

  // 4. XP Leaderboard & Top Ranks (100% Real Registered Learners Only - No Fake Profiles)
  realLearnersCache: [] as LeaderboardUser[],

  setRealLearners(
    learners: {
      id: string;
      name: string;
      email?: string;
      xp: number;
      streak: number;
      badge: string;
      target?: string;
      avatar?: string;
    }[],
  ) {
    this.realLearnersCache = learners.map((l, index) => ({
      rank: index + 1,
      name: l.name,
      avatar:
        l.avatar ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      xp: l.xp,
      streak: l.streak,
      badge: l.badge,
      target: l.target || "PW JEE / NEET Aspirant",
      isCurrentUser: false,
    }));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dharam_gamification_updated"));
    }
  },

  getLeaderboard(userName = "You", userAvatar?: string | null): LeaderboardData {
    const userXp = this.getXp();
    const userStreak = this.getStreak().currentStreak;
    const cleanUserName = (userName || "You").trim();
    const defaultAvatar =
      userAvatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80";

    // STRICT: Only use real registered learners, zero fake profiles!
    const list: LeaderboardUser[] = [];

    // Find if current user already exists in real learners cache
    let foundCurrent = false;
    for (const learner of this.realLearnersCache) {
      if (
        cleanUserName !== "You" &&
        learner.name.trim().toLowerCase() === cleanUserName.toLowerCase()
      ) {
        // Update their real XP with client-side latest activity
        list.push({
          ...learner,
          name: cleanUserName,
          avatar: userAvatar || learner.avatar || defaultAvatar,
          xp: Math.max(learner.xp, userXp),
          streak: Math.max(learner.streak, userStreak),
          isCurrentUser: true,
        });
        foundCurrent = true;
      } else {
        list.push({
          ...learner,
          isCurrentUser: false,
        });
      }
    }

    // If current user is not in cache or cache was empty, include current user
    if (!foundCurrent) {
      list.push({
        rank: 1,
        name: cleanUserName,
        avatar: defaultAvatar,
        xp: userXp,
        streak: userStreak,
        badge:
          userXp >= 1000
            ? "PW Master Scholar"
            : userXp >= 250
              ? "PW Star Learner"
              : "Active Learner",
        target: "JEE / NEET Aspirant",
        isCurrentUser: true,
      });
    }

    // Sort strictly by real XP, tiebreak by streak
    list.sort((a, b) => b.xp - a.xp || b.streak - a.streak);

    // Assign 1-indexed real ranks
    const rankedList: LeaderboardUser[] = list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    const currentUserRank = rankedList.find((item) => item.isCurrentUser) || {
      rank: rankedList.length,
      name: cleanUserName,
      avatar: defaultAvatar,
      xp: userXp,
      streak: userStreak,
      badge: "Active Learner",
      target: "JEE / NEET Aspirant",
      isCurrentUser: true,
    };

    // Calculate gap to next rank ahead of user
    let nextRankGap = 25;
    if (currentUserRank.rank > 1) {
      const aheadUser = rankedList[currentUserRank.rank - 2];
      if (aheadUser) {
        nextRankGap = Math.max(25, aheadUser.xp - currentUserRank.xp + 25);
      }
    }

    return {
      topRanks: rankedList.slice(0, 20),
      currentUserRank,
      nextRankGap,
      totalLearners: rankedList.length,
    };
  },
};

// Automatically record daily login on boot
if (typeof window !== "undefined") {
  setTimeout(() => {
    gamificationStore.recordDailyLogin();
  }, 250);
}
