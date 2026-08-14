// ═══════════════════════════════════════════════════════
// MAKE GREAT ZIMBABWE AGAIN - Leaderboard Score
// ═══════════════════════════════════════════════════════

import type { GameState } from '@/lib/game/types';

export interface ScoreBreakdown {
  score: number;
  popularity: number;
  satisfaction: number;
  legitimacy: number;
  yearsInOffice: number;
  corruptionPenalty: number;
  gdpBonus: number;
  longevityBonus: number;
}

export function computeScore(gameState: GameState): ScoreBreakdown {
  const { player, citizenSatisfaction, economic, corruption } = gameState;

  const yearsInOffice = player.turn / 12;
  const popularity = player.popularity;
  const satisfaction = citizenSatisfaction.overall;
  const legitimacy = player.legitimacy;
  const longevityBonus = Math.min(yearsInOffice * 5, 40);
  const corruptionPenalty = corruption.nationalLevel * 0.5;
  const gdpBonus = Math.max(0, Math.log10(Math.max(1, economic.gdp)) * 10);

  const score =
    popularity +
    satisfaction +
    legitimacy +
    longevityBonus +
    gdpBonus -
    corruptionPenalty;

  return {
    score: Math.round(score * 10) / 10,
    popularity,
    satisfaction,
    legitimacy,
    yearsInOffice,
    gdpBonus: Math.round(gdpBonus * 10) / 10,
    longevityBonus,
    corruptionPenalty: Math.round(corruptionPenalty * 10) / 10,
  };
}