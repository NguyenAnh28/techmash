import { describe, expect, it } from "vitest";
import type { Company } from "@/types/company";
import { selectRandomMatchup } from "@/utils/matchup";

const companies: Company[] = [
  {
    id: "company-a",
    name: "Company A",
    domain: "company-a.com",
    logo_domain: null,
    logo_background: null,
    hourly_pay: 50,
    num_submits: 3,
    housing_perk: "Relocation to Test City, CA",
    signature_perk: "Software Engineer division role assignment",
    rating: 1200,
    votes_won: 0,
    total_matches: 0,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "company-b",
    name: "Company B",
    domain: "company-b.com",
    logo_domain: null,
    logo_background: null,
    hourly_pay: 52,
    num_submits: 4,
    housing_perk: "Relocation to Example, NY",
    signature_perk: "Product Engineer division role assignment",
    rating: 1200,
    votes_won: 0,
    total_matches: 0,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "company-c",
    name: "Company C",
    domain: "company-c.com",
    logo_domain: null,
    logo_background: null,
    hourly_pay: 54,
    num_submits: 5,
    housing_perk: "Relocation to Sample, WA",
    signature_perk: "Infrastructure Engineer division role assignment",
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
