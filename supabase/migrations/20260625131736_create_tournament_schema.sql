/*
# Copa do Mundo - Tournament Schema

1. New Tables
- `teams`: Stores national teams (selecoes) participating in the tournament.
  - `id` (uuid, primary key)
  - `name` (text, not null, unique)
  - `created_at` (timestamptz)
- `matches`: Stores match results.
  - `id` (uuid, primary key)
  - `sport` (text, not null) - Beach Tennis, Volei de Areia, Futevolei
  - `category` (text, not null) - Masculino, Feminino, Misto
  - `team_a_id` (uuid, references teams)
  - `team_b_id` (uuid, references teams)
  - `winner_id` (uuid, references teams, nullable)
  - `is_tie_break` (boolean, default false)
  - `team_a_points` (integer, default 0)
  - `team_b_points` (integer, default 0)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- Public read access for anon and authenticated users.
- Admin write access for authenticated users (admin login will use Supabase auth).
*/

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL,
  category text NOT NULL,
  team_a_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_b_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  winner_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  is_tie_break boolean NOT NULL DEFAULT false,
  team_a_points integer NOT NULL DEFAULT 0,
  team_b_points integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Public read policies
DROP POLICY IF EXISTS "public_select_teams" ON teams;
CREATE POLICY "public_select_teams" ON teams FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_matches" ON matches;
CREATE POLICY "public_select_matches" ON matches FOR SELECT
  TO anon, authenticated USING (true);

-- Admin write policies (authenticated can write; frontend will guard admin role)
DROP POLICY IF EXISTS "admin_insert_teams" ON teams;
CREATE POLICY "admin_insert_teams" ON teams FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_teams" ON teams;
CREATE POLICY "admin_delete_teams" ON teams FOR DELETE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_matches" ON matches;
CREATE POLICY "admin_insert_matches" ON matches FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_matches" ON matches;
CREATE POLICY "admin_update_matches" ON matches FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_matches" ON matches;
CREATE POLICY "admin_delete_matches" ON matches FOR DELETE
  TO authenticated USING (true);
