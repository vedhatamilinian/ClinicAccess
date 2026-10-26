import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENABLED } from '../constants/api';
import { fetchCommunityResources } from '../services/api/communityResourcesApi';
import { ApiError } from '../services/api/client';
import { CommunityResource, CommunityResourceListParams } from '../types/communityResource';
import { UserCoordinates } from './useUserLocation';

export function useCommunityResources(params: CommunityResourceListParams, userCoords: UserCoordinates | null) {
  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(API_ENABLED);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    if (!API_ENABLED) {
      setResources([]);
      setTotal(0);
      setLoading(false);
      setError('Set EXPO_PUBLIC_API_BASE_URL and start the backend to load community resources.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    const query: CommunityResourceListParams = {
      ...params,
      origin_latitude: userCoords?.latitude,
      origin_longitude: userCoords?.longitude,
      sort: userCoords ? params.sort ?? 'distance' : params.sort ?? 'name',
    };

    fetchCommunityResources(query, controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        setResources(payload.items);
        setTotal(payload.total);
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setResources([]);
        setTotal(0);
        setError(reason instanceof ApiError ? reason.message : 'Could not load community resources.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, [params, userCoords]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { resources, total, loading, error, retry: load };
}
