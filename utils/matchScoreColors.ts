import { lightColors } from '../constants/theme';

type AppColors = typeof lightColors;

export type MatchScoreTier = 'strongest' | 'excellent' | 'good' | 'limited';

export const matchScoreTierThresholds = {
  strongest: 95,
  excellent: 80,
  good: 51,
} as const;

/** Match % tiers: 95+ green, 80–94 teal, 51–79 amber, below 51 red. */
export function getMatchScoreColors(score: number, colors: AppColors) {
  if (score >= matchScoreTierThresholds.strongest) {
    return { accent: colors.success, tier: 'strongest' as const satisfies MatchScoreTier };
  }
  if (score >= matchScoreTierThresholds.excellent) {
    return { accent: colors.teal, tier: 'excellent' as const satisfies MatchScoreTier };
  }
  if (score >= matchScoreTierThresholds.good) {
    return { accent: colors.warning, tier: 'good' as const satisfies MatchScoreTier };
  }
  return { accent: colors.error, tier: 'limited' as const satisfies MatchScoreTier };
}

export function matchScoreTierDescription(score: number): string {
  if (score >= matchScoreTierThresholds.strongest) return 'Strongest fit';
  if (score >= matchScoreTierThresholds.excellent) return 'Excellent fit';
  if (score >= matchScoreTierThresholds.good) return 'Good fit';
  return 'Limited fit';
}
