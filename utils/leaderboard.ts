import type {
  Company,
  LeaderboardCompany,
  LeaderboardData,
  LeaderboardSortOption,
} from "@/types/company";

export const LEADERBOARD_REFRESH_INTERVAL_SECONDS = 300;
export const LEADERBOARD_REFRESH_TIME_ZONE = "America/Los_Angeles";
export const LEADERBOARD_SORT_OPTIONS: LeaderboardSortOption[] = [
  "elo",
  "salary",
  "win-rate",
  "matches",
];

interface LeaderboardSortRecord {
  company: LeaderboardCompany;
  eloRank: number;
  salarySortValue: number;
  winRateSortValue: number;
  matchesSortValue: number;
  normalizedName: string;
}

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

export function normalizeLeaderboardSortOption(
  sort: string | string[] | undefined,
): LeaderboardSortOption {
  const value = Array.isArray(sort) ? sort[0] : sort;

  return LEADERBOARD_SORT_OPTIONS.includes(value as LeaderboardSortOption)
    ? (value as LeaderboardSortOption)
    : "elo";
}

function normalizeLeaderboardQuery(query: string | string[] | undefined) {
  const value = Array.isArray(query) ? query[0] : query;
  return value?.trim() ?? "";
}

function compareNumbersDescending(first: number, second: number) {
  if (first > second) {
    return -1;
  }

  if (first < second) {
    return 1;
  }

  return 0;
}

function compareNamesAscending(first: string, second: string) {
  if (first < second) {
    return -1;
  }

  if (first > second) {
    return 1;
  }

  return 0;
}

function compareByOfficialEloRank(
  first: LeaderboardSortRecord,
  second: LeaderboardSortRecord,
) {
  if (first.eloRank < second.eloRank) {
    return -1;
  }

  if (first.eloRank > second.eloRank) {
    return 1;
  }

  return compareNamesAscending(first.normalizedName, second.normalizedName);
}

function createLeaderboardSortRecord(
  company: LeaderboardCompany,
): LeaderboardSortRecord {
  const winRateSortValue =
    company.total_matches > 0 ? company.votes_won / company.total_matches : 0;

  return {
    company,
    eloRank: company.rank,
    salarySortValue: company.hourly_pay ?? Number.NEGATIVE_INFINITY,
    winRateSortValue,
    matchesSortValue: company.total_matches,
    normalizedName: company.name.toLowerCase(),
  };
}

export function sortLeaderboardCompanies(
  companies: LeaderboardCompany[],
  sort: string | string[] | undefined = "elo",
  query: string | string[] | undefined = "",
) {
  const normalizedSort = normalizeLeaderboardSortOption(sort);
  const normalizedQuery = normalizeLeaderboardQuery(query);
  const filteredCompanies = filterLeaderboardCompanies(
    companies,
    normalizedQuery,
  );
  const sortRecords = filteredCompanies.map(createLeaderboardSortRecord);

  if (normalizedSort === "salary") {
    sortRecords.sort((first, second) => {
      const salarySort = compareNumbersDescending(
        first.salarySortValue,
        second.salarySortValue,
      );

      return salarySort || compareByOfficialEloRank(first, second);
    });
  } else if (normalizedSort === "win-rate") {
    sortRecords.sort((first, second) => {
      const winRateSort = compareNumbersDescending(
        first.winRateSortValue,
        second.winRateSortValue,
      );

      return winRateSort || compareByOfficialEloRank(first, second);
    });
  } else if (normalizedSort === "matches") {
    sortRecords.sort((first, second) => {
      const matchesSort = compareNumbersDescending(
        first.matchesSortValue,
        second.matchesSortValue,
      );

      return matchesSort || compareByOfficialEloRank(first, second);
    });
  }

  return {
    companies: sortRecords.map((record) => record.company),
    query: normalizedQuery,
    sort: normalizedSort,
    totalCompanyCount: companies.length,
    totalCount: sortRecords.length,
  };
}

export function paginateLeaderboardSnapshot(
  companies: LeaderboardCompany[],
  lastRefreshedAt: string,
  page = 1,
  pageSize = 20,
  options: {
    sort?: string | string[];
    query?: string | string[];
  } = {},
): LeaderboardData {
  const sanitizedPageSize = Number.isFinite(pageSize)
    ? Math.min(Math.max(Math.floor(pageSize), 1), 100)
    : 20;
  const requestedPage = Number.isFinite(page) ? Math.floor(page) : 1;
  const sortedLeaderboard = sortLeaderboardCompanies(
    companies,
    options.sort,
    options.query,
  );
  const totalCount = sortedLeaderboard.totalCount;
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / sanitizedPageSize),
  );
  const sanitizedPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const from = (sanitizedPage - 1) * sanitizedPageSize;
  const to = from + sanitizedPageSize;

  return {
    companies: sortedLeaderboard.companies.slice(from, to),
    allCompanies: sortedLeaderboard.companies,
    page: sanitizedPage,
    pageSize: sanitizedPageSize,
    totalCount,
    totalCompanyCount: sortedLeaderboard.totalCompanyCount,
    totalPages,
    sort: sortedLeaderboard.sort,
    query: sortedLeaderboard.query,
    ...getLeaderboardRefreshMetadata(lastRefreshedAt),
  };
}
