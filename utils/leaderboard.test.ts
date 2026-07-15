import { describe, expect, it } from "vitest";
import type { Company } from "@/types/company";
import {
  annotateLeaderboardRanks,
  createLeaderboardRankings,
  filterLeaderboardCompanies,
  getCurrentLeaderboardRefreshWindow,
  getLeaderboardRefreshMetadata,
  normalizeLeaderboardSortOption,
  paginateLeaderboardSnapshot,
  sortLeaderboardCompanies,
} from "@/utils/leaderboard";

function createCompany(index: number, overrides: Partial<Company> = {}): Company {
  return {
    id: `company-${index}`,
    name: `Company ${index}`,
    domain: `company-${index}.com`,
    logo_domain: null,
    logo_background: null,
    hourly_pay: 50 + index,
    num_submits: index,
    housing_perk: "San Francisco, CA",
    signature_perk: "Software Engineer internship",
    rating: 1200 + index,
    votes_won: index,
    total_matches: index + 1,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getLeaderboardRefreshMetadata", () => {
  it("calculates the next refresh timestamp from the refresh interval", () => {
    expect(
      getLeaderboardRefreshMetadata("2026-01-01T00:00:00.000Z", 300),
    ).toEqual({
      lastRefreshedAt: "2026-01-01T00:00:00.000Z",
      nextRefreshAt: "2026-01-01T00:05:00.000Z",
      refreshIntervalSeconds: 300,
      refreshTimeZone: "America/Los_Angeles",
    });
  });
});

describe("getCurrentLeaderboardRefreshWindow", () => {
  it("rounds the current time down to the active global five-minute window", () => {
    expect(
      getCurrentLeaderboardRefreshWindow(
        new Date("2026-01-01T07:24:59.999Z"),
        300,
      ),
    ).toEqual({
      lastRefreshedAt: "2026-01-01T07:20:00.000Z",
      nextRefreshAt: "2026-01-01T07:25:00.000Z",
      refreshIntervalSeconds: 300,
      refreshTimeZone: "America/Los_Angeles",
    });
  });
});

describe("paginateLeaderboardSnapshot", () => {
  it("returns one page from the cached full leaderboard snapshot", () => {
    const companies = annotateLeaderboardRanks(
      Array.from({ length: 45 }, (_, index) => createCompany(index + 1)),
      null,
    );

    const page = paginateLeaderboardSnapshot(
      companies,
      "2026-01-01T00:00:00.000Z",
      2,
      20,
    );

    expect(page.companies).toHaveLength(20);
    expect(page.companies[0].id).toBe("company-21");
    expect(page.page).toBe(2);
    expect(page.pageSize).toBe(20);
    expect(page.totalCount).toBe(45);
    expect(page.totalCompanyCount).toBe(45);
    expect(page.totalPages).toBe(3);
    expect(page.allCompanies).toHaveLength(45);
    expect(page.sort).toBe("elo");
    expect(page.query).toBe("");
    expect(page.nextRefreshAt).toBe("2026-01-01T00:05:00.000Z");
  });

  it("clamps invalid page requests to the available page range", () => {
    const companies = annotateLeaderboardRanks(
      Array.from({ length: 4 }, (_, index) => createCompany(index + 1)),
      null,
    );

    const page = paginateLeaderboardSnapshot(
      companies,
      "2026-01-01T00:00:00.000Z",
      99,
      2,
    );

    expect(page.page).toBe(2);
    expect(page.companies.map((company) => company.id)).toEqual([
      "company-3",
      "company-4",
    ]);
  });

  it("filters before sorting and paginating leaderboard results", () => {
    const companies = annotateLeaderboardRanks(
      [
        createCompany(1, {
          name: "OpenAI",
          hourly_pay: 10,
        }),
        createCompany(2, {
          name: "AI Lab",
          hourly_pay: 100,
        }),
        createCompany(3, {
          name: "Meta",
          hourly_pay: 200,
        }),
      ],
      null,
    );

    const page = paginateLeaderboardSnapshot(
      companies,
      "2026-01-01T00:00:00.000Z",
      1,
      1,
      {
        query: "ai",
        sort: "salary",
      },
    );

    expect(page.companies.map((company) => company.name)).toEqual(["AI Lab"]);
    expect(page.totalCompanyCount).toBe(3);
    expect(page.totalCount).toBe(2);
    expect(page.totalPages).toBe(2);
    expect(page.sort).toBe("salary");
    expect(page.query).toBe("ai");
  });
});

describe("normalizeLeaderboardSortOption", () => {
  it("falls back to Elo sorting for invalid sort values", () => {
    expect(normalizeLeaderboardSortOption("not-real")).toBe("elo");
  });
});

describe("sortLeaderboardCompanies", () => {
  it("preserves official Elo order by default", () => {
    const companies = annotateLeaderboardRanks(
      [
        createCompany(1, { rating: 1500 }),
        createCompany(2, { rating: 1400 }),
        createCompany(3, { rating: 1300 }),
      ],
      null,
    );

    expect(
      sortLeaderboardCompanies(companies).companies.map((company) => company.id),
    ).toEqual(["company-1", "company-2", "company-3"]);
  });

  it("sorts salary descending and places missing salaries last", () => {
    const companies = annotateLeaderboardRanks(
      [
        createCompany(1, {
          name: "Null Rank One",
          hourly_pay: null,
        }),
        createCompany(2, {
          name: "Highest Salary",
          hourly_pay: 100,
        }),
        createCompany(3, {
          name: "Null Rank Three",
          hourly_pay: null,
        }),
        createCompany(4, {
          name: "Middle Salary",
          hourly_pay: 50,
        }),
      ],
      null,
    );

    expect(
      sortLeaderboardCompanies(companies, "salary").companies.map(
        (company) => company.name,
      ),
    ).toEqual([
      "Highest Salary",
      "Middle Salary",
      "Null Rank One",
      "Null Rank Three",
    ]);
  });

  it("sorts win rate descending and treats zero matches as zero percent", () => {
    const companies = annotateLeaderboardRanks(
      [
        createCompany(1, {
          name: "Half",
          votes_won: 1,
          total_matches: 2,
        }),
        createCompany(2, {
          name: "Three Quarters",
          votes_won: 3,
          total_matches: 4,
        }),
        createCompany(3, {
          name: "No Matches",
          votes_won: 0,
          total_matches: 0,
        }),
      ],
      null,
    );

    expect(
      sortLeaderboardCompanies(companies, "win-rate").companies.map(
        (company) => company.name,
      ),
    ).toEqual(["Three Quarters", "Half", "No Matches"]);
  });

  it("sorts matches completed descending", () => {
    const companies = annotateLeaderboardRanks(
      [
        createCompany(1, {
          name: "Three Matches",
          total_matches: 3,
        }),
        createCompany(2, {
          name: "Ten Matches",
          total_matches: 10,
        }),
        createCompany(3, {
          name: "No Matches",
          total_matches: 0,
        }),
      ],
      null,
    );

    expect(
      sortLeaderboardCompanies(companies, "matches").companies.map(
        (company) => company.name,
      ),
    ).toEqual(["Ten Matches", "Three Matches", "No Matches"]);
  });

  it("breaks ties by official Elo rank and then normalized name", () => {
    const companies = annotateLeaderboardRanks(
      [
        createCompany(1, {
          name: "Beta",
          hourly_pay: 75,
        }),
        createCompany(2, {
          name: "Alpha",
          hourly_pay: 75,
        }),
        createCompany(3, {
          name: "Charlie",
          hourly_pay: 75,
        }),
      ],
      null,
    );
    const duplicateRankCompanies = companies.map((company) => ({
      ...company,
      rank: 1,
    }));

    expect(
      sortLeaderboardCompanies(duplicateRankCompanies, "salary").companies.map(
        (company) => company.name,
      ),
    ).toEqual(["Alpha", "Beta", "Charlie"]);
  });
});

describe("filterLeaderboardCompanies", () => {
  const rankedCompanies = annotateLeaderboardRanks(
    [
      {
        ...createCompany(1),
        name: "OpenAI",
      },
      {
        ...createCompany(2),
        name: "Vercel",
      },
      {
        ...createCompany(3),
        name: "Google",
      },
    ],
    null,
  );

  it("returns every company for an empty query", () => {
    expect(filterLeaderboardCompanies(rankedCompanies, "   ")).toEqual(
      rankedCompanies,
    );
  });

  it("matches company names case-insensitively and partially", () => {
    expect(
      filterLeaderboardCompanies(rankedCompanies, "OO").map((company) => ({
        name: company.name,
        rank: company.rank,
      })),
    ).toEqual([
      {
        name: "Google",
        rank: 3,
      },
    ]);
  });

  it("returns an empty list when no company matches", () => {
    expect(filterLeaderboardCompanies(rankedCompanies, "stripe")).toEqual([]);
  });
});

describe("createLeaderboardRankings", () => {
  it("maps company ids to one-based ranks", () => {
    expect(
      createLeaderboardRankings([
        createCompany(10),
        createCompany(20),
      ]),
    ).toEqual({
      "company-10": 1,
      "company-20": 2,
    });
  });
});

describe("annotateLeaderboardRanks", () => {
  it("marks companies that moved up, moved down, stayed still, or are new", () => {
    const companies = [
      createCompany(3),
      createCompany(1),
      createCompany(2),
      createCompany(4),
    ];
    const previousRankings = {
      "company-1": 1,
      "company-2": 3,
      "company-3": 4,
    };

    expect(
      annotateLeaderboardRanks(companies, previousRankings).map((company) => ({
        id: company.id,
        rank: company.rank,
        previousRank: company.previousRank,
        rankDelta: company.rankDelta,
      })),
    ).toEqual([
      {
        id: "company-3",
        rank: 1,
        previousRank: 4,
        rankDelta: 3,
      },
      {
        id: "company-1",
        rank: 2,
        previousRank: 1,
        rankDelta: -1,
      },
      {
        id: "company-2",
        rank: 3,
        previousRank: 3,
        rankDelta: 0,
      },
      {
        id: "company-4",
        rank: 4,
        previousRank: null,
        rankDelta: null,
      },
    ]);
  });
});
