import { lightColors } from '../constants/theme';
import { RecommendedClinic } from '../types';
import { getMatchScoreColors, MatchScoreTier } from './matchScoreColors';

type AppColors = typeof lightColors;

export type MarkerTier = MatchScoreTier | 'unknown';

function clinicScoreUnreliable(clinic: RecommendedClinic): boolean {
  const score = clinic.recommendation.score;
  return (
    score == null ||
    clinic.recommendation.eligibilityStatus === 'needs_verification' ||
    clinic.recommendation.confidenceLabel.includes('Insufficient') ||
    (clinic.dataCompletenessScore ?? 100) < 45
  );
}

export function markerTierForClinic(clinic: RecommendedClinic): MarkerTier {
  if (clinicScoreUnreliable(clinic)) {
    return 'unknown';
  }
  return getMatchScoreColors(clinic.recommendation.score!, lightColors).tier;
}

export function markerColorForTier(tier: MarkerTier, colors: AppColors): string {
  if (tier === 'unknown') {
    return colors.textMuted;
  }
  switch (tier) {
    case 'strongest':
      return colors.success;
    case 'excellent':
      return colors.teal;
    case 'good':
      return colors.warning;
    case 'limited':
      return colors.error;
  }
}

export function markerColorForClinic(clinic: RecommendedClinic, colors: AppColors): string {
  if (clinicScoreUnreliable(clinic)) {
    return colors.textMuted;
  }
  return getMatchScoreColors(clinic.recommendation.score!, colors).accent;
}

export function formatFacilityType(facilityType?: string) {
  if (!facilityType || facilityType === 'unknown') return 'Facility type not listed';
  return facilityType.replace(/_/g, ' ');
}
