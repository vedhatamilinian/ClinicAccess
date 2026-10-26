import { maxPreferredDistanceMiles, recommendationWeights } from '../constants/recommendation';
import { CarePreferences, Clinic, RecommendationBreakdownItem, RecommendationCriterion } from '../types';

type CriterionResult = { item: RecommendationBreakdownItem; reason?: string; consideration?: string };

function result(criterion: RecommendationCriterion, label: string, points: number, matched: boolean, reason?: string, consideration?: string): CriterionResult {
  return { item: { criterion, label, points, maximumPoints: recommendationWeights[criterion], matched }, reason, consideration };
}

export function scoreClinic(clinic: Clinic, preferences: CarePreferences): CriterionResult[] {
  const hasInsuranceData = clinic.insuranceAccepted.length > 0;
  const insuranceMatch = hasInsuranceData && clinic.insuranceAccepted.includes(preferences.insurance);
  const privateInsuranceUnknown =
    preferences.insurance === 'Private insurance' && hasInsuranceData && !insuranceMatch;

  const hasLanguageData = clinic.languages.length > 0;
  const languageIsOther = preferences.language === 'Other';
  const languageMatch =
    hasLanguageData &&
    !languageIsOther &&
    clinic.languages.includes(preferences.language);
  const languagePartialOther =
    languageIsOther &&
    hasLanguageData &&
    (clinic.languages.some((l) => l.toLowerCase().includes('interpreter')) || clinic.languages.length >= 2);

  const accessibilityKnown = clinic.wheelchairAccessible !== null && clinic.wheelchairAccessible !== undefined;
  const accessibilityMatch =
    !preferences.needsWheelchairAccess || (accessibilityKnown && clinic.wheelchairAccessible === true);

  const transitKnown = clinic.transitAvailable !== null && clinic.transitAvailable !== undefined;
  const transitMatch =
    preferences.transportation !== 'MARTA' || (transitKnown && clinic.transitAvailable === true);

  const distancePoints = Math.round(recommendationWeights.distance * Math.max(0, 1 - clinic.distanceMiles / 10));
  const closeBy = clinic.distanceMiles <= maxPreferredDistanceMiles;

  const results: CriterionResult[] = [
    result(
      'insurance',
      'Insurance',
      insuranceMatch ? recommendationWeights.insurance : 0,
      insuranceMatch,
      insuranceMatch ? 'This clinic accepts your insurance.' : undefined,
      hasInsuranceData
        ? insuranceMatch
          ? undefined
          : privateInsuranceUnknown
            ? 'Private/commercial insurance is not listed , confirm your plan with the clinic.'
            : 'This clinic does not accept your insurance.'
        : preferences.insurance === 'Private insurance'
          ? 'Private/commercial insurance is not listed , confirm with the clinic.'
          : 'Insurance acceptance is not listed for this clinic , confirm with the site.',
    ),
    result(
      'distance',
      'Distance',
      distancePoints,
      closeBy,
      closeBy ? `It is only ${clinic.distanceMiles.toFixed(1)} miles away.` : undefined,
      closeBy ? undefined : 'This clinic is farther than your preferred distance.',
    ),
    result(
      'language',
      'Language',
      languageMatch
        ? recommendationWeights.language
        : languagePartialOther
          ? Math.round(recommendationWeights.language * 0.5)
          : 0,
      languageMatch || languagePartialOther,
      languageMatch
        ? `${preferences.language}-speaking providers are available.`
        : languagePartialOther
          ? 'Language or interpreter support may be available; confirm with the clinic.'
          : undefined,
      hasLanguageData
        ? languageMatch || languagePartialOther
          ? undefined
          : languageIsOther
            ? 'Language access for your needs is not confirmed in available data.'
            : `This clinic does not list ${preferences.language}-speaking providers.`
        : 'Languages spoken are not listed for this clinic , confirm with the site.',
    ),
  ];

  if (preferences.needsWheelchairAccess || accessibilityKnown) {
    results.push(
      result(
        'accessibility',
        'Accessibility',
        accessibilityMatch ? recommendationWeights.accessibility : 0,
        accessibilityMatch,
        preferences.needsWheelchairAccess && clinic.wheelchairAccessible ? 'The clinic is wheelchair accessible.' : undefined,
        preferences.needsWheelchairAccess && clinic.wheelchairAccessible === false
          ? 'Wheelchair accessibility is not confirmed for this clinic.'
          : !accessibilityKnown
            ? 'Accessibility is not listed for this clinic , confirm with the site.'
            : undefined,
      ),
    );
  }

  if (preferences.transportation === 'MARTA' || transitKnown) {
    results.push(
      result(
        'transportation',
        'Transportation',
        transitMatch ? recommendationWeights.transportation : 0,
        transitMatch,
        preferences.transportation === 'MARTA' && clinic.transitAvailable ? 'It is reachable using public transportation.' : undefined,
        preferences.transportation === 'MARTA' && clinic.transitAvailable === false
          ? 'Public transportation access is not available for this clinic.'
          : !transitKnown
            ? 'Transit access is not listed for this clinic.'
            : undefined,
      ),
    );
  }

  if (clinic.openNow === true) {
    results.push(
      result(
        'hours',
        'Hours',
        recommendationWeights.hours,
        true,
        'This clinic is open now (from listed or derived hours).',
      ),
    );
  } else if (clinic.openNow === false) {
    results.push(
      result(
        'hours',
        'Hours',
        0,
        false,
        undefined,
        'Listed hours indicate the clinic is currently closed.',
      ),
    );
  }

  return results;
}

export function getConfidenceLabel(score: number) {
  if (score >= 95) return 'Perfect Match' as const;
  if (score >= 85) return 'Excellent Match' as const;
  if (score >= 70) return 'Good Match' as const;
  return 'Limited Match' as const;
}
