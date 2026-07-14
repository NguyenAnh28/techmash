import "server-only";

import { unstable_cache } from "next/cache";
import { COMPANY_COLUMNS } from "@/lib/company-select";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Company } from "@/types/company";
import { LEADERBOARD_REFRESH_INTERVAL_SECONDS } from "@/utils/leaderboard";

interface LeaderboardSnapshot {
  companies: Company[];
  lastRefreshedAt: string;
}

async function fetchLeaderboardSnapshot(
  lastRefreshedAt: string,
): Promise<LeaderboardSnapshot> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .order("rating", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Could not load the leaderboard from Supabase.");
  }

  return {
    companies: data ?? [],
    lastRefreshedAt,
  };
}

export const getCachedLeaderboardSnapshot = unstable_cache(
  fetchLeaderboardSnapshot,
  ["leaderboard-snapshot-v2"],
  {
    revalidate: LEADERBOARD_REFRESH_INTERVAL_SECONDS,
    tags: ["leaderboard-snapshot"],
  },
);
