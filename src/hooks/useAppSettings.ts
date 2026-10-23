import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SourceSettings = {
  primary: string;
  batchList: string;
  additional: string[];
};

export type CommunitySettings = {
  whatsappEnabled: boolean;
  whatsappUrl: string;
  telegramEnabled: boolean;
  telegramUrl: string;
  title: string;
  message: string;
  cooldownDays: number;
};

export const DEFAULT_COMMUNITY: CommunitySettings = {
  whatsappEnabled: false,
  whatsappUrl: "",
  telegramEnabled: false,
  telegramUrl: "",
  title: "Join Dharam Bhai Study",
  message: "Get class updates, announcements and study updates.",
  cooldownDays: 3,
};

export const DEFAULT_SOURCES: SourceSettings = {
  primary: "",
  batchList: "",
  additional: [],
};

type Row = { key: string; value: unknown };

/** App-wide settings maintained by an admin. Readable by everyone. */
export function useAppSettings() {
  return useQuery({
    queryKey: ["app-settings"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("key, value");
      if (error) throw error;
      const rows = (data ?? []) as Row[];
      const byKey = new Map(rows.map((row) => [row.key, row.value]));
      return {
        community: {
          ...DEFAULT_COMMUNITY,
          ...((byKey.get("community") as Partial<CommunitySettings> | undefined) ?? {}),
        },
        sources: {
          ...DEFAULT_SOURCES,
          ...((byKey.get("sources") as Partial<SourceSettings> | undefined) ?? {}),
        },
      };
    },
  });
}
