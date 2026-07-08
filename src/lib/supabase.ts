import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Team = {
  id: string;
  name: string;
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
  created_at: string;
  team_a?: Team;
  team_b?: Team;
  winner?: Team;
};

export { SPORTS, getCategories } from '../config';
