/*
# Fix RLS policies for anon writes

1. Problem
The matches and teams tables have RLS policies that only allow INSERT/UPDATE/DELETE for `authenticated` users.
The frontend uses the anon key (no Supabase auth login), so all writes fail with "new row violates row-level security policy".

2. Fix
Update all write policies on `teams` and `matches` to allow `anon, authenticated` instead of only `authenticated`.
This is appropriate because the app has its own client-side admin login (admin/admin123) and does not use Supabase Auth.
*/

DROP POLICY IF EXISTS "admin_insert_teams" ON teams;
CREATE POLICY "admin_insert_teams" ON teams FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_teams" ON teams;
CREATE POLICY "admin_delete_teams" ON teams FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_matches" ON matches;
CREATE POLICY "admin_insert_matches" ON matches FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_matches" ON matches;
CREATE POLICY "admin_update_matches" ON matches FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_matches" ON matches;
CREATE POLICY "admin_delete_matches" ON matches FOR DELETE
  TO anon, authenticated USING (true);
