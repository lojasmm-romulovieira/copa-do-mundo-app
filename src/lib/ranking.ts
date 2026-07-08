import type { Team, Match } from './supabase';

export type RankingEntry = {
  team: Team;
  points: number;
  wins: number;
  tieBreakWins: number;
  matchesPlayed: number;
};

export function computeRanking(teams: Team[], matches: Match[], sport?: string, category?: string): RankingEntry[] {
  const map = new Map<string, RankingEntry>();
  for (const t of teams) {
    map.set(t.id, { team: t, points: 0, wins: 0, tieBreakWins: 0, matchesPlayed: 0 });
  }

  for (const m of matches) {
    if (!m.winner_id) continue;
    if (sport && m.sport !== sport) continue;
    if (category && m.category !== category) continue;

    const a = map.get(m.team_a_id);
    const b = map.get(m.team_b_id);
    if (!a || !b) continue;

    a.matchesPlayed += 1;
    b.matchesPlayed += 1;

    if (m.is_tie_break) {
      if (m.winner_id === m.team_a_id) {
        a.points += 2;
        a.tieBreakWins += 1;
        a.wins += 1;
        b.points += 1;
      } else {
        b.points += 2;
        b.tieBreakWins += 1;
        b.wins += 1;
        a.points += 1;
      }
    } else {
      if (m.winner_id === m.team_a_id) {
        a.points += 3;
        a.wins += 1;
      } else {
        b.points += 3;
        b.wins += 1;
      }
    }
  }

  return Array.from(map.values())
    .filter((r) => r.matchesPlayed > 0 || (!sport && !category))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.tieBreakWins - a.tieBreakWins;
    });
}
