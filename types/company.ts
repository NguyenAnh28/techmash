export interface Company extends Record<string, unknown> {
  id: string;
  name: string;
  domain: string | null;
  logo_domain: string | null;
  logo_background: string | null;
  hourly_pay: number | null;
  num_submits: number | null;
  housing_perk: string | null;
  signature_perk: string | null;
  rating: number;
  votes_won: number;
  total_matches: number;
  created_at: string;
}

export interface LeaderboardCompany extends Company {
  rank: number;
  previousRank: number | null;
  rankDelta: number | null;
}

export interface Matchup {
  companyA: Company;
  companyB: Company;
}

export interface VoteRatings extends Record<string, unknown> {
  winner_new_rating: number;
  loser_new_rating: number;
}

export interface VoteResponse {
  ratings: VoteRatings | null;
  nextMatchup: Matchup | null;
}

export interface LeaderboardData {
  companies: LeaderboardCompany[];
  allCompanies: LeaderboardCompany[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  lastRefreshedAt: string;
  nextRefreshAt: string;
  refreshIntervalSeconds: number;
  refreshTimeZone: string;
}

export type ActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };
