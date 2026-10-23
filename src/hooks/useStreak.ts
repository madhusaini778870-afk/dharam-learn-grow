import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StreakRow = {
  user_id: string;
  xp: number;
  streak: number;
  longest_streak: number;
  last_active_date: string | null;
};

const DAILY_XP = 5;
const DAY_MS = 86_400_000;

/**
 * Reads the signed-in student's XP and daily streak (Indian Standard Time) and
 * records one visit per day. Lesson completions add extra XP separately.
 */
export function useStreak() {
  const { user } = useAuth();
  const claimedToday = useRef(false);

  const query = useQuery({
    queryKey: ["streak", user?.id],
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    queryFn: async (): Promise<StreakRow | null> => {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("user_id, xp, streak, longest_streak, last_active_date")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as StreakRow | null;
    },
  });

  useEffect(() => {
    if (!user?.id || claimedToday.current) return;
    const row = query.data;
    // Skip the rpc when today's visit (IST) is already recorded.
    if (row?.last_active_date === istToday()) {
      claimedToday.current = true;
      return;
    }
    claimedToday.current = true;
    void supabase.rpc("record_daily_activity", { p_xp: DAILY_XP }).then(
      () => void query.refetch(),
    );
  }, [user?.id, query.data, query]);

  return {
    xp: query.data?.xp ?? 0,
    streak: query.data?.streak ?? 0,
    longest: query.data?.longest_streak ?? 0,
    loading: query.isLoading,
  };
}

/** Awards XP for an action and refreshes the streak/XP caches. */
export async function awardXp(amount: number) {
  const { error } = await supabase.rpc("record_daily_activity", { p_xp: amount });
  if (error) throw error;
}

/** Today's date in Indian Standard Time as YYYY-MM-DD. */
export function istToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts;
}

/** Level shown to the student: every 100 XP is one level. */
export function levelFor(xp: number): number {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}

/** XP still needed for the next level. */
export function xpToNextLevel(xp: number): number {
  return 100 - (Math.max(0, xp) % 100);
}

export const DAY_MS_UNUSED = DAY_MS;
