import { useEffect, useState } from 'react';
import { supabase, type Team, type Match } from '../lib/supabase';

export function useRealtimeData() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const [{ data: teamsData }, { data: matchesData }] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('matches').select('*, team_a:team_a_id(*), team_b:team_b_id(*), winner:winner_id(*)').order('created_at', { ascending: false }),
    ]);
    setTeams(teamsData ?? []);
    setMatches(matchesData ?? []);
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

    return () => {
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(matchesChannel);
    };
  }, []);

  return { teams, matches, loading, refresh: fetchData };
}
