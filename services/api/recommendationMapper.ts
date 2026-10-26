import { mapApiClinicToClinic } from '../clinicMapper';
import { ApiRecommendationItem } from './recommendationsApi';
import { ClinicRecommendation, EligibilityStatus, RecommendedClinic } from '../../types';

export function mapApiRecommendationItem(item: ApiRecommendationItem): RecommendedClinic {
  const clinic = mapApiClinicToClinic(item.clinic);
  if (item.distance_miles != null) {
    clinic.distanceMiles = item.distance_miles;
  }
  if (item.data_completeness != null) {
    clinic.dataCompletenessScore = item.data_completeness;
  }

  const recommendation: ClinicRecommendation = {
    clinicId: clinic.id,
    score: item.match_score != null ? Math.round(item.match_score) : null,
    confidenceLabel: item.confidence_label,
    eligibilityStatus: item.eligibility_status as EligibilityStatus,
    summary: item.summary,
    evaluatedCriteriaCount: item.evaluated_criteria_count,
    unknownCriteriaCount: item.unknown_criteria_count,
    distanceIsEstimate: item.distance_is_estimate,
    reasons: [...item.reasons],
    matchedCriteria: item.components
      .filter((c) => c.status === 'match')
      .map((c) => mapCriterionKey(c.key)),
    missingCriteria: [
      ...item.barriers,
      ...item.unknown_fields.map((f) => `${f} not listed`),
      ...item.components.filter((c) => c.status === 'unknown').map((c) => c.explanation ?? `${c.label} unknown`),
    ],
    breakdown: item.components.map((component) => ({
      criterion: mapCriterionKey(component.key),
      label: component.label,
      points: Math.round(component.score),
      maximumPoints: Math.round(component.max_score),
      matched: component.status === 'match',
      status: component.status as ClinicRecommendation['breakdown'][0]['status'],
      explanation: component.explanation ?? component.reason,
      applicable: component.applicable ?? true,
    })),
  };

  return { ...clinic, recommendation };
}

function mapCriterionKey(key: string): ClinicRecommendation['matchedCriteria'][number] {
  const map: Record<string, ClinicRecommendation['matchedCriteria'][number]> = {
    affordability: 'affordability',
    insurance: 'affordability',
    distance: 'distance',
    language: 'language',
    accessibility: 'accessibility',
    services: 'services',
    appointment: 'appointment',
    transportation: 'transportation',
    coordinated_care: 'coordinated_care',
  };
  return map[key] ?? 'distance';
}
