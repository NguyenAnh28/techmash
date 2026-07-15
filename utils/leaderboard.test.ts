import { describe, expect, it } from "vitest";
import type { Company } from "@/types/company";
import {
  annotateLeaderboardRanks,
  createLeaderboardRankings,
  filterLeaderboardCompanies,
  getCurrentLeaderboardRefreshWindow,
  getLeaderboardRefreshMetadata,
  paginateLeaderboardSnapshot,
} from "@/utils/leaderboard";

function createCompany(index: number): Company {
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
    expect(page.totalPages).toBe(3);
    expect(page.allCompanies).toHaveLength(45);
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
