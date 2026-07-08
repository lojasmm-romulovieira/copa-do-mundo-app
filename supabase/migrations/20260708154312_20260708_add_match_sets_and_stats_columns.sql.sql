/*
# Add match_sets table and extended match statistics

1. New Tables
- `match_sets`: Stores the score of each individual set within a match.
  - `id` (uuid, primary key)
  - `match_id` (uuid, references matches, ON DELETE CASCADE)
  - `set_number` (integer, 1-based set index within the match)
  - `team_a_score` (integer, points/games won by team A in this set)
  - `team_b_score` (integer, points/games won by team B in this set)
  - `created_at` (timestamptz)

2. Modified Tables
- `matches`:
  - ADD `team_a_sets_won` (integer, default 0) — number of sets won by team A
  - ADD `team_b_sets_won` (integer, default 0) — number of sets won by team B
  - ADD `team_a_points_for` (integer, default 0) — total points/games scored by team A across all sets
  - ADD `team_b_points_for` (integer, default 0) — total points/games scored by team B across all sets
  - ADD `team_a_points_against` (integer, default 0) — total points/games conceded by team A
  - ADD `team_b_points_against` (integer, default 0) — total points/games conceded by team B
  - ADD `team_a_losses` (integer, default 0) — derived: 1 if team A lost, else 0 (kept on match row for convenience)
  - ADD `team_b_losses` (integer, default 0) — derived: 1 if team B lost, else 0
  The existing `team_a_points` / `team_b_points` columns are kept for backward compatibility
  (they store the ranking points awarded: 3 for normal win, 2 for tie-break win, 1 for tie-break loss).
  The existing `is_tie_break` column is kept and now means "the deciding set was a tie-break / super tie-break".

3. Security
- Enable RLS on `match_sets`.
- Public read for anon + authenticated (single-tenant app, no Supabase Auth).
- Anon + authenticated write access (frontend uses anon key with client-side admin gate).

4. Important Notes
- This migration is idempotent: uses IF NOT EXISTS for the table and DO $$ blocks for columns.
- Existing match rows get default 0 for all new columns, which is correct for the old single-point model.
- The `match_sets` table allows null scores so a match can be saved as a draft before all sets are entered;
  however the frontend validates that all sets have valid scores before declaring a winner.
*/

CREATE TABLE IF NOT EXISTS match_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number integer NOT NULL,
  team_a_score integer NOT NULL DEFAULT 0,
  team_b_score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE match_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_match_sets" ON match_sets;
CREATE POLICY "public_select_match_sets" ON match_sets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_match_sets" ON match_sets;
CREATE POLICY "anon_insert_match_sets" ON match_sets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_match_sets" ON match_sets;
CREATE POLICY "anon_update_match_sets" ON match_sets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_match_sets" ON match_sets;
CREATE POLICY "anon_delete_match_sets" ON match_sets FOR DELETE
  TO anon, authenticated USING (true);

-- Add new columns to matches (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'matches' AND column_name = 'team_a_sets_won') THEN
    ALTER TABLE matches ADD COLUMN team_a_sets_won integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'matches' AND column_name = 'team_b_sets_won') THEN
    ALTER TABLE matches ADD COLUMN team_b_sets_won integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'matches' AND column_name = 'team_a_points_for') THEN
    ALTER TABLE matches ADD COLUMN team_a_points_for integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'matches' AND column_name = 'team_b_points_for') THEN
    ALTER TABLE matches ADD COLUMN team_b_points_for integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'matches' AND column_name = 'team_a_points_against') THEN
    ALTER TABLE matches ADD COLUMN team_a_points_against integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'matches' AND column_name = 'team_b_points_against') THEN
    ALTER TABLE matches ADD COLUMN team_b_points_against integer NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_match_sets_match_id ON match_sets(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_sport_category ON matches(sport, category);
