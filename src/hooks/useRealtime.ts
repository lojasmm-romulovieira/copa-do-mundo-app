import { useEffect, useState } from 'react';
import { supabase, type Team, type Match, type MatchSet } from '../lib/supabase';

export function useRealtimeData() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchSets, setMatchSets] = useState<MatchSet[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const [{ data: teamsData }, { data: matchesData }, { data: setsData }] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('matches').select('*, team_a:team_a_id(*), team_b:team_b_id(*), winner:winner_id(*)').order('created_at', { ascending: false }),
      supabase.from('match_sets').select('*').order('set_number', { ascending: true }),
    ]);

    const setsByMatch = new Map<string, MatchSet[]>();
    for (const s of setsData ?? []) {
      const arr = setsByMatch.get(s.match_id) ?? [];
      arr.push(s);
      setsByMatch.set(s.match_id, arr);
    }

    const enriched = (matchesData ?? []).map((m) => ({
      ...m,
      match_sets: setsByMatch.get(m.id) ?? [],
    }));

    setTeams(teamsData ?? []);
    setMatches(enriched);
    setMatchSets(setsData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();

    const teamsChannel = supabase.channel('teams-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchData)
      .subscribe();

    const matchesChannel = supabase.channel('matches-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchData)
      .subscribe();

    const setsChannel = supabase.channel('match-sets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_sets' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(setsChannel);
    };
  }, []);

  return { teams, matches, matchSets, loading, refresh: fetchData };
}
