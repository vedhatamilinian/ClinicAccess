import { useMemo } from 'react';
import { milesBetween } from '../services/clinicMapper';
import { isValidCoordinate } from '../utils/coordinates';
import { MapMinMatchScore, RecommendedClinic } from '../types';
import { matchScoreTierThresholds } from '../utils/matchScoreColors';

const MIN_SCORE_FLOOR: Record<Exclude<MapMinMatchScore, 'any'>, number> = {
  '51': matchScoreTierThresholds.good,
  '80': matchScoreTierThresholds.excellent,
  '95': matchScoreTierThresholds.strongest,
};
import { UserCoordinates } from './useUserLocation';

export function applyMapLocalFilters(
  clinics: RecommendedClinic[],
  options: {
    zipQuery: string;
    minMatchScore: MapMinMatchScore;
    userCoords: UserCoordinates | null;
  },
) {
  const zip = options.zipQuery.trim();
  let filtered = clinics;

  if (zip) {
    filtered = filtered.filter(
      (clinic) =>
        clinic.postalCode?.includes(zip) ||
        clinic.address.toLowerCase().includes(zip.toLowerCase()),
    );
  }

  if (options.minMatchScore !== 'any') {
    const floor = MIN_SCORE_FLOOR[options.minMatchScore];
    filtered = filtered.filter((clinic) => (clinic.recommendation.score ?? 0) >= floor);
  }

  if (options.userCoords) {
    filtered = filtered.map((clinic) => {
      if (!isValidCoordinate(clinic.latitude, clinic.longitude)) return clinic;
      const distanceMiles = milesBetween(
        options.userCoords!.latitude,
        options.userCoords!.longitude,
        clinic.latitude!,
        clinic.longitude!,
      );
      return { ...clinic, distanceMiles: Math.round(distanceMiles * 10) / 10 };
    });
  }

  return filtered;
}

export function splitMappableClinics(clinics: RecommendedClinic[]) {
  const mappable: RecommendedClinic[] = [];
  const unmapped: RecommendedClinic[] = [];
  for (const clinic of clinics) {
    if (isValidCoordinate(clinic.latitude, clinic.longitude)) {
      mappable.push(clinic);
    } else {
      unmapped.push(clinic);
    }
  }
  return { mappable, unmapped };
}

export function useMapClinicResults(
  recommendations: RecommendedClinic[],
  zipQuery: string,
  minMatchScore: MapMinMatchScore,
  userCoords: UserCoordinates | null,
) {
  return useMemo(() => {
    const filtered = applyMapLocalFilters(recommendations, { zipQuery, minMatchScore, userCoords });
    return splitMappableClinics(filtered);
  }, [recommendations, zipQuery, minMatchScore, userCoords]);
}
