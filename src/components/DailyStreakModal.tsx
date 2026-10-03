import { useState, useEffect } from "react";
import { gamificationStore, type StreakInfo } from "@/services/gamificationStore";
import { Flame, Trophy, Calendar, Sparkles, X, Check, Award } from "lucide-react";

export function DailyStreakModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [streak, setStreak] = useState<StreakInfo>(() => gamificationStore.getStreak());

  useEffect(() => {
    const update = () => setStreak(gamificationStore.getStreak());
    window.addEventListener("dharam_gamification_updated", update);
    return () => window.removeEventListener("dharam_gamification_updated", update);
  }, []);

  if (!isOpen) return null;

  // Generate the last 7 days for the weekly tracker
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    const dayName = daysOfWeek[d.getDay()];
    const isToday = i === 6;
    const isActive = streak.activeDates?.includes(dateStr) || (isToday && streak.isActiveToday);

    return {
      dayName,
      dateNum: d.getDate(),
      dateStr,
      isToday,
      isActive,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 ring-1 ring-border shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Hero Header with Flame Icon */}
        <div className="text-center pt-2">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25 animate-bounce">
            <Flame className="size-9 fill-current" />
          </div>

          <span className="mt-4 inline-block rounded-full bg-orange-500/15 px-3 py-0.5 text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            Daily Study Streak
          </span>

          <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
            {streak.currentStreak} {streak.currentStreak === 1 ? "Day" : "Days"} Streak!
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            {streak.currentStreak > 1
              ? "You're on fire! Studying daily like a true PW & Dharam Bhai topper."
              : "Welcome! Complete at least 1 video lecture or DPP daily to build your streak."}
          </p>
        </div>

        {/* 7-Day Visual Progress Bar */}
        <div className="mt-5 rounded-2xl bg-muted/40 p-3.5 ring-1 ring-border">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-muted-foreground" />
              This Week's Activity
            </span>
            <span className="text-[11px] font-bold text-orange-500">
              {streak.activeDates?.length ?? 1} Days Logged
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {past7Days.map((d) => (
              <div key={d.dateStr} className="flex flex-col items-center">
                <span className="text-[10px] font-medium text-muted-foreground">{d.dayName}</span>
                <div
                  className={`mt-1.5 flex size-8 items-center justify-center rounded-full text-xs font-bold transition ${
                    d.isActive
                      ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xs"
                      : "bg-muted text-muted-foreground"
                  } ${d.isToday ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-card" : ""}`}
                >
                  {d.isActive ? <Check className="size-4 stroke-[3]" /> : d.dateNum}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streak Milestones */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-card p-3 ring-1 ring-border text-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
                <Trophy className="size-3.5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Longest Streak</p>
                <p className="text-[10px] text-muted-foreground">Personal best record</p>
              </div>
            </div>
            <span className="font-bold text-foreground">{streak.longestStreak} Days</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-card p-3 ring-1 ring-border text-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
                <Sparkles className="size-3.5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Streak Reward</p>
                <p className="text-[10px] text-muted-foreground">
                  +10 Bonus XP on daily streak login
                </p>
              </div>
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">+10 XP</span>
          </div>
        </div>

        {/* Motivation CTA */}
        <button
          onClick={onClose}
          className="press mt-5 w-full rounded-2xl bg-foreground py-3 text-center text-xs font-bold text-background shadow transition hover:opacity-90"
        >
          Keep Learning Today →
        </button>
      </div>
    </div>
  );
}
