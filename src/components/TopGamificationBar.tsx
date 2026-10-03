import { useEffect, useState } from "react";
import { gamificationStore, type StreakInfo } from "@/services/gamificationStore";
import { DailyStreakModal } from "@/components/DailyStreakModal";
import { XPLeaderboardModal } from "@/components/XPLeaderboardModal";
import { Flame, Zap, Sparkles, Trophy } from "lucide-react";

export function TopGamificationBar({
  showStreakModalOnMount = false,
  compact = false,
}: {
  showStreakModalOnMount?: boolean;
  compact?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<StreakInfo>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: "",
    isActiveToday: false,
    activeDates: [],
  });
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(showStreakModalOnMount);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [floatingToast, setFloatingToast] = useState<{
    text: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    setXp(gamificationStore.getXp());
    setStreak(gamificationStore.getStreak());

    const updateStats = () => {
      setXp(gamificationStore.getXp());
      setStreak(gamificationStore.getStreak());
    };

    const handleXpAwarded = (e: Event) => {
      const customEvent = e as CustomEvent<{ amount: number; reason: string }>;
      const amount = customEvent.detail?.amount || 25;
      const reason = customEvent.detail?.reason || "Video Completed";

      setFloatingToast({
        text: reason,
        amount,
      });

      // Update XP state immediately
      setXp(gamificationStore.getXp());

      setTimeout(() => {
        setFloatingToast(null);
      }, 4000);
    };

    window.addEventListener("dharam_gamification_updated", updateStats);
    window.addEventListener("dharam_progress_updated", updateStats);
    window.addEventListener("dharam_xp_awarded", handleXpAwarded);

    return () => {
      window.removeEventListener("dharam_gamification_updated", updateStats);
      window.removeEventListener("dharam_progress_updated", updateStats);
      window.removeEventListener("dharam_xp_awarded", handleXpAwarded);
    };
  }, []);

  return (
    <>
      <div className="flex items-center gap-2 select-none">
        {/* Daily Streak Badge (PW style) */}
        <button
          type="button"
          onClick={() => setIsStreakModalOpen(true)}
          className={`group flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-600 transition hover:bg-orange-500/20 active:scale-95 dark:text-orange-400 ${
            compact ? "px-2 py-0.5 text-[11px]" : ""
          }`}
          title="View Daily Study Streak"
        >
          <Flame className="size-3.5 fill-current text-orange-500 animate-pulse" />
          <span suppressHydrationWarning>
            {mounted ? streak.currentStreak : 0}{" "}
            {compact ? "d" : streak.currentStreak === 1 ? "Day" : "Days"}
          </span>
        </button>

        {/* XP Badge (Clickable to view Top Ranks) */}
        <button
          type="button"
          onClick={() => setIsLeaderboardOpen(true)}
          className={`flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-500/20 active:scale-95 dark:text-amber-300 ${
            compact ? "px-2 py-0.5 text-[11px]" : ""
          }`}
          title="Click to view XP Leaderboard & All India Top Ranks"
        >
          <Zap className="size-3.5 fill-current text-amber-500" />
          <span suppressHydrationWarning>{mounted ? xp : 0} XP</span>
        </button>

        {/* Leaderboard Quick Trophy Button */}
        <button
          type="button"
          onClick={() => setIsLeaderboardOpen(true)}
          className={`flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary transition hover:bg-primary/20 active:scale-95 ${
            compact ? "px-2 py-0.5 text-[11px]" : ""
          }`}
          title="View XP Leaderboard & Top Ranks"
        >
          <Trophy className="size-3.5 fill-current text-primary" />
          <span className="hidden sm:inline">Ranks</span>
        </button>
      </div>

      {/* Floating Animated XP Earned Notification Banner */}
      {floatingToast ? (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-white shadow-xl shadow-amber-500/25 animate-in slide-in-from-top duration-300">
          <Sparkles className="size-4 animate-spin fill-white" />
          <div className="text-xs font-bold">+{floatingToast.amount} XP Earned!</div>
          <span className="text-[11px] opacity-90">({floatingToast.text})</span>
        </div>
      ) : null}

      {/* Daily Streak Details Modal */}
      <DailyStreakModal isOpen={isStreakModalOpen} onClose={() => setIsStreakModalOpen(false)} />

      {/* XP Leaderboard Modal */}
      <XPLeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
    </>
  );
}
