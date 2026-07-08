import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, RotateCcw, TriangleAlert as AlertTriangle, Save, CreditCard as Edit3, X, Check, LogOut, Users, Calendar, Trophy } from 'lucide-react';
import { supabase, type Match } from '../lib/supabase';
import { useRealtimeData } from '../hooks/useRealtime';
import { SPORTS, getCategories } from '../config';

interface AdminViewProps {
  onBack: () => void;
  onLogout: () => void;
}

export default function AdminView({ onBack, onLogout }: AdminViewProps) {
  const { teams, matches, refresh } = useRealtimeData();
  const [activeTab, setActiveTab] = useState<'teams' | 'matches' | 'control'>('matches');
  const [newTeamName, setNewTeamName] = useState('');

  // Match form
  const [sport, setSport] = useState<string>(SPORTS[0]);
  const [category, setCategory] = useState<string>(getCategories(SPORTS[0])[0] ?? '');
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');

  // Edit match
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editSport, setEditSport] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTeamA, setEditTeamA] = useState('');
  const [editTeamB, setEditTeamB] = useState('');
  const [editWinner, setEditWinner] = useState<'a' | 'b' | ''>('');
  const [editIsTieBreak, setEditIsTieBreak] = useState(false);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const currentCategories = getCategories(sport);

  async function addTeam() {
    if (!newTeamName.trim()) return;
    const { error } = await supabase.from('teams').insert({ name: newTeamName.trim() });
    if (error) {
      alert('Erro ao adicionar seleção: ' + error.message);
      return;
    }
    setNewTeamName('');
    refresh();
  }

  async function deleteTeam(id: string) {
    if (!confirm('Tem certeza que deseja remover esta seleção?')) return;
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) alert('Erro ao remover: ' + error.message);
    else refresh();
  }

  async function addMatch(isTieBreak: boolean) {
    if (!teamA || !teamB || teamA === teamB) {
      alert('Selecione duas seleções diferentes.');
      return;
    }
    const winnerId = teamA;
    const { error } = await supabase.from('matches').insert({
      sport,
      category,
      team_a_id: teamA,
      team_b_id: teamB,
      winner_id: winnerId,
      is_tie_break: isTieBreak,
      team_a_points: isTieBreak ? 2 : 3,
      team_b_points: isTieBreak ? 1 : 0,
    });
    if (error) {
      alert('Erro ao lançar resultado: ' + error.message);
      return;
    }
    setTeamA('');
    setTeamB('');
    refresh();
  }

  async function saveEdit() {
    if (!editingMatch || !editWinner) return;
    const winnerId = editWinner === 'a' ? editTeamA : editTeamB;
    const isTie = editIsTieBreak;
    const aPoints = isTie ? 2 : (editWinner === 'a' ? 3 : 0);
    const bPoints = isTie ? 1 : (editWinner === 'a' ? 0 : 3);

    const { error } = await supabase.from('matches').update({
      sport: editSport,
      category: editCategory,
      team_a_id: editTeamA,
      team_b_id: editTeamB,
      winner_id: winnerId,
      is_tie_break: isTie,
      team_a_points: aPoints,
      team_b_points: bPoints,
    }).eq('id', editingMatch.id);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
      return;
    }
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

  function startEdit(m: Match) {
    setEditingMatch(m);
    setEditSport(m.sport);
    setEditCategory(m.category);
    setEditTeamA(m.team_a_id);
    setEditTeamB(m.team_b_id);
    setEditWinner(m.winner_id === m.team_a_id ? 'a' : 'b');
    setEditIsTieBreak(m.is_tie_break);
  }

  const availableTeamsForB = teams.filter((t) => t.id !== teamA);
  const availableTeamsForA = teams.filter((t) => t.id !== teamB);
  const editCategories = getCategories(editSport);

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
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={() => addMatch(false)}
                  disabled={!teamA || !teamB}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  Vitória Normal (3 pts)
                </button>
                <button
                  onClick={() => addMatch(true)}
                  disabled={!teamA || !teamB}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  Vitória no Tie-Break (2 pts)
                </button>
              </div>
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
                  {matches.map((m) => (
                    <div key={m.id} className="px-4 py-3 flex items-center justify-between hover:bg-sand-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">{m.sport}</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sand-200 text-sand-800">{m.category}</span>
                          {m.is_tie_break && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Tie-Break</span>}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`font-medium ${m.winner_id === m.team_a_id ? 'text-green-700' : 'text-gray-700'}`}>{m.team_a?.name}</span>
                          <span className="text-gray-400">vs</span>
                          <span className={`font-medium ${m.winner_id === m.team_b_id ? 'text-green-700' : 'text-gray-700'}`}>{m.team_b?.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="text-right mr-2">
                          <div className="text-sm font-bold text-primary-700">{m.team_a_points} - {m.team_b_points}</div>
                        </div>
                        <button onClick={() => startEdit(m)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMatch(m.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Edit Modal */}
            {editingMatch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
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
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Vencedor</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditWinner('a')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${editWinner === 'a' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      >
                        {teams.find((t) => t.id === editTeamA)?.name}
                      </button>
                      <button
                        onClick={() => setEditWinner('b')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${editWinner === 'b' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      >
                        {teams.find((t) => t.id === editTeamB)?.name}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="edit-tie"
                      type="checkbox"
                      checked={editIsTieBreak}
                      onChange={(e) => setEditIsTieBreak(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <label htmlFor="edit-tie" className="text-sm text-gray-700">Tie-Break</label>
                  </div>
                  <button onClick={saveEdit} className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                    <Save className="w-4 h-4" />
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
            <div className="flex gap-2">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                placeholder="Nome da nova seleção"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
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
            <div className="divide-y divide-sand-100">
              {teams.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-medium">{t.name}</span>
                  <button
                    onClick={() => deleteTeam(t.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
