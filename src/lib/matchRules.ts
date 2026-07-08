export type SportKey = 'Futevôlei' | 'Vôlei' | 'Beach Tennis';

export type SetScore = {
  team_a: number;
  team_b: number;
};

export type MatchResult = {
  sets: SetScore[];
  winner: 'a' | 'b';
  isTieBreak: boolean;
  setsWonA: number;
  setsWonB: number;
  pointsForA: number;
  pointsForB: number;
};

export type SportRules = {
  pointsPerSet: number;
  bestOf: number;
  setsToWin: number;
  minDifference: number;
  hasTieBreak: boolean;
  tieBreakAt: number;
  superTieBreakPoints: number;
  isBeachTennis: boolean;
};

export const SPORT_RULES: Record<SportKey, SportRules> = {
  Futevôlei: {
    pointsPerSet: 18,
    bestOf: 3,
    setsToWin: 2,
    minDifference: 1,
    hasTieBreak: false,
    tieBreakAt: 0,
    superTieBreakPoints: 0,
    isBeachTennis: false,
  },
  Vôlei: {
    pointsPerSet: 21,
    bestOf: 3,
    setsToWin: 2,
    minDifference: 1,
    hasTieBreak: false,
    tieBreakAt: 0,
    superTieBreakPoints: 0,
    isBeachTennis: false,
  },
  'Beach Tennis': {
    pointsPerSet: 6,
    bestOf: 3,
    setsToWin: 2,
    minDifference: 2,
    hasTieBreak: true,
    tieBreakAt: 6,
    superTieBreakPoints: 7,
    isBeachTennis: true,
  },
};

export function getSportRules(sport: string): SportRules | null {
  if (sport === 'Futevôlei') return SPORT_RULES.Futevôlei;
  if (sport === 'Vôlei de Areia') return SPORT_RULES.Vôlei;
  if (sport === 'Beach Tennis') return SPORT_RULES['Beach Tennis'];
  return null;
}

export function isSetComplete(rules: SportRules, a: number, b: number, setNumber: number): boolean {
  if (a < 0 || b < 0) return false;
  const target = rules.pointsPerSet;
  const diff = Math.abs(a - b);

  if (rules.isBeachTennis) {
    const isThirdSetSuperTieBreak = setNumber === 3;
    if (isThirdSetSuperTieBreak) {
      const tbTarget = rules.superTieBreakPoints;
      return (a >= tbTarget || b >= tbTarget) && diff >= rules.minDifference;
    }
    if (a === rules.tieBreakAt && b === rules.tieBreakAt) return false;
    if (a >= target && diff >= rules.minDifference) return true;
    if (b >= target && diff >= rules.minDifference) return true;
    return false;
  }

  return (a >= target || b >= target) && diff >= rules.minDifference;
}

export type ValidationResult = {
  valid: boolean;
  error?: string;
  result?: MatchResult;
};

export function validateMatch(sport: string, sets: SetScore[]): ValidationResult {
  const rules = getSportRules(sport);
  if (!rules) return { valid: false, error: 'Esporte inválido.' };

  const filled = sets.filter((s) => s.team_a >= 0 && s.team_b >= 0 && !(s.team_a === 0 && s.team_b === 0));
  if (filled.length === 0) return { valid: false, error: 'Informe ao menos um set.' };

  let setsWonA = 0;
  let setsWonB = 0;
  let pointsForA = 0;
  let pointsForB = 0;

  for (let i = 0; i < filled.length; i++) {
    const s = filled[i];
    const setNum = i + 1;

    if (!isSetComplete(rules, s.team_a, s.team_b, setNum)) {
      return {
        valid: false,
        error: `Set ${setNum} inválido para ${sport}. ` +
          (rules.isBeachTennis
            ? `Um set termina em ${rules.pointsPerSet} games com diferença de ${rules.minDifference} (tie-break em ${rules.tieBreakAt}x${rules.tieBreakAt}).`
            : `Um set termina em ${rules.pointsPerSet} pontos com diferença mínima de ${rules.minDifference}.`),
      };
    }

    if (s.team_a > s.team_b) setsWonA++;
    else setsWonB++;

    pointsForA += s.team_a;
    pointsForB += s.team_b;
  }

  if (setsWonA === rules.setsToWin && setsWonB === rules.setsToWin) {
    return { valid: false, error: 'Empate em sets não é permitido. Verifique os placares.' };
  }

  if (setsWonA < rules.setsToWin && setsWonB < rules.setsToWin) {
    return {
      valid: false,
      error: `A partida não foi encerrada. É necessário vencer ${rules.setsToWin} sets. ` +
        `Placar atual: ${setsWonA}x${setsWonB}.`,
    };
  }

  if (setsWonA > rules.setsToWin || setsWonB > rules.setsToWin) {
    return { valid: false, error: 'Placar de sets excede o necessário.' };
  }

  if (filled.length > rules.bestOf) {
    return { valid: false, error: `Número de sets excede o máximo de ${rules.bestOf}.` };
  }

  const winner = setsWonA > setsWonB ? 'a' : 'b';
  const wentToThreeSets = filled.length === 3;
  const isTieBreak = rules.isBeachTennis && wentToThreeSets;

  return {
    valid: true,
    result: {
      sets: filled,
      winner,
      isTieBreak,
      setsWonA,
      setsWonB,
      pointsForA,
      pointsForB,
    },
  };
}

export function getRankingPoints(isTieBreak: boolean, winner: 'a' | 'b', team: 'a' | 'b'): number {
  const isWinner = winner === team;
  if (isWinner) return isTieBreak ? 2 : 3;
  return isTieBreak ? 1 : 0;
}
