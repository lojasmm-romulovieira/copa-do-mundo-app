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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Header */}
      <header className="bg-primary-700 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-yellow-300" />
            <div>
              <h1 className="text-lg font-bold leading-tight">Copa do Mundo</h1>
              <p className="text-xs text-primary-200">Beach Tennis · Vôlei de Areia · Futevôlei</p>
            </div>
          </div>
          <button
            onClick={onAdminClick}
            className="flex items-center gap-1.5 text-xs bg-primary-800 hover:bg-primary-900 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            Acesso ADM
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Totalizador */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-4">
            <div className="flex items-center gap-2 text-primary-600 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium text-gray-500">Total de Pontos</span>
            </div>
            <div className="text-2xl font-bold text-primary-700">{totals.totalPoints}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs font-medium text-gray-500">Vitórias</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{totals.totalWins}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-medium text-gray-500">Partidas</span>
            </div>
            <div className="text-2xl font-bold text-amber-700">{totals.totalMatches}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-4">
            <div className="flex items-center gap-2 text-sand-700 mb-1">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-medium text-gray-500">Sets Disputados</span>
            </div>
            <div className="text-2xl font-bold text-sand-800">{totals.totalSets}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-600" />
              Filtros
            </span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showFilters && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Esporte</label>
                <select
                  value={selectedSport}
                  onChange={(e) => {
                    setSelectedSport(e.target.value);
                    setSelectedCategory('');
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">Todos</option>
                  {SPORTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={!selectedSport}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">{selectedSport ? 'Todas' : 'Selecione um esporte primeiro'}</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Ranking */}
        <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-sand-200">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Classificação Geral
              {selectedSport && <span className="text-sm font-normal text-gray-500">· {selectedSport}</span>}
              {selectedCategory && <span className="text-sm font-normal text-gray-500">· {selectedCategory}</span>}
            </h2>
          </div>
          {ranking.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">Nenhum resultado disponível para os filtros selecionados.</div>
          ) : (
            <div className="overflow-x-auto">
              {(() => {
                const isBT = selectedSport === 'Beach Tennis';
                const svLabel = isBT ? 'GV' : 'SV';
                const svTitle = isBT ? 'Games Vencidos' : 'Sets Vencidos';
                const ssLabel = isBT ? 'SG' : 'SS';
                const ssTitle = isBT ? 'Saldo de Games' : 'Saldo de Sets';
                const ppLabel = isBT ? 'GP' : 'PP';
                const ppTitle = isBT ? 'Games Pró' : 'Pontos Pró';
                const spLabel = 'SP';
                const spTitle = isBT ? 'Saldo de Pontos (game + TI)' : 'Saldo de Pontos';
                return (
                  <table className="w-full text-sm">
                    <thead className="bg-sand-100 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold w-12">#</th>
                        <th className="px-3 py-2 text-left font-semibold">Seleção</th>
                        <th className="px-3 py-2 text-center font-semibold" title="Pontos na classificação">Pts</th>
                        <th className="px-3 py-2 text-center font-semibold" title="Vitórias">V</th>
                        <th className="px-3 py-2 text-center font-semibold" title="Derrotas">D</th>
                        <th className="px-3 py-2 text-center font-semibold" title="Jogos">J</th>
                        {!isBT && (
                          <>
                            <th className="px-3 py-2 text-center font-semibold" title={svTitle}>{svLabel}</th>
                            <th className="px-3 py-2 text-center font-semibold" title={ssTitle}>{ssLabel}</th>
                          </>
                        )}
                        <th className="px-3 py-2 text-center font-semibold" title={ppTitle}>{ppLabel}</th>
                        <th className="px-3 py-2 text-center font-semibold" title={spTitle}>{spLabel}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((r, i) => (
                        <tr key={r.team.id} className="border-t border-sand-100 hover:bg-sand-50 transition-colors">
                          <td className="px-3 py-2.5 font-bold text-primary-700">{i + 1}</td>
                          <td className="px-3 py-2.5 font-medium">{r.team.name}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-primary-700">{r.points}</td>
                          <td className="px-3 py-2.5 text-center text-green-700 font-medium">{r.wins}</td>
                          <td className="px-3 py-2.5 text-center text-red-600 font-medium">{r.losses}</td>
                          <td className="px-3 py-2.5 text-center text-gray-600">{r.matchesPlayed}</td>
                          {!isBT && (
                            <>
                              <td className="px-3 py-2.5 text-center text-gray-600">{r.setsWon}</td>
                              <td className={`px-3 py-2.5 text-center font-medium ${r.setsBalance > 0 ? 'text-green-700' : r.setsBalance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                {r.setsBalance > 0 ? '+' : ''}{r.setsBalance}
                              </td>
                            </>
                          )}
                          <td className="px-3 py-2.5 text-center text-gray-600">{r.pointsFor}</td>
                          <td className={`px-3 py-2.5 text-center font-medium ${r.pointsBalance > 0 ? 'text-green-700' : r.pointsBalance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {r.pointsBalance > 0 ? '+' : ''}{r.pointsBalance}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-sand-200">
            <h2 className="text-base font-bold text-gray-800">Resultados dos Jogos</h2>
          </div>
          {filteredMatches.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">Nenhum jogo encerrado para os filtros selecionados.</div>
          ) : (
            <div className="divide-y divide-sand-100">
              {filteredMatches.map((m) => {
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
                        <span className={`font-medium ${m.winner_id === m.team_a_id ? 'text-green-700' : 'text-gray-700'}`}>
                          {m.team_a?.name}
                        </span>
                        <span className="text-gray-400">vs</span>
                        <span className={`font-medium ${m.winner_id === m.team_b_id ? 'text-green-700' : 'text-gray-700'}`}>
                          {m.team_b?.name}
                        </span>
                      </div>
                      {scoreLabel && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {scoreLabel}
                          {!isBeachTennis && ` · Sets ${m.team_a_sets_won}x${m.team_b_sets_won}`}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{m.is_tie_break ? 'Tie-Break' : 'Normal'}</div>
                      <div className="text-sm font-bold text-primary-700">
                        {m.team_a_points} - {m.team_b_points} pts
                      </div>
                      <div className="text-xs text-gray-500">Sets {m.team_a_sets_won}x{m.team_b_sets_won}</div>
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
