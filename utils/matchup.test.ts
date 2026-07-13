import { describe, expect, it } from "vitest";
import type { Company } from "@/types/company";
import { selectRandomMatchup } from "@/utils/matchup";

const companies: Company[] = [
  {
    id: "company-a",
    name: "Company A",
    logo_url: "https://thesvg.org/icons/company-a/default.svg",
    rating: 1200,
    votes_won: 0,
    total_matches: 0,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "company-b",
    name: "Company B",
    logo_url: "https://thesvg.org/icons/company-b/default.svg",
    rating: 1200,
    votes_won: 0,
    total_matches: 0,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "company-c",
    name: "Company C",
    logo_url: "https://thesvg.org/icons/company-c/default.svg",
    rating: 1200,
    votes_won: 0,
    total_matches: 0,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

describe("selectRandomMatchup", () => {
  it("returns null when fewer than two companies exist", () => {
    expect(selectRandomMatchup([])).toBeNull();
    expect(selectRandomMatchup([companies[0]])).toBeNull();
  });

  it("returns two distinct companies", () => {
    const values = [0.1, 0.1, 0.7];
    let index = 0;
    const matchup = selectRandomMatchup(companies, () => values[index++]);

    expect(matchup).not.toBeNull();
    expect(matchup?.companyA.id).toBe("company-a");
    expect(matchup?.companyB.id).toBe("company-c");
  });
});
