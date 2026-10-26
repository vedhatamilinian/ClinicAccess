import { apiPost } from './client';
import { ApiClinic } from './types';
import { CarePreferences, ClinicFilters, RecommendationOrigin, SortOption } from '../../types';

export type ApiRecommendationItem = {
  clinic: ApiClinic;
  match_score: number | null;
  data_completeness: number;
  confidence_label: string;
  distance_miles: number | null;
  distance_is_estimate: boolean;
  eligibility_status: string;
  mandatory_blocked: boolean;
  reasons: string[];
  barriers: string[];
  unknown_fields: string[];
  components: Array<{
    key: string;
    label: string;
    score: number;
    max_score: number;
    status: string;
    explanation?: string;
    source?: string;
    applicable?: boolean;
    reason?: string;
    barrier?: string;
  }>;
  evaluated_criteria_count: number;
  unknown_criteria_count: number;
  summary: string;
};

export type ApiRecommendationResponse = {
  items: ApiRecommendationItem[];
  total: number;
};

export type FetchRecommendationsOptions = {
  clinicIds?: string[];
};

export async function fetchRecommendations(
  preferences: CarePreferences,
  filters: ClinicFilters,
  sortOption: SortOption,
  searchQuery: string,
  origin: RecommendationOrigin | null,
  signal?: AbortSignal,
  options?: FetchRecommendationsOptions,
): Promise<ApiRecommendationResponse> {
  const trimmed = searchQuery.trim();
  return apiPost<ApiRecommendationResponse>(
    '/api/v1/recommendations',
    {
      preferences: {
        insurance: preferences.insurance,
        language: preferences.language,
        transportation: preferences.transportation,
        needs_wheelchair_access: preferences.needsWheelchairAccess,
        cost_is_barrier: preferences.costIsBarrier,
        prioritize_coordinated_care: preferences.prioritizeCoordinatedCare,
        required_service: preferences.requiredService,
        required_insurance: filters.insuranceOnly,
        required_language: filters.languageOnly,
        origin_latitude: origin?.latitude ?? null,
        origin_longitude: origin?.longitude ?? null,
        origin_label: origin?.label ?? null,
      },
      q: trimmed || undefined,
      insurance: preferences.insurance,
      language: preferences.language,
      accessible: filters.wheelchairAccessibleOnly ? true : undefined,
      transit: filters.transitOnly ? true : undefined,
      open_now: filters.openNowOnly ? true : undefined,
      include_demo: false,
      insurance_filter: filters.insuranceOnly,
      language_filter: filters.languageOnly,
      sort: sortOption,
      exclude_excluded: true,
      clinic_ids: options?.clinicIds,
    },
    signal,
  );
}
