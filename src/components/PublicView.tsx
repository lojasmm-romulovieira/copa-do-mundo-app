import { useState } from 'react';
import { Trophy, ListFilter as Filter, Shield, ChevronDown, ChevronUp, Target, Award, Activity, Layers } from 'lucide-react';
import { useRealtimeData } from '../hooks/useRealtime';
import { computeRanking, computeTotals } from '../lib/ranking';
import { SPORTS, getCategories } from '../config';

interface PublicViewProps {
  onAdminClick: () => void;
}

export default function PublicView({ onAdminClick }: PublicViewProps) {
  const { teams, matches, loading } = useRealtimeData();
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const availableCategories = selectedSport ? getCategories(selectedSport) : [];

  const ranking = computeRanking(teams, matches, selectedSport || undefined, selectedCategory || undefined);
  const totals = computeTotals(matches, selectedSport || undefined, selectedCategory || undefined);
  const finishedMatches = matches.filter((m) => m.winner_id);

  const filteredMatches = finishedMatches.filter((m) => {
    if (selectedSport && m.sport !== selectedSport) return false;
    if (selectedCategory && m.category !== selectedCategory) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 border-b border-dark-700 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg shadow-primary-900/50">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-white">Copa do Mundo</h1>
              <p className="text-xs text-dark-400">Beach Tennis · Vôlei de Areia · Futevôlei</p>
            </div>
          </div>
          <button
            onClick={onAdminClick}
            className="flex items-center gap-1.5 text-xs bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-200 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            Acesso ADM
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Totalizador */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-600 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-primary-900/50 rounded-lg">
                <Target className="w-4 h-4 text-primary-400" />
              </div>
              <span className="text-xs font-medium text-dark-400">Total de Pontos</span>
            </div>
            <div className="text-2xl font-bold text-primary-400">{totals.totalPoints}</div>
          </div>
          <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-600 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-primary-900/50 rounded-lg">
                <Award className="w-4 h-4 text-primary-400" />
              </div>
              <span className="text-xs font-medium text-dark-400">Vitórias</span>
            </div>
            <div className="text-2xl font-bold text-primary-400">{totals.totalWins}</div>
          </div>
          <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-xl p-4 hover:border-accent-600 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-accent-900/50 rounded-lg">
                <Activity className="w-4 h-4 text-accent-400" />
              </div>
              <span className="text-xs font-medium text-dark-400">Partidas</span>
            </div>
            <div className="text-2xl font-bold text-accent-400">{totals.totalMatches}</div>
          </div>
          <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-xl p-4 hover:border-accent-600 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-accent-900/50 rounded-lg">
                <Layers className="w-4 h-4 text-accent-400" />
              </div>
              <span className="text-xs font-medium text-dark-400">Sets Disputados</span>
            </div>
            <div className="text-2xl font-bold text-accent-400">{totals.totalSets}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-dark-200 hover:bg-dark-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-500" />
              Filtros
              {(selectedSport || selectedCategory) && (
                <span className="text-xs bg-primary-900/50 text-primary-300 px-2 py-0.5 rounded-full">Ativos</span>
              )}
            </span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showFilters && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-dark-700 pt-3">
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1">Esporte</label>
                <select
                  value={selectedSport}
                  onChange={(e) => {
                    setSelectedSport(e.target.value);
                    setSelectedCategory('');
                  }}
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">Todos</option>
                  {SPORTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1">Categoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={!selectedSport}
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-dark-950 disabled:text-dark-500"
                >
                  <option value="">{selectedSport ? 'Todas' : 'Selecione um esporte'}</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Ranking */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-700 flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent-400" />
              Classificação Geral
            </h2>
            {(selectedSport || selectedCategory) && (
              <span className="text-xs text-dark-400">
                {selectedSport}{selectedCategory ? ` · ${selectedCategory}` : ''}
              </span>
            )}
          </div>
          {ranking.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-dark-500">Nenhum resultado disponível.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dark-800/50 text-dark-400">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold w-12">#</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Seleção</th>
                    <th className="px-3 py-2.5 text-center font-semibold" title="Pontos">Pts</th>
                    <th className="px-3 py-2.5 text-center font-semibold" title="Vitórias">V</th>
                    <th className="px-3 py-2.5 text-center font-semibold" title="Derrotas">D</th>
                    <th className="px-3 py-2.5 text-center font-semibold" title="Jogos">J</th>
                    <th className="px-3 py-2.5 text-center font-semibold" title="Sets Vencidos">SV</th>
                    <th className="px-3 py-2.5 text-center font-semibold" title="Saldo de Sets">SS</th>
                    <th className="px-3 py-2.5 text-center font-semibold" title="Pontos/Games Pró">PP</th>
                    <th className="px-3 py-2.5 text-center font-semibold" title="Saldo de Pontos/Games">SP</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r, i) => (
                    <tr key={r.team.id} className="border-t border-dark-800 hover:bg-dark-800/50 transition-colors">
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${
                          i === 0 ? 'bg-accent-500/20 text-accent-300' :
                          i === 1 ? 'bg-dark-300/20 text-dark-200' :
                          i === 2 ? 'bg-accent-700/20 text-accent-500' :
                          'text-dark-400'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-white">{r.team.name}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-primary-400">{r.points}</td>
                      <td className="px-3 py-2.5 text-center text-primary-300 font-medium">{r.wins}</td>
                      <td className="px-3 py-2.5 text-center text-red-400 font-medium">{r.losses}</td>
                      <td className="px-3 py-2.5 text-center text-dark-300">{r.matchesPlayed}</td>
                      <td className="px-3 py-2.5 text-center text-dark-300">{r.setsWon}</td>
                      <td className={`px-3 py-2.5 text-center font-medium ${r.setsBalance > 0 ? 'text-primary-400' : r.setsBalance < 0 ? 'text-red-400' : 'text-dark-400'}`}>
                        {r.setsBalance > 0 ? '+' : ''}{r.setsBalance}
                      </td>
                      <td className="px-3 py-2.5 text-center text-dark-300">{r.pointsFor}</td>
                      <td className={`px-3 py-2.5 text-center font-medium ${r.pointsBalance > 0 ? 'text-primary-400' : r.pointsBalance < 0 ? 'text-red-400' : 'text-dark-400'}`}>
                        {r.pointsBalance > 0 ? '+' : ''}{r.pointsBalance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-700">
            <h2 className="text-base font-bold text-white">Resultados dos Jogos</h2>
          </div>
          {filteredMatches.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-dark-500">Nenhum jogo encerrado.</div>
          ) : (
            <div className="divide-y divide-dark-800">
              {filteredMatches.map((m) => {
                const setScores = (m.match_sets ?? [])
                  .slice()
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((s) => `${s.team_a_score}x${s.team_b_score}`)
                  .join(' · ');
                return (
                  <div key={m.id} className="px-4 py-3 flex items-center justify-between hover:bg-dark-800/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-900/40 text-primary-300 border border-primary-800/50">{m.sport}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-dark-800 text-dark-300 border border-dark-700">{m.category}</span>
                        {m.is_tie_break && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-900/40 text-accent-300 border border-accent-800/50">Tie-Break</span>}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`font-medium ${m.winner_id === m.team_a_id ? 'text-primary-400' : 'text-dark-300'}`}>
                          {m.team_a?.name}
                        </span>
                        <span className="text-dark-500">vs</span>
                        <span className={`font-medium ${m.winner_id === m.team_b_id ? 'text-primary-400' : 'text-dark-300'}`}>
                          {m.team_b?.name}
                        </span>
                      </div>
                      {setScores && (
                        <div className="text-xs text-dark-500 mt-0.5">Sets: {setScores}</div>
                      )}
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-xs text-dark-500">{m.is_tie_break ? 'Tie-Break' : 'Normal'}</div>
                      <div className="text-sm font-bold text-primary-400">
                        {m.team_a_points} - {m.team_b_points} pts
                      </div>
                      <div className="text-xs text-dark-500">Sets {m.team_a_sets_won}x{m.team_b_sets_won}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
