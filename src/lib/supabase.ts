import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Team = {
  id: string;
  name: string;
  country?: string | null;
  created_at: string;
};

export type MatchSet = {
  id: string;
  match_id: string;
  set_number: number;
  team_a_score: number;
  team_b_score: number;
  created_at: string;
};

export type Match = {
  id: string;
  sport: string;
  category: string;
  team_a_id: string;
  team_b_id: string;
  winner_id: string | null;
  is_tie_break: boolean;
  team_a_points: number;
  team_b_points: number;
  team_a_sets_won: number;
  team_b_sets_won: number;
  team_a_points_for: number;
  team_b_points_for: number;
  team_a_points_against: number;
  team_b_points_against: number;
  created_at: string;
  team_a?: Team;
  team_b?: Team;
  winner?: Team;
  match_sets?: MatchSet[];
};

export { SPORTS, getCategories } from '../config';
