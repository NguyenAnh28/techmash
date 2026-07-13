import type { Company, VoteRatings } from "@/types/company";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: CompanyInsert;
        Update: CompanyUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_company_vote: {
        Args: RecordCompanyVoteArgs;
        Returns: VoteRatings[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface CompanyInsert extends Record<string, unknown> {
  id?: string;
  name: string;
  logo_url: string;
  rating?: number;
  votes_won?: number;
  total_matches?: number;
  created_at?: string;
}

export interface CompanyUpdate extends Record<string, unknown> {
  id?: string;
  name?: string;
  logo_url?: string;
  rating?: number;
  votes_won?: number;
  total_matches?: number;
  created_at?: string;
}

export interface RecordCompanyVoteArgs extends Record<string, unknown> {
  winner_id: string;
  loser_id: string;
  k_factor?: number;
}
