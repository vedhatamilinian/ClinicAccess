export type CareNeedId = 'any' | 'primary_care' | 'dental' | 'mental_health' | 'screenings';

/** Labels shown in the UI; `requiredService` is sent to the API for matching. */
export const CARE_NEED_OPTIONS: { id: CareNeedId; label: string; requiredService: string | null }[] = [
  { id: 'any', label: 'Any care type', requiredService: null },
  { id: 'primary_care', label: 'Primary care', requiredService: 'Primary care' },
  { id: 'dental', label: 'Dental', requiredService: 'Dental' },
  { id: 'mental_health', label: 'Mental health', requiredService: 'Behavioral health' },
  { id: 'screenings', label: 'Screenings', requiredService: 'Screening' },
];

export function careNeedIdFromRequiredService(requiredService: string | null | undefined): CareNeedId {
  if (!requiredService) return 'any';
  const match = CARE_NEED_OPTIONS.find((o) => o.requiredService === requiredService);
  return match?.id ?? 'any';
}

export function requiredServiceFromCareNeedId(id: CareNeedId): string | null {
  return CARE_NEED_OPTIONS.find((o) => o.id === id)?.requiredService ?? null;
}
