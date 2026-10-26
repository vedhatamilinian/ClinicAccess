import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clinics as bundledDemoClinics } from '../data/clinics';
import { API_ENABLED } from '../constants/api';
import { fetchAllClinics } from '../services/api/clinicApi';
import { ApiError } from '../services/api/client';
import { devApiDiagnostics, describeApiError } from '../services/api/diagnostics';
import { ClinicListParams } from '../services/api/types';
import { mapApiClinicToClinic } from '../services/clinicMapper';
import { Clinic, ClinicFilters } from '../types';
import { usePreferences } from './usePreferences';

/** Whether clinic list rows came from the API or bundled demo data. */
export type ClinicDataSource = 'live-api' | 'bundled-demo' | 'api-unavailable';

type State = {
  clinics: Clinic[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  source: ClinicDataSource;
  retry: () => void;
};

function filterBundledByQuery(clinics: Clinic[], searchQuery: string) {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return clinics;
  return clinics.filter((clinic) => {
    const haystack = [clinic.name, clinic.address, ...clinic.services].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

export function useClinicCatalog(searchQuery: string, filters: ClinicFilters): State {
  const { preferences } = usePreferences();
  const [clinics, setClinics] = useState<Clinic[]>(API_ENABLED ? [] : bundledDemoClinics);
  const [loading, setLoading] = useState(API_ENABLED);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ClinicDataSource>(API_ENABLED ? 'live-api' : 'bundled-demo');
  const [reloadToken, setReloadToken] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const apiParams: ClinicListParams = useMemo(() => {
    const q = searchQuery.trim();
    return {
      q: q || undefined,
      insurance: filters.insuranceOnly ? preferences.insurance : undefined,
      language: filters.languageOnly ? preferences.language : undefined,
      accessible: filters.wheelchairAccessibleOnly ? true : undefined,
      transit: filters.transitOnly ? true : undefined,
      open_now: filters.openNowOnly ? true : undefined,
      include_demo: false,
      page_size: 100,
    };
  }, [filters, preferences.insurance, preferences.language, searchQuery]);

  const load = useCallback(() => {
    if (!API_ENABLED) {
      setClinics(filterBundledByQuery(bundledDemoClinics, searchQuery));
      setSource('bundled-demo');
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const isBackgroundRefresh = hasLoadedOnceRef.current;
    if (isBackgroundRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    fetchAllClinics(apiParams, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setClinics(items.map(mapApiClinicToClinic));
        setSource('live-api');
        setError(null);
        hasLoadedOnceRef.current = true;
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        const urlHint = reason instanceof ApiError ? reason.url : undefined;
        const base = describeApiError(reason, urlHint);
        const devLine = devApiDiagnostics(reason, urlHint);
        const message = `${base} Bundled demo data is not shown when EXPO_PUBLIC_API_BASE_URL is set.${devLine ? `\n${devLine}` : ''}`;

        if (!hasLoadedOnceRef.current) {
          setClinics([]);
          setSource('api-unavailable');
        }
        setError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      });
  }, [apiParams, searchQuery]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load, reloadToken]);

  const retry = useCallback(() => {
    hasLoadedOnceRef.current = false;
    setReloadToken((value) => value + 1);
  }, []);

  return { clinics, loading, refreshing, error, source, retry };
}
