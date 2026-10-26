import { useEffect, useMemo, useState } from 'react';
import { API_ENABLED } from '../constants/api';
import { fetchRecommendations } from '../services/api/recommendationsApi';
import { mapApiRecommendationItem } from '../services/api/recommendationMapper';
import { ApiError } from '../services/api/client';
import { ClinicRecommendation } from '../types';
import { usePreferences } from './usePreferences';
import { defaultFilters } from '../utils/filters';

export function useClinicRecommendation(clinicId: string | undefined, origin: { latitude: number; longitude: number; label?: string } | null) {
  const { preferences } = usePreferences();
  const [recommendation, setRecommendation] = useState<ClinicRecommendation | null>(null);
  const [loading, setLoading] = useState(Boolean(API_ENABLED && clinicId));
  const [error, setError] = useState<string | null>(null);

  const stableOrigin = useMemo(() => {
    if (!origin) return null;
    return { latitude: origin.latitude, longitude: origin.longitude, label: origin.label };
  }, [origin?.latitude, origin?.longitude, origin?.label]);

  useEffect(() => {
    if (!API_ENABLED || !clinicId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchRecommendations(preferences, defaultFilters, 'best-match', '', stableOrigin, undefined, { clinicIds: [clinicId] })
      .then((response) => {
        const item = response.items[0];
        if (!item) {
          setRecommendation(null);
          return;
        }
        setRecommendation(mapApiRecommendationItem(item).recommendation);
      })
      .catch((reason) => {
        setRecommendation(null);
        setError(reason instanceof ApiError ? reason.message : 'Could not load match score.');
      })
      .finally(() => setLoading(false));
  }, [clinicId, preferences, stableOrigin]);

  return { recommendation, loading, error };
}
