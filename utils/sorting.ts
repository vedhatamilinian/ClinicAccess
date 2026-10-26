import { RecommendedClinic, SortOption } from '../types';

export const sortLabels: Record<SortOption, string> = {
  'best-match': 'Best Match',
  nearest: 'Nearest',
  'highest-rated': 'Highest Rated',
  'open-now': 'Open Now',
  alphabetical: 'Alphabetical',
};

export function sortClinics(clinics: RecommendedClinic[], option: SortOption) {
  return [...clinics].sort((first, second) => {
    if (option === 'nearest') return first.distanceMiles - second.distanceMiles;
    if (option === 'highest-rated') return (second.rating ?? 0) - (first.rating ?? 0);
    if (option === 'open-now') {
      return (
        Number(second.openNow === true) - Number(first.openNow === true) ||
        (second.recommendation.score ?? -1) - (first.recommendation.score ?? -1)
      );
    }
    if (option === 'alphabetical') return first.name.localeCompare(second.name);
    return (second.recommendation.score ?? -1) - (first.recommendation.score ?? -1);
  });
}
