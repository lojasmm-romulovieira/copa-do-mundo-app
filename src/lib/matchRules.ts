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
  thirdSetPoints: number; // points limit for 3rd set (tie-break set)
  bestOf: number;
  setsToWin: number;
  minDifference: number;
  hasTieBreak: boolean;
  tieBreakAt: number;
  tieBreakPoints: number;
  tieBreakMinDiff: number;
  isBeachTennis: boolean;
};

export const SPORT_RULES: Record<SportKey, SportRules> = {
  Futevôlei: {
    pointsPerSet: 18,
    thirdSetPoints: 15,
    bestOf: 3,
    setsToWin: 2,
    minDifference: 1,
    hasTieBreak: false,
    tieBreakAt: 0,
    tieBreakPoints: 0,
    tieBreakMinDiff: 0,
    isBeachTennis: false,
  },
  Vôlei: {
    pointsPerSet: 21,
    thirdSetPoints: 15,
    bestOf: 3,
    setsToWin: 2,
    minDifference: 1,
    hasTieBreak: false,
    tieBreakAt: 0,
    tieBreakPoints: 0,
    tieBreakMinDiff: 0,
    isBeachTennis: false,
  },
  'Beach Tennis': {
    pointsPerSet: 6,
    thirdSetPoints: 6,
    bestOf: 2, // game + optional tie-break
    setsToWin: 1,
    minDifference: 2,
    hasTieBreak: true,
    tieBreakAt: 6,
    tieBreakPoints: 7,
    tieBreakMinDiff: 2,
    isBeachTennis: true,
  },
};

export function getSportRules(sport: string): SportRules | null {
  if (sport === 'Futevôlei') return SPORT_RULES.Futevôlei;
  if (sport === 'Vôlei de Areia') return SPORT_RULES.Vôlei;
  if (sport === 'Beach Tennis') return SPORT_RULES['Beach Tennis'];
  return null;
}

export function isGameSetComplete(rules: SportRules, a: number, b: number): boolean {
  if (a < 0 || b < 0) return false;
  const diff = Math.abs(a - b);
  // 6x6 is valid as a "pending tie-break" state
  if (a === rules.tieBreakAt && b === rules.tieBreakAt) return true;
  if (a >= rules.pointsPerSet && diff >= rules.minDifference) return true;
  if (b >= rules.pointsPerSet && diff >= rules.minDifference) return true;
  return false;
}

export function isTieBreakSetComplete(rules: SportRules, a: number, b: number): boolean {
  if (a < 0 || b < 0) return false;
  const diff = Math.abs(a - b);
  return (a >= rules.tieBreakPoints || b >= rules.tieBreakPoints) && diff >= rules.tieBreakMinDiff;
}

export function isSetComplete(rules: SportRules, a: number, b: number, setIndex = 0): boolean {
  if (rules.isBeachTennis) return isGameSetComplete(rules, a, b);
  if (a < 0 || b < 0) return false;
  const limit = setIndex >= 2 ? rules.thirdSetPoints : rules.pointsPerSet;
  const diff = Math.abs(a - b);
  return (
    (a === limit && b < limit && diff >= rules.minDifference) ||
    (b === limit && a < limit && diff >= rules.minDifference)
  );
}

export function beachTennisWentToTieBreak(sets: SetScore[]): boolean {
  return sets.length > 0 && sets[0].team_a === 6 && sets[0].team_b === 6;
}

export type ValidationResult = {
  valid: boolean;
  error?: string;
  result?: MatchResult;
};

export function validateMatch(sport: string, sets: SetScore[]): ValidationResult {
  const rules = getSportRules(sport);
  if (!rules) return { valid: false, error: 'Esporte inválido.' };

  if (rules.isBeachTennis) {
    const gameSet = sets[0];
    if (!gameSet || (gameSet.team_a === 0 && gameSet.team_b === 0)) {
      return { valid: false, error: 'Informe o placar do game.' };
    }

    if (!isGameSetComplete(rules, gameSet.team_a, gameSet.team_b)) {
      return {
        valid: false,
        error: `Placar do game inválido. Termina em ${rules.pointsPerSet} games com diferença de ${rules.minDifference}. Em ${rules.tieBreakAt}x${rules.tieBreakAt} entra em tie-break.`,
      };
    }

    const isTieBreak = gameSet.team_a === rules.tieBreakAt && gameSet.team_b === rules.tieBreakAt;

    if (isTieBreak) {
      const tbSet = sets[1];
      if (!tbSet || (tbSet.team_a === 0 && tbSet.team_b === 0)) {
        return { valid: false, error: 'Informe o placar do tie-break (mínimo 7 com diferença de 2).' };
      }
      if (!isTieBreakSetComplete(rules, tbSet.team_a, tbSet.team_b)) {
        return {
          valid: false,
          error: `Tie-break inválido. Mínimo ${rules.tieBreakPoints} pontos com diferença de ${rules.tieBreakMinDiff}.`,
        };
      }
      const winner: 'a' | 'b' = tbSet.team_a > tbSet.team_b ? 'a' : 'b';
      return {
        valid: true,
        result: {
          sets: [gameSet, tbSet],
          winner,
          isTieBreak: true,
          setsWonA: winner === 'a' ? 1 : 0,
          setsWonB: winner === 'b' ? 1 : 0,
          pointsForA: gameSet.team_a + tbSet.team_a,
          pointsForB: gameSet.team_b + tbSet.team_b,
        },
      };
    }

    // Regular game win (no tie-break)
    if (gameSet.team_a === gameSet.team_b) {
      return { valid: false, error: 'Placar empatado sem tie-break. Informe um vencedor.' };
    }
    const winner: 'a' | 'b' = gameSet.team_a > gameSet.team_b ? 'a' : 'b';
    return {
      valid: true,
      result: {
        sets: [gameSet],
        winner,
        isTieBreak: false,
        setsWonA: winner === 'a' ? 1 : 0,
        setsWonB: winner === 'b' ? 1 : 0,
        pointsForA: gameSet.team_a,
        pointsForB: gameSet.team_b,
      },
    };
  }

  // Non-beach-tennis sports
  const filled = sets
    .slice(0, rules.bestOf)
    .filter((s) => s.team_a >= 0 && s.team_b >= 0 && !(s.team_a === 0 && s.team_b === 0));
  if (filled.length === 0) return { valid: false, error: 'Informe ao menos um set.' };

  let setsWonA = 0;
  let setsWonB = 0;
  let pointsForA = 0;
  let pointsForB = 0;

  for (let i = 0; i < filled.length; i++) {
    const s = filled[i];
    if (!isSetComplete(rules, s.team_a, s.team_b, i)) {
      const limit = i >= 2 ? rules.thirdSetPoints : rules.pointsPerSet;
      return {
        valid: false,
        error: `Set ${i + 1} inválido. Um dos times deve ter exatamente ${limit} pontos com diferença mínima de ${rules.minDifference}.`,
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
      error: `Partida não encerrada. Necessário vencer ${rules.setsToWin} sets. Atual: ${setsWonA}x${setsWonB}.`,
    };
  }

  if (setsWonA > rules.setsToWin || setsWonB > rules.setsToWin) {
    return { valid: false, error: 'Placar de sets excede o necessário.' };
  }

  const winner = setsWonA > setsWonB ? 'a' : 'b';
  const isTieBreak = filled.length === 3;

  return {
    valid: true,
    result: { sets: filled, winner, isTieBreak, setsWonA, setsWonB, pointsForA, pointsForB },
  };
}

export function getRankingPoints(isTieBreak: boolean, winner: 'a' | 'b', team: 'a' | 'b'): number {
  const isWinner = winner === team;
  if (isWinner) return isTieBreak ? 2 : 3;
  return isTieBreak ? 1 : 0;
}
