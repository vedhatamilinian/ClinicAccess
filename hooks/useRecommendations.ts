import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_ENABLED } from '../constants/api';
import { fetchRecommendations } from '../services/api/recommendationsApi';
import { mapApiRecommendationItem } from '../services/api/recommendationMapper';
import { ApiError } from '../services/api/client';
import { buildRecommendationSummary, recommendClinics } from '../services/recommendationEngine';
import { applyClinicFilters } from '../utils/filters';
import { sortClinics } from '../utils/sorting';
import { Clinic, ClinicFilters, RecommendationOrigin, RecommendedClinic, SortOption } from '../types';
import { usePreferences } from './usePreferences';

export function useRecommendations(
  clinics: Clinic[],
  filters: ClinicFilters,
  sortOption: SortOption,
  searchQuery: string,
  origin: RecommendationOrigin | null = null,
  clinicIds?: string[],
) {
  const { preferences } = usePreferences();
  const [apiRecommendations, setApiRecommendations] = useState<RecommendedClinic[]>([]);
  const [apiLoading, setApiLoading] = useState(API_ENABLED);
  const [apiError, setApiError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stableOrigin = useMemo((): RecommendationOrigin | null => {
    if (!origin) return null;
    return {
      latitude: origin.latitude,
      longitude: origin.longitude,
      label: origin.label,
    };
  }, [origin?.latitude, origin?.longitude, origin?.label]);

  const clinicIdsKey = clinicIds?.join(',') ?? '';

  const loadFromApi = useCallback(() => {
    if (!API_ENABLED) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setApiLoading(true);
    setApiError(null);

    fetchRecommendations(
      preferences,
      filters,
      sortOption,
      searchQuery,
      stableOrigin,
      controller.signal,
      clinicIdsKey ? { clinicIds: clinicIdsKey.split(',') } : undefined,
    )
      .then((response) => {
        if (controller.signal.aborted) return;
        let items = response.items.map(mapApiRecommendationItem);
        if (filters.openNowOnly) {
          items = items.filter((clinic) => clinic.openNow === true);
        }
        if (filters.maxDistance !== undefined) {
          items = items.filter((clinic) => clinic.distanceMiles <= filters.maxDistance!);
        }
        setApiRecommendations(items);
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setApiRecommendations([]);
        setApiError(reason instanceof ApiError ? reason.message : 'Could not load recommendations from the API.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setApiLoading(false);
      });
  }, [clinicIdsKey, filters, preferences, searchQuery, sortOption, stableOrigin]);

  useEffect(() => {
    loadFromApi();
    return () => abortRef.current?.abort();
  }, [loadFromApi]);

  const local = useMemo(() => {
    const ranked = recommendClinics(clinics, preferences);
    const filtered = applyClinicFilters(ranked, filters, preferences);
    const sorted = sortClinics(filtered, sortOption);
    return { recommendations: sorted, summary: buildRecommendationSummary(sorted) };
  }, [clinics, filters, preferences, searchQuery, sortOption]);

  if (API_ENABLED) {
    const summary =
      apiRecommendations.length > 0
        ? `We found ${apiRecommendations.length} clinics. Scores reflect your preferences and verified data only , confirm details with each clinic.`
        : 'No clinics match these filters.';
    return {
      recommendations: apiRecommendations,
      summary,
      loading: apiLoading,
      error: apiError,
      retry: loadFromApi,
    };
  }

  return { recommendations: local.recommendations, summary: local.summary, loading: false, error: null, retry: () => undefined };
}
