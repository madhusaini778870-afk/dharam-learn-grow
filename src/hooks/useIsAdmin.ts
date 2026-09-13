import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Admin check. Roles live in their own table and are verified by the database's
 * access rules — never in browser storage.
 */
export function useIsAdmin() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["role", user?.id],
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).some((row) => row.role === "admin");
    },
  });
  return { isAdmin: query.data === true, loading: query.isLoading, query };
}
