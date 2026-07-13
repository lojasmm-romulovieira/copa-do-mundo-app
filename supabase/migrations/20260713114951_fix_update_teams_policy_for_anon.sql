DROP POLICY IF EXISTS "admin_update_teams" ON teams;
CREATE POLICY "admin_update_teams" ON teams FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
