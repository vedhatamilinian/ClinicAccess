import { useEffect, useState } from 'react';
import { getClinicById, clinics as bundledDemoClinics } from '../data/clinics';
import { API_ENABLED } from '../constants/api';
import { fetchClinicById } from '../services/api/clinicApi';
import { ApiError } from '../services/api/client';
import { devApiDiagnostics, describeApiError } from '../services/api/diagnostics';
import { mapApiClinicToClinic } from '../services/clinicMapper';
import { Clinic } from '../types';
import { ClinicDataSource } from './useClinicCatalog';

export function useClinicDetail(clinicId: string | undefined) {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [source, setSource] = useState<ClinicDataSource>(API_ENABLED ? 'live-api' : 'bundled-demo');
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!clinicId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    if (!API_ENABLED) {
      const demo = getClinicById(clinicId);
      setClinic(demo ?? null);
      setNotFound(!demo);
      setSource('bundled-demo');
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setNotFound(false);
    setClinic(null);
    setSource('live-api');

    fetchClinicById(clinicId, controller.signal)
      .then((apiClinic) => {
        setClinic(mapApiClinicToClinic(apiClinic));
        setSource('live-api');
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        if (String(reason).includes('NOT_FOUND')) {
          setNotFound(true);
          setClinic(null);
          return;
        }
        setClinic(null);
        setSource('api-unavailable');
        const urlHint = reason instanceof ApiError ? reason.url : undefined;
        const devLine = devApiDiagnostics(reason, urlHint);
        setError(`${describeApiError(reason, urlHint)}${devLine ? `\n${devLine}` : ''}`);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [clinicId, retryToken]);

  const retry = () => setRetryToken((value) => value + 1);

  return { clinic, loading, error, notFound, source, retry };
}

export function getBundledDemoClinicCount() {
  return bundledDemoClinics.length;
}
