import "server-only";

import { unstable_cache } from "next/cache";
import { COMPANY_COLUMNS } from "@/lib/company-select";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { LeaderboardCompany } from "@/types/company";
import type { Json } from "@/types/database";
import {
  annotateLeaderboardRanks,
  createLeaderboardRankings,
  LEADERBOARD_REFRESH_INTERVAL_SECONDS,
  type LeaderboardRankings,
} from "@/utils/leaderboard";

interface LeaderboardSnapshot {
  companies: LeaderboardCompany[];
  lastRefreshedAt: string;
}

function parseLeaderboardRankings(rankings: Json | undefined) {
  if (!rankings || Array.isArray(rankings) || typeof rankings !== "object") {
    return null;
  }

  return Object.entries(rankings).reduce<LeaderboardRankings>(
    (parsedRankings, [companyId, rank]) => {
      if (typeof rank === "number" && Number.isFinite(rank)) {
        parsedRankings[companyId] = rank;
      }

      return parsedRankings;
    },
    {},
  );
}

async function fetchPreviousRankings(lastRefreshedAt: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leaderboard_snapshots")
    .select("rankings")
    .lt("window_start", lastRefreshedAt)
    .order("window_start", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error("Could not load the previous leaderboard snapshot.");
  }

  return parseLeaderboardRankings(data?.[0]?.rankings);
}

async function saveCurrentRankings(
  lastRefreshedAt: string,
  rankings: LeaderboardRankings,
  totalCount: number,
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("leaderboard_snapshots")
    .upsert({
      window_start: lastRefreshedAt,
      rankings,
      total_count: totalCount,
    });

  if (error) {
    throw new Error("Could not save the leaderboard snapshot.");
  }
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

  const companies = data ?? [];
  const previousRankings = await fetchPreviousRankings(lastRefreshedAt);
  const annotatedCompanies = annotateLeaderboardRanks(
    companies,
    previousRankings,
  );
  const currentRankings = createLeaderboardRankings(companies);

  await saveCurrentRankings(
    lastRefreshedAt,
    currentRankings,
    companies.length,
  );

  return {
    companies: annotatedCompanies,
    lastRefreshedAt,
  };
}

export const getCachedLeaderboardSnapshot = unstable_cache(
  fetchLeaderboardSnapshot,
  ["leaderboard-snapshot-v3"],
  {
    revalidate: LEADERBOARD_REFRESH_INTERVAL_SECONDS,
    tags: ["leaderboard-snapshot"],
  },
);
