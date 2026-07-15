import type {
  Company,
  LeaderboardCompany,
  LeaderboardData,
} from "@/types/company";

export const LEADERBOARD_REFRESH_INTERVAL_SECONDS = 300;
export const LEADERBOARD_REFRESH_TIME_ZONE = "America/Los_Angeles";

export function getCurrentLeaderboardRefreshWindow(
  now = new Date(),
  refreshIntervalSeconds = LEADERBOARD_REFRESH_INTERVAL_SECONDS,
) {
  const nowMs = now.getTime();

  if (!Number.isFinite(nowMs)) {
    throw new Error("now must be a valid date.");
  }

  const intervalMs = refreshIntervalSeconds * 1000;
  const windowStartMs = Math.floor(nowMs / intervalMs) * intervalMs;
  const lastRefreshedAt = new Date(windowStartMs).toISOString();

  return getLeaderboardRefreshMetadata(
    lastRefreshedAt,
    refreshIntervalSeconds,
  );
}

export function getLeaderboardRefreshMetadata(
  lastRefreshedAt: string,
  refreshIntervalSeconds = LEADERBOARD_REFRESH_INTERVAL_SECONDS,
) {
  const refreshedAtMs = new Date(lastRefreshedAt).getTime();

  if (!Number.isFinite(refreshedAtMs)) {
    throw new Error("lastRefreshedAt must be a valid date string.");
  }

  const nextRefreshAt = new Date(
    refreshedAtMs + refreshIntervalSeconds * 1000,
  ).toISOString();

  return {
    lastRefreshedAt,
    nextRefreshAt,
    refreshIntervalSeconds,
    refreshTimeZone: LEADERBOARD_REFRESH_TIME_ZONE,
  };
}

export type LeaderboardRankings = Record<string, number>;

export function createLeaderboardRankings(
  companies: Pick<Company, "id">[],
): LeaderboardRankings {
  return companies.reduce<LeaderboardRankings>((rankings, company, index) => {
    rankings[company.id] = index + 1;
    return rankings;
  }, {});
}

export function annotateLeaderboardRanks(
  companies: Company[],
  previousRankings: LeaderboardRankings | null,
): LeaderboardCompany[] {
  return companies.map((company, index) => {
    const rank = index + 1;
    const previousRank = previousRankings?.[company.id] ?? null;
    const rankDelta =
      previousRank === null ? null : previousRank - rank;

    return {
      ...company,
      rank,
      previousRank,
      rankDelta,
    };
  });
}

export function filterLeaderboardCompanies(
  companies: LeaderboardCompany[],
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return companies;
  }

  return companies.filter((company) =>
    company.name.toLowerCase().includes(normalizedQuery),
  );
}

export function paginateLeaderboardSnapshot(
  companies: LeaderboardCompany[],
  lastRefreshedAt: string,
  page = 1,
  pageSize = 20,
): LeaderboardData {
  const sanitizedPageSize = Number.isFinite(pageSize)
    ? Math.min(Math.max(Math.floor(pageSize), 1), 100)
    : 20;
  const requestedPage = Number.isFinite(page) ? Math.floor(page) : 1;
  const totalCount = companies.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / sanitizedPageSize),
  );
  const sanitizedPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const from = (sanitizedPage - 1) * sanitizedPageSize;
  const to = from + sanitizedPageSize;

  return {
    companies: companies.slice(from, to),
    allCompanies: companies,
    page: sanitizedPage,
    pageSize: sanitizedPageSize,
    totalCount,
    totalPages,
    ...getLeaderboardRefreshMetadata(lastRefreshedAt),
  };
}
