/*
# Add match_date column to matches

1. Modified Tables
- `matches`:
  - ADD `match_date` (date, nullable) — the calendar date when the match took place.
    Nullable so existing rows don't break; backfilled below per sport.

2. Data Backfill
- Beach Tennis matches already in the database -> match_date = '2026-07-11'.
- Vôlei de Areia and Futevôlei matches -> match_date = '2026-07-12'.
- Any future match will have its date set by the admin UI (defaults to today).

3. Security
- No policy changes. Existing RLS policies on `matches` already allow
  anon/authenticated read and authenticated write, which covers the new column.

4. Important Notes
- Idempotent: uses a DO $$ block to add the column only if it doesn't exist.
- Backfill uses UPDATE statements that are safe to re-run (they only set
  match_date where it is currently null).
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'matches' AND column_name = 'match_date') THEN
    ALTER TABLE matches ADD COLUMN match_date date;
  END IF;
END $$;

-- Backfill existing Beach Tennis matches to 2026-07-11
UPDATE matches
SET match_date = '2026-07-11'
WHERE sport = 'Beach Tennis' AND match_date IS NULL;

-- Backfill existing Vôlei de Areia and Futevôlei matches to 2026-07-12
UPDATE matches
SET match_date = '2026-07-12'
WHERE sport IN ('Vôlei de Areia', 'Futevôlei') AND match_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date);
