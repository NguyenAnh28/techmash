export interface Company extends Record<string, unknown> {
  id: string;
  name: string;
  logo_url: string;
  rating: number;
  votes_won: number;
  total_matches: number;
  created_at: string;
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

export type ActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };
