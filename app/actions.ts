"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/errors";
import { getCachedLeaderboardSnapshot } from "@/lib/leaderboard";
import { enforceVoteRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  ActionResult,
  LeaderboardData,
  Matchup,
  VoteRatings,
  VoteResponse,
} from "@/types/company";
import { createMatchupFromCompanies } from "@/utils/matchup";
import {
  getCurrentLeaderboardRefreshWindow,
  paginateLeaderboardSnapshot,
} from "@/utils/leaderboard";
import { validateVoteIds } from "@/utils/validation";
import { getVoteDatabaseErrorMessage } from "@/utils/vote-errors";

async function getRequestRateLimitKey() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();

  return forwardedIp || realIp || "unknown";
}

async function fetchRandomMatchup(): Promise<ActionResult<Matchup | null>> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("get_random_matchup");

    if (error) {
      return {
        ok: false,
        error: "Could not load a matchup from Supabase.",
      };
    }

    return {
      ok: true,
      data: createMatchupFromCompanies(data ?? []),
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    };
  }
}

export async function getMatchup(): Promise<ActionResult<Matchup | null>> {
  return fetchRandomMatchup();
}

export async function getLeaderboard(
  page = 1,
  pageSize = 20,
): Promise<ActionResult<LeaderboardData>> {
  try {
    const refreshWindow = getCurrentLeaderboardRefreshWindow();
    const snapshot = await getCachedLeaderboardSnapshot(
      refreshWindow.lastRefreshedAt,
    );

    return {
      ok: true,
      data: paginateLeaderboardSnapshot(
        snapshot.companies,
        refreshWindow.lastRefreshedAt,
        page,
        pageSize,
      ),
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    };
  }
}

export async function castVote(
  winnerId: string,
  loserId: string,
): Promise<ActionResult<VoteResponse>> {
  const validationError = validateVoteIds(winnerId, loserId);

  if (validationError) {
    return {
      ok: false,
      error: validationError,
    };
  }

  try {
    const rateLimit = await enforceVoteRateLimit(await getRequestRateLimitKey());

    if (!rateLimit.ok) {
      return {
        ok: false,
        error: rateLimit.error ?? "Too many vote attempts. Please try again.",
      };
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("record_company_vote", {
      winner_id: winnerId,
      loser_id: loserId,
      k_factor: 32,
    });

    if (error) {
      return {
        ok: false,
        error: getVoteDatabaseErrorMessage(error),
      };
    }

    revalidatePath("/");

    const matchup = await fetchRandomMatchup();
    const nextMatchup = matchup.ok ? matchup.data : null;
    const ratings: VoteRatings | null = data?.[0] ?? null;

    return {
      ok: true,
      data: {
        ratings,
        nextMatchup,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    };
  }
}
