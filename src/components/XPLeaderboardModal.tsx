import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  gamificationStore,
  type LeaderboardData,
  type LeaderboardUser,
} from "@/services/gamificationStore";
import { getRealLeaderboardServer } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import {
  Trophy,
  Flame,
  Zap,
  X,
  Crown,
  Medal,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Users,
} from "lucide-react";

export function XPLeaderboardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const fetchRealLeaderboard = useServerFn(getRealLeaderboardServer);
  const [data, setData] = useState<LeaderboardData>(() =>
    gamificationStore.getLeaderboard(user?.name || "You", user?.avatarUrl),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const update = () => {
      setData(gamificationStore.getLeaderboard(user?.name || "You", user?.avatarUrl));
    };

    window.addEventListener("dharam_gamification_updated", update);
    window.addEventListener("dharam_progress_updated", update);
    window.addEventListener("dharam_xp_awarded", update);

    return () => {
      window.removeEventListener("dharam_gamification_updated", update);
      window.removeEventListener("dharam_progress_updated", update);
      window.removeEventListener("dharam_xp_awarded", update);
    };
  }, [user?.name, user?.avatarUrl]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const syncRealData = async () => {
      setLoading(true);
      try {
        const res = await fetchRealLeaderboard();
        if (isMounted && res?.status === "ok" && res.learners) {
          gamificationStore.setRealLearners(res.learners);
          setData(gamificationStore.getLeaderboard(user?.name || "You"));
        }
      } catch (e) {
        console.error("Could not sync real leaderboard:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    syncRealData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user?.name, fetchRealLeaderboard]);

  if (!isOpen) return null;

  const top3 = data.topRanks.slice(0, 3);
  const rank1 = top3[0];
  const rank2 = top3[1];
  const rank3 = top3[2];
  const restRanks = data.topRanks.slice(3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl bg-card ring-1 ring-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Trophy className="size-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-foreground">
                  Real XP Leaderboard
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3" /> Real Learners Only
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Verified ranks based on completed lectures · No fake profiles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Top Podium */}
          <div className="rounded-2xl bg-gradient-to-b from-amber-500/10 via-background to-background p-4 ring-1 ring-amber-500/20">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Top Ranked Scholars
              </p>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                <Users className="size-3" /> {data.totalLearners} Active{" "}
                {data.totalLearners === 1 ? "Scholar" : "Scholars"}
              </span>
            </div>

            {top3.length === 1 && rank1 ? (
              <div className="flex flex-col items-center py-3 text-center">
                <div className="relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                    <Crown className="size-6 fill-current" />
                  </div>
                  <img
                    src={rank1.avatar}
                    alt={rank1.name}
                    className="size-20 rounded-full object-cover ring-3 ring-amber-500 shadow-md shadow-amber-500/20"
                  />
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex size-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow-xs">
                    1
                  </span>
                </div>
                <p className="mt-3 text-sm font-bold text-foreground">
                  {rank1.name} {rank1.isCurrentUser && "(You)"}
                </p>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {rank1.xp} XP
                </p>
                <span className="mt-1 rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  {rank1.badge}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 items-end pt-2 text-center">
                {/* Rank 2 (Silver) */}
                {rank2 ? (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <img
                        src={rank2.avatar}
                        alt={rank2.name}
                        className="size-13 rounded-full object-cover ring-2 ring-slate-300 dark:ring-slate-600"
                      />
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex size-5 items-center justify-center rounded-full bg-slate-300 text-[10px] font-bold text-slate-800 shadow-xs">
                        2
                      </span>
                    </div>
                    <p className="mt-2.5 line-clamp-1 text-xs font-semibold text-foreground">
                      {rank2.name} {rank2.isCurrentUser && "(You)"}
                    </p>
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {rank2.xp} XP
                    </p>
                    <span className="mt-0.5 rounded bg-muted px-1.5 py-0.2 text-[9px] text-muted-foreground">
                      {rank2.badge}
                    </span>
                  </div>
                ) : (
                  <div />
                )}

                {/* Rank 1 (Gold - Center & Elevated) */}
                {rank1 ? (
                  <div className="flex flex-col items-center -translate-y-2">
                    <div className="relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                        <Crown className="size-5 fill-current" />
                      </div>
                      <img
                        src={rank1.avatar}
                        alt={rank1.name}
                        className="size-16 rounded-full object-cover ring-3 ring-amber-500 shadow-md shadow-amber-500/20"
                      />
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex size-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow-xs">
                        1
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-1 text-xs font-bold text-foreground">
                      {rank1.name} {rank1.isCurrentUser && "(You)"}
                    </p>
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {rank1.xp} XP
                    </p>
                    <span className="mt-0.5 rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700 dark:text-amber-300">
                      {rank1.badge}
                    </span>
                  </div>
                ) : null}

                {/* Rank 3 (Bronze) */}
                {rank3 ? (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <img
                        src={rank3.avatar}
                        alt={rank3.name}
                        className="size-13 rounded-full object-cover ring-2 ring-amber-700/40"
                      />
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex size-5 items-center justify-center rounded-full bg-amber-700/80 text-[10px] font-bold text-white shadow-xs">
                        3
                      </span>
                    </div>
                    <p className="mt-2.5 line-clamp-1 text-xs font-semibold text-foreground">
                      {rank3.name} {rank3.isCurrentUser && "(You)"}
                    </p>
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {rank3.xp} XP
                    </p>
                    <span className="mt-0.5 rounded bg-muted px-1.5 py-0.2 text-[9px] text-muted-foreground">
                      {rank3.badge}
                    </span>
                  </div>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>

          {/* Ranks List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                All Verified Scholars ({data.topRanks.length})
              </span>
              <span className="text-[10px] text-muted-foreground">
                {loading ? "Syncing..." : "Real-time sync"}
              </span>
            </div>

            <div className="space-y-2">
              {restRanks.length === 0 && top3.length <= 3 && (
                <div className="rounded-2xl border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Only real registered scholars appear here. Complete lessons to boost your rank!
                  </p>
                </div>
              )}

              {restRanks.map((learner) => (
                <div
                  key={learner.rank}
                  className={`flex items-center gap-3 rounded-2xl p-2.5 ring-1 transition ${
                    learner.isCurrentUser
                      ? "bg-amber-500/10 ring-amber-500/40 font-semibold"
                      : "bg-card ring-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold text-muted-foreground">
                    #{learner.rank}
                  </div>

                  <img
                    src={learner.avatar}
                    alt={learner.name}
                    className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {learner.name}
                      </p>
                      {learner.isCurrentUser ? (
                        <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                          You
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{learner.target || learner.badge}</span>
                      <span>&middot;</span>
                      <span className="flex items-center gap-0.5 text-orange-500 font-medium">
                        <Flame className="size-2.5 fill-current" /> {learner.streak}d
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Zap className="size-3 fill-current" />
                      <span>{learner.xp}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground">XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky User Position Banner */}
        <div className="border-t border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold text-sm shadow-xs">
                #{data.currentUserRank.rank}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Your Current Rank: #{data.currentUserRank.rank}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {data.currentUserRank.xp} Total XP &middot; {data.currentUserRank.streak} Day
                  Streak
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <Sparkles className="size-3" /> +25 XP/video
              </span>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground">
            {data.currentUserRank.rank > 1
              ? `Watch lectures and complete DPPs to gain ${data.nextRankGap} XP and climb up!`
              : "Outstanding! You are leading the verified scholars leaderboard!"}
          </p>
        </div>
      </div>
    </div>
  );
}
