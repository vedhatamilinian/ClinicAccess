export function clinicReviewsRoute(clinicId: string) {
  return `/clinic-reviews/${clinicId}` as const;
}
