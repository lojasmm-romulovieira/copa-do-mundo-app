import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, RotateCcw, TriangleAlert as AlertTriangle, Save, CreditCard as Edit3, X, Check, LogOut, Users, Calendar, Trophy } from 'lucide-react';
import { supabase, type Match } from '../lib/supabase';
import { useRealtimeData } from '../hooks/useRealtime';
import { SPORTS, getCategories } from '../config';
import { validateMatch, getSportRules, getRankingPoints, type SetScore } from '../lib/matchRules';

interface AdminViewProps {
  onBack: () => void;
  onLogout: () => void;
}

const MAX_SETS = 3;

function emptySets(): SetScore[] {
  return Array.from({ length: MAX_SETS }, () => ({ team_a: 0, team_b: 0 }));
}

export default function AdminView({ onBack, onLogout }: AdminViewProps) {
  const { teams, matches, refresh } = useRealtimeData();
  const [activeTab, setActiveTab] = useState<'teams' | 'matches' | 'control'>('matches');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCountry, setNewTeamCountry] = useState('');

  const [sport, setSport] = useState<string>(SPORTS[0]);
  const [category, setCategory] = useState<string>(getCategories(SPORTS[0])[0] ?? '');
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [sets, setSets] = useState<SetScore[]>(emptySets());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editSport, setEditSport] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTeamA, setEditTeamA] = useState('');
  const [editTeamB, setEditTeamB] = useState('');
  const [editSets, setEditSets] = useState<SetScore[]>(emptySets());
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const currentCategories = getCategories(sport);
  const currentRules = getSportRules(sport);

  async function addTeam() {
    if (!newTeamName.trim()) return;
    const { error } = await supabase.from('teams').insert({ name: newTeamName.trim(), country: newTeamCountry.trim() || null });
    if (error) {
      alert('Erro ao adicionar seleção: ' + error.message);
      return;
    }
    setNewTeamName('');
    setNewTeamCountry('');
    refresh();
  }

  async function deleteTeam(id: string) {
    if (!confirm('Tem certeza que deseja remover esta seleção?')) return;
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) alert('Erro ao remover: ' + error.message);
  }

  async function updateTeamCountry(id: string, country: string) {
    await supabase.from('teams').update({ country: country.trim() || null }).eq('id', id);
  }

  function updateSet(index: number, side: 'team_a' | 'team_b', value: string) {
    const n = Math.max(0, Math.min(99, parseInt(value, 10) || 0));
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [side]: n } : s)));
  }

  function updateEditSet(index: number, side: 'team_a' | 'team_b', value: string) {
    const n = Math.max(0, Math.min(99, parseInt(value, 10) || 0));
    setEditSets((prev) => prev.map((s, i) => (i === index ? { ...s, [side]: n } : s)));
  }

  async function addMatch() {
    setFormError('');
    if (!teamA || !teamB || teamA === teamB) {
      setFormError('Selecione duas seleções diferentes.');
      return;
    }

    const duplicate = matches.some(
      (m) =>
        m.sport === sport &&
        m.category === category &&
        ((m.team_a_id === teamA && m.team_b_id === teamB) ||
          (m.team_a_id === teamB && m.team_b_id === teamA)),
    );
    if (duplicate) {
      setFormError('Estas duas seleções já se enfrentaram nesta categoria. Cada dupla só pode jogar uma vez por categoria.');
      return;
    }

    const validation = validateMatch(sport, sets);
    if (!validation.valid || !validation.result) {
      setFormError(validation.error ?? 'Placar inválido.');
      return;
    }

    const result = validation.result;
    const winnerId = result.winner === 'a' ? teamA : teamB;
    const aRankPts = getRankingPoints(result.isTieBreak, result.winner, 'a');
    const bRankPts = getRankingPoints(result.isTieBreak, result.winner, 'b');

    setSaving(true);
    const { data: matchRow, error: matchError } = await supabase.from('matches').insert({
      sport,
      category,
      team_a_id: teamA,
      team_b_id: teamB,
      winner_id: winnerId,
      is_tie_break: result.isTieBreak,
      team_a_points: aRankPts,
      team_b_points: bRankPts,
      team_a_sets_won: result.setsWonA,
      team_b_sets_won: result.setsWonB,
      team_a_points_for: result.pointsForA,
      team_b_points_for: result.pointsForB,
      team_a_points_against: result.pointsForB,
      team_b_points_against: result.pointsForA,
    }).select('id').single();

    if (matchError || !matchRow) {
      setFormError('Erro ao lançar resultado: ' + (matchError?.message ?? 'desconhecido'));
      setSaving(false);
      return;
    }

    const setsPayload = result.sets.map((s, i) => ({
      match_id: matchRow.id,
      set_number: i + 1,
      team_a_score: s.team_a,
      team_b_score: s.team_b,
    }));

    if (setsPayload.length > 0) {
      const { error: setsError } = await supabase.from('match_sets').insert(setsPayload);
      if (setsError) {
        setFormError('Partida salva, mas erro ao salvar sets: ' + setsError.message);
        setSaving(false);
        refresh();
        return;
      }
    }

    setSaving(false);
    setTeamA('');
    setTeamB('');
    setSets(emptySets());
    refresh();
  }

  function startEdit(m: Match) {
    setEditingMatch(m);
    setEditSport(m.sport);
    setEditCategory(m.category);
    setEditTeamA(m.team_a_id);
    setEditTeamB(m.team_b_id);
    const loaded = (m.match_sets ?? [])
      .slice()
      .sort((a, b) => a.set_number - b.set_number)
      .slice(0, MAX_SETS);
    const base: SetScore[] = emptySets();
    for (let i = 0; i < loaded.length; i++) {
      base[i] = { team_a: loaded[i].team_a_score, team_b: loaded[i].team_b_score };
    }
    setEditSets(base);
    setEditError('');
  }

  async function saveEdit() {
    if (!editingMatch) return;
    setEditError('');

    if (!editTeamA || !editTeamB || editTeamA === editTeamB) {
      setEditError('Selecione duas seleções diferentes.');
      return;
    }

    const duplicateEdit = matches.some(
      (m) =>
        m.id !== editingMatch.id &&
        m.sport === editSport &&
        m.category === editCategory &&
        ((m.team_a_id === editTeamA && m.team_b_id === editTeamB) ||
          (m.team_a_id === editTeamB && m.team_b_id === editTeamA)),
    );
    if (duplicateEdit) {
      setEditError('Estas duas seleções já se enfrentaram nesta categoria. Cada dupla só pode jogar uma vez por categoria.');
      return;
    }

    const validation = validateMatch(editSport, editSets);
    if (!validation.valid || !validation.result) {
      setEditError(validation.error ?? 'Placar inválido.');
      return;
    }

    const result = validation.result;
    const winnerId = result.winner === 'a' ? editTeamA : editTeamB;
    const aRankPts = getRankingPoints(result.isTieBreak, result.winner, 'a');
    const bRankPts = getRankingPoints(result.isTieBreak, result.winner, 'b');

    setEditSaving(true);
    const { error: matchError } = await supabase.from('matches').update({
      sport: editSport,
      category: editCategory,
      team_a_id: editTeamA,
      team_b_id: editTeamB,
      winner_id: winnerId,
      is_tie_break: result.isTieBreak,
      team_a_points: aRankPts,
      team_b_points: bRankPts,
      team_a_sets_won: result.setsWonA,
      team_b_sets_won: result.setsWonB,
      team_a_points_for: result.pointsForA,
      team_b_points_for: result.pointsForB,
      team_a_points_against: result.pointsForB,
      team_b_points_against: result.pointsForA,
    }).eq('id', editingMatch.id);

    if (matchError) {
      setEditError('Erro ao salvar: ' + matchError.message);
      setEditSaving(false);
      return;
    }

    await supabase.from('match_sets').delete().eq('match_id', editingMatch.id);
    const setsPayload = result.sets.map((s, i) => ({
      match_id: editingMatch.id,
      set_number: i + 1,
      team_a_score: s.team_a,
      team_b_score: s.team_b,
    }));
    if (setsPayload.length > 0) {
      const { error: setsError } = await supabase.from('match_sets').insert(setsPayload);
      if (setsError) {
        setEditError('Partida salva, mas erro ao salvar sets: ' + setsError.message);
        setEditSaving(false);
        return;
      }
    }

    setEditSaving(false);
    setEditingMatch(null);
    refresh();
  }

  async function deleteMatch(id: string) {
    if (!confirm('Tem certeza que deseja apagar este resultado?')) return;
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) alert('Erro ao apagar: ' + error.message);
    else refresh();
  }

  async function resetTournament() {
    const { data: allMatches, error: fetchError } = await supabase.from('matches').select('id');
    if (fetchError) {
      alert('Erro ao buscar jogos: ' + fetchError.message);
      return;
    }
    if (!allMatches || allMatches.length === 0) {
      setShowResetConfirm(false);
      return;
    }
    const ids = allMatches.map((m) => m.id);
    const { error: delError } = await supabase.from('matches').delete().in('id', ids);
    if (delError) {
      alert('Erro ao zerar: ' + delError.message);
      return;
    }
    setShowResetConfirm(false);
    refresh();
  }

  const availableTeamsForB = teams.filter((t) => t.id !== teamA);
  const availableTeamsForA = teams.filter((t) => t.id !== teamB);
  const editCategories = getCategories(editSport);
  const editRules = getSportRules(editSport);

  const sportHint = currentRules
    ? currentRules.isBeachTennis
      ? `Game único até ${currentRules.pointsPerSet} games (diff ${currentRules.minDifference}). Em ${currentRules.tieBreakAt}x${currentRules.tieBreakAt} aparece o campo de tie-break (mín. ${currentRules.tieBreakPoints} com diff ${currentRules.tieBreakMinDiff}). Vitória no tie-break = 2 pts; derrota = 1 pt.`
      : `Melhor de 3 sets. Sets 1 e 2 até ${currentRules.pointsPerSet} pontos · 3º set até ${currentRules.thirdSetPoints} pontos. Vence quem ganhar 2 sets.`
    : '';

  const editHint = editRules
    ? editRules.isBeachTennis
      ? `Game único até ${editRules.pointsPerSet} games (diff ${editRules.minDifference}). Em ${editRules.tieBreakAt}x${editRules.tieBreakAt} aparece o campo de tie-break (mín. ${editRules.tieBreakPoints} com diff ${editRules.tieBreakMinDiff}). Vitória no tie-break = 2 pts; derrota = 1 pt.`
      : `Melhor de 3 sets. Sets 1 e 2 até ${editRules.pointsPerSet} pontos · 3º set até ${editRules.thirdSetPoints} pontos. Vence quem ganhar 2 sets.`
    : '';

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Header */}
      <header className="bg-primary-800 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 hover:bg-primary-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight">Painel Administrativo</h1>
              <p className="text-xs text-primary-200">Copa do Mundo</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs bg-primary-900 hover:bg-black/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'matches', label: 'Resultados', icon: Calendar },
            { key: 'teams', label: 'Seleções', icon: Users },
            { key: 'control', label: 'Controle', icon: Trophy },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-4 space-y-4">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Lançar Resultado
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Esporte</label>
                  <select
                    value={sport}
                    onChange={(e) => {
                      const newSport = e.target.value;
                      setSport(newSport);
                      const cats = getCategories(newSport);
                      setCategory(cats[0] ?? '');
                      setSets(emptySets());
                      setFormError('');
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {currentCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Seleção A</label>
                  <select value={teamA} onChange={(e) => setTeamA(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Selecione</option>
                    {availableTeamsForA.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Seleção B</label>
                  <select value={teamB} onChange={(e) => setTeamB(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Selecione</option>
                    {availableTeamsForB.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {sportHint && (
                <div className="text-xs text-primary-700 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
                  {sportHint}
                </div>
              )}

              {/* Sets input */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">
                  {currentRules?.isBeachTennis ? 'Placar do Game' : 'Placar dos Sets'}
                </label>
                {currentRules?.isBeachTennis ? (
                  <>
                    {/* Beach Tennis: game row */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 w-16">Game</span>
                      <input type="number" min={0} max={99} value={sets[0].team_a} onFocus={(e) => e.target.select()} onChange={(e) => updateSet(0, 'team_a', e.target.value)} className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-primary-500" />
                      <span className="text-gray-400 text-xs">x</span>
                      <input type="number" min={0} max={99} value={sets[0].team_b} onFocus={(e) => e.target.select()} onChange={(e) => updateSet(0, 'team_b', e.target.value)} className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    {/* Tie-break row: only visible when game is 6x6 */}
                    {sets[0].team_a === 6 && sets[0].team_b === 6 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-amber-600 w-16">Tie-Break</span>
                        <input type="number" min={0} max={99} value={sets[1].team_a} onFocus={(e) => e.target.select()} onChange={(e) => updateSet(1, 'team_a', e.target.value)} className="w-20 rounded-lg border border-amber-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-amber-400" />
                        <span className="text-gray-400 text-xs">x</span>
                        <input type="number" min={0} max={99} value={sets[1].team_b} onFocus={(e) => e.target.select()} onChange={(e) => updateSet(1, 'team_b', e.target.value)} className="w-20 rounded-lg border border-amber-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-amber-400" />
                      </div>
                    )}
                  </>
                ) : (
                  sets.slice(0, currentRules?.bestOf ?? MAX_SETS).map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 w-16">Set {i + 1}</span>
                      <input type="number" min={0} max={99} value={s.team_a} onFocus={(e) => e.target.select()} onChange={(e) => updateSet(i, 'team_a', e.target.value)} className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-primary-500" />
                      <span className="text-gray-400 text-xs">x</span>
                      <input type="number" min={0} max={99} value={s.team_b} onFocus={(e) => e.target.select()} onChange={(e) => updateSet(i, 'team_b', e.target.value)} className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  ))
                )}
              </div>

              {formError && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <button
                onClick={addMatch}
                disabled={!teamA || !teamB || saving}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trophy className="w-4 h-4" />
                )}
                Encerrar Partida
              </button>
            </div>

            {/* Match list */}
            <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-sand-200">
                <h2 className="text-base font-bold text-gray-800">Jogos Lançados</h2>
              </div>
              {matches.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">Nenhum jogo lançado.</div>
              ) : (
                <div className="divide-y divide-sand-100">
                  {matches.map((m) => {
                    const sortedSets = (m.match_sets ?? [])
                      .slice()
                      .sort((a, b) => a.set_number - b.set_number);
                    const isBeachTennis = m.sport === 'Beach Tennis';
                    const scoreLabel = isBeachTennis
                      ? sortedSets.length === 2
                        ? `Game: ${sortedSets[0].team_a_score}x${sortedSets[0].team_b_score} · TI: ${sortedSets[1].team_a_score}x${sortedSets[1].team_b_score}`
                        : sortedSets.length === 1
                          ? `Game: ${sortedSets[0].team_a_score}x${sortedSets[0].team_b_score}`
                          : ''
                      : sortedSets.map((s) => `${s.team_a_score}x${s.team_b_score}`).join(' · ');
                    return (
                      <div key={m.id} className="px-4 py-3 flex items-center justify-between hover:bg-sand-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">{m.sport}</span>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sand-200 text-sand-800">{m.category}</span>
                            {m.is_tie_break && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Tie-Break</span>}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`font-medium ${m.winner_id === m.team_a_id ? 'text-green-700' : 'text-gray-700'}`}>{m.team_a?.name}</span>
                            <span className="text-gray-400">vs</span>
                            <span className={`font-medium ${m.winner_id === m.team_b_id ? 'text-green-700' : 'text-gray-700'}`}>{m.team_b?.name}</span>
                          </div>
                          {scoreLabel && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {scoreLabel}
                              {!isBeachTennis && ` · Sets ${m.team_a_sets_won}x${m.team_b_sets_won}`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <div className="text-right mr-2">
                            <div className="text-sm font-bold text-primary-700">{m.team_a_points} - {m.team_b_points} pts</div>
                          </div>
                          <button onClick={() => startEdit(m)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteMatch(m.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Edit Modal */}
            {editingMatch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">Editar Jogo</h3>
                    <button onClick={() => setEditingMatch(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Esporte</label>
                      <select
                        value={editSport}
                        onChange={(e) => {
                          setEditSport(e.target.value);
                          const cats = getCategories(e.target.value);
                          setEditCategory(cats[0] ?? '');
                          setEditSets(emptySets());
                          setEditError('');
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                      <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                        {editCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Seleção A</label>
                      <select value={editTeamA} onChange={(e) => setEditTeamA(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Seleção B</label>
                      <select value={editTeamB} onChange={(e) => setEditTeamB(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {editHint && (
                    <div className="text-xs text-primary-700 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
                      {editHint}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600">
                      {editRules?.isBeachTennis ? 'Placar do Game' : 'Placar dos Sets'}
                    </label>
                    {editRules?.isBeachTennis ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 w-16">Game</span>
                          <input type="number" min={0} max={99} value={editSets[0].team_a} onFocus={(e) => e.target.select()} onChange={(e) => updateEditSet(0, 'team_a', e.target.value)} className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-primary-500" />
                          <span className="text-gray-400 text-xs">x</span>
                          <input type="number" min={0} max={99} value={editSets[0].team_b} onFocus={(e) => e.target.select()} onChange={(e) => updateEditSet(0, 'team_b', e.target.value)} className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        {editSets[0].team_a === 6 && editSets[0].team_b === 6 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-amber-600 w-16">Tie-Break</span>
                            <input type="number" min={0} max={99} value={editSets[1].team_a} onFocus={(e) => e.target.select()} onChange={(e) => updateEditSet(1, 'team_a', e.target.value)} className="w-20 rounded-lg border border-amber-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-amber-400" />
                            <span className="text-gray-400 text-xs">x</span>
                            <input type="number" min={0} max={99} value={editSets[1].team_b} onFocus={(e) => e.target.select()} onChange={(e) => updateEditSet(1, 'team_b', e.target.value)} className="w-20 rounded-lg border border-amber-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-amber-400" />
                          </div>
                        )}
                      </>
                    ) : (
                      editSets.slice(0, editRules?.bestOf ?? MAX_SETS).map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 w-16">Set {i + 1}</span>
                          <input type="number" min={0} max={99} value={s.team_a} onFocus={(e) => e.target.select()} onChange={(e) => updateEditSet(i, 'team_a', e.target.value)} className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-primary-500" />
                          <span className="text-gray-400 text-xs">x</span>
                          <input type="number" min={0} max={99} value={s.team_b} onFocus={(e) => e.target.select()} onChange={(e) => updateEditSet(i, 'team_b', e.target.value)} className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                      ))
                    )}
                  </div>

                  {editError && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {editError}
                    </div>
                  )}

                  <button
                    onClick={saveEdit}
                    disabled={editSaving}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {editSaving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-4 space-y-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              Gerenciar Seleções
            </h2>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                  placeholder="Nome da nova seleção"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  value={newTeamCountry}
                  onChange={(e) => setNewTeamCountry(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                  placeholder="País (ex: Brasil)"
                  className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={addTeam}
                  disabled={!newTeamName.trim()}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </div>
            <div className="divide-y divide-sand-100">
              {teams.map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-2.5">
                  <span className="text-sm font-medium flex-1 min-w-0 truncate">{t.name}</span>
                  <input
                    type="text"
                    defaultValue={t.country ?? ''}
                    onBlur={(e) => updateTeamCountry(t.id, e.target.value)}
                    placeholder="País"
                    className="w-32 rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => deleteTeam(t.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Control Tab */}
        {activeTab === 'control' && (
          <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-4 space-y-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary-600" />
              Painel de Controle
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-red-800">Zerar Todo o Torneio</h3>
                  <p className="text-xs text-red-700 mt-1">
                    Esta ação apagará todos os resultados lançados e zerará as pontuações. Não pode ser desfeita.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="mt-3 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Zerar Torneio
              </button>
            </div>

            {showResetConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Confirmar Reset</h3>
                      <p className="text-xs text-gray-500">Todos os resultados serão apagados.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={resetTournament}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
