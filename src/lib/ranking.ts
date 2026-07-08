import type { Team, Match } from './supabase';

export type RankingEntry = {
  team: Team;
  points: number;
  wins: number;
  losses: number;
  tieBreakWins: number;
  matchesPlayed: number;
  setsWon: number;
  setsLost: number;
  setsBalance: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsBalance: number;
};

export function computeRanking(teams: Team[], matches: Match[], sport?: string, category?: string): RankingEntry[] {
  const map = new Map<string, RankingEntry>();
  for (const t of teams) {
    map.set(t.id, {
      team: t,
      points: 0,
      wins: 0,
      losses: 0,
      tieBreakWins: 0,
      matchesPlayed: 0,
      setsWon: 0,
      setsLost: 0,
      setsBalance: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointsBalance: 0,
    });
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

    const aWon = m.winner_id === m.team_a_id;
    const bWon = m.winner_id === m.team_b_id;

    if (aWon) {
      a.wins += 1;
      b.losses += 1;
      if (m.is_tie_break) a.tieBreakWins += 1;
    } else if (bWon) {
      b.wins += 1;
      a.losses += 1;
      if (m.is_tie_break) b.tieBreakWins += 1;
    }

    a.points += m.team_a_points;
    b.points += m.team_b_points;

    a.setsWon += m.team_a_sets_won ?? 0;
    a.setsLost += m.team_b_sets_won ?? 0;
    b.setsWon += m.team_b_sets_won ?? 0;
    b.setsLost += m.team_a_sets_won ?? 0;

    a.pointsFor += m.team_a_points_for ?? 0;
    a.pointsAgainst += m.team_a_points_against ?? 0;
    b.pointsFor += m.team_b_points_for ?? 0;
    b.pointsAgainst += m.team_b_points_against ?? 0;
  }

  for (const r of map.values()) {
    r.setsBalance = r.setsWon - r.setsLost;
    r.pointsBalance = r.pointsFor - r.pointsAgainst;
  }

  return Array.from(map.values())
    .filter((r) => r.matchesPlayed > 0 || (!sport && !category))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.setsBalance !== a.setsBalance) return b.setsBalance - a.setsBalance;
      if (b.pointsBalance !== a.pointsBalance) return b.pointsBalance - a.pointsBalance;
      return b.tieBreakWins - a.tieBreakWins;
    });
}

export type SportTotals = {
  totalPoints: number;
  totalWins: number;
  totalMatches: number;
  totalSets: number;
};

export function computeTotals(matches: Match[], sport?: string, category?: string): SportTotals {
  let totalPoints = 0;
  let totalWins = 0;
  let totalMatches = 0;
  let totalSets = 0;

  for (const m of matches) {
    if (!m.winner_id) continue;
    if (sport && m.sport !== sport) continue;
    if (category && m.category !== category) continue;

    totalMatches += 1;
    totalPoints += (m.team_a_points ?? 0) + (m.team_b_points ?? 0);
    totalWins += 1;
    totalSets += (m.team_a_sets_won ?? 0) + (m.team_b_sets_won ?? 0);
  }

  return { totalPoints, totalWins, totalMatches, totalSets };
}
