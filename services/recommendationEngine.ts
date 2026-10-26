import { CarePreferences, Clinic, ClinicRecommendation, RecommendedClinic } from '../types';
import { getConfidenceLabel, scoreClinic } from './scoring';

/** Offline bundled-clinic scoring when the recommendations API is not used. */
export function createRecommendation(clinic: Clinic, preferences: CarePreferences): ClinicRecommendation {
  const results = scoreClinic(clinic, preferences);
  const score = results.reduce((total, result) => total + result.item.points, 0);
  return {
    clinicId: clinic.id,
    score,
    confidenceLabel: getConfidenceLabel(score),
    reasons: results.flatMap((result) => result.reason ? [result.reason] : []),
    matchedCriteria: results
      .filter((result) => result.item.matched)
      .map((result) => result.item.criterion)
      .filter((criterion): criterion is ClinicRecommendation['matchedCriteria'][number] =>
        ['insurance', 'affordability', 'distance', 'language', 'accessibility', 'transportation', 'appointment', 'hours', 'services'].includes(
          criterion,
        ),
      ),
    missingCriteria: results.flatMap((result) => result.consideration ? [result.consideration] : []),
    breakdown: results.map((result) => result.item),
  };
}

export function recommendClinics(clinics: Clinic[], preferences: CarePreferences): RecommendedClinic[] {
  return clinics
    .map((clinic) => ({ ...clinic, recommendation: createRecommendation(clinic, preferences) }))
    .sort((first, second) => (second.recommendation.score ?? 0) - (first.recommendation.score ?? 0));
}

export function buildRecommendationSummary(recommendations: RecommendedClinic[]) {
  if (!recommendations.length) return 'No clinics match these filters. Try broadening one of your choices.';
  const best = recommendations[0];
  const highlights = best.recommendation.reasons.slice(0, 3).join(' ');
  const scoreText = best.recommendation.score != null ? `${best.recommendation.score}% match` : 'limited data';
  return `We found ${recommendations.length} clinics matching your filters. Top result: ${best.name} (${scoreText}). ${highlights}`;
}
