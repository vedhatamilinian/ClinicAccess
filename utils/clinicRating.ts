import { Clinic } from '../types';

/** Single-line rating for list cards (includes Google attribution when applicable). */
export function formatClinicRatingLine(clinic: Pick<Clinic, 'rating' | 'ratingSource' | 'googleReviews'>): string | null {
  if (clinic.rating == null) return null;
  const stars = `★ ${clinic.rating.toFixed(1)}`;
  if (clinic.ratingSource === 'google') {
    const count = clinic.googleReviews?.userRatingCount;
    return count != null ? `${stars} · Google (${count})` : `${stars} · Google`;
  }
  return stars;
}
