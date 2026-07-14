"use server";

import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/errors";
import { COMPANY_COLUMNS } from "@/lib/company-select";
import { getCachedLeaderboardSnapshot } from "@/lib/leaderboard";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  ActionResult,
  Company,
  LeaderboardData,
  Matchup,
  VoteRatings,
  VoteResponse,
} from "@/types/company";
import { selectRandomMatchup } from "@/utils/matchup";
import {
  getCurrentLeaderboardRefreshWindow,
  paginateLeaderboardSnapshot,
} from "@/utils/leaderboard";
import { validateVoteIds } from "@/utils/validation";

async function fetchCompanies(): Promise<ActionResult<Company[]>> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("companies")
      .select(COMPANY_COLUMNS)
      .order("name", { ascending: true });

    if (error) {
      return {
        ok: false,
        error: "Could not load companies from Supabase.",
      };
    }

    return {
      ok: true,
      data: data ?? [],
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    };
  }
}

export async function getMatchup(): Promise<ActionResult<Matchup | null>> {
  const result = await fetchCompanies();

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: selectRandomMatchup(result.data),
  };
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
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("record_company_vote", {
      winner_id: winnerId,
      loser_id: loserId,
      k_factor: 32,
    });

    if (error) {
      return {
        ok: false,
        error: "Could not record this vote.",
      };
    }

    revalidatePath("/");

    const companies = await fetchCompanies();
    const nextMatchup = companies.ok ? selectRandomMatchup(companies.data) : null;
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
