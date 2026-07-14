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
      analytics_events: {
        Row: AnalyticsEvent;
        Insert: AnalyticsEventInsert;
        Update: AnalyticsEventUpdate;
        Relationships: [];
      };
      companies: {
        Row: Company;
        Insert: CompanyInsert;
        Update: CompanyUpdate;
        Relationships: [];
      };
      leaderboard_snapshots: {
        Row: LeaderboardSnapshotRow;
        Insert: LeaderboardSnapshotInsert;
        Update: LeaderboardSnapshotUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_random_matchup: {
        Args: Record<string, never>;
        Returns: Company[];
      };
      record_company_vote: {
        Args: RecordCompanyVoteArgs;
        Returns: VoteRatings[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface AnalyticsEvent extends Record<string, unknown> {
  id: string;
  event_type: string;
  path: string | null;
  session_id: string | null;
  metadata: Json;
  created_at: string;
}

export interface AnalyticsEventInsert extends Record<string, unknown> {
  id?: string;
  event_type: string;
  path?: string | null;
  session_id?: string | null;
  metadata?: Json;
  created_at?: string;
}

export interface AnalyticsEventUpdate extends Record<string, unknown> {
  id?: string;
  event_type?: string;
  path?: string | null;
  session_id?: string | null;
  metadata?: Json;
  created_at?: string;
}

export interface CompanyInsert extends Record<string, unknown> {
  id?: string;
  name: string;
  domain?: string | null;
  logo_domain?: string | null;
  logo_background?: string | null;
  hourly_pay?: number | null;
  num_submits?: number | null;
  housing_perk?: string | null;
  signature_perk?: string | null;
  rating?: number;
  votes_won?: number;
  total_matches?: number;
  created_at?: string;
}

export interface CompanyUpdate extends Record<string, unknown> {
  id?: string;
  name?: string;
  domain?: string | null;
  logo_domain?: string | null;
  logo_background?: string | null;
  hourly_pay?: number | null;
  num_submits?: number | null;
  housing_perk?: string | null;
  signature_perk?: string | null;
  rating?: number;
  votes_won?: number;
  total_matches?: number;
  created_at?: string;
}

export interface LeaderboardSnapshotRow extends Record<string, unknown> {
  window_start: string;
  rankings: Json;
  total_count: number;
  created_at: string;
}

export interface LeaderboardSnapshotInsert extends Record<string, unknown> {
  window_start: string;
  rankings: Json;
  total_count: number;
  created_at?: string;
}

export interface LeaderboardSnapshotUpdate extends Record<string, unknown> {
  window_start?: string;
  rankings?: Json;
  total_count?: number;
  created_at?: string;
}

export interface RecordCompanyVoteArgs extends Record<string, unknown> {
  winner_id: string;
  loser_id: string;
  k_factor?: number;
}
