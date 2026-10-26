import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export type UserCoordinates = { latitude: number; longitude: number };

type UseUserLocationOptions = {
  /** Request foreground location once when the hook mounts (e.g. Find Care search). */
  requestOnMount?: boolean;
};

export function useUserLocation(options?: UseUserLocationOptions) {
  const [coords, setCoords] = useState<UserCoordinates | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(Boolean(options?.requestOnMount));

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setPermissionDenied(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoords(next);
      return next;
    } catch {
      setPermissionDenied(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!options?.requestOnMount) return;
    requestLocation();
  }, [options?.requestOnMount, requestLocation]);

  return { coords, permissionDenied, loading, requestLocation, clearLocation: () => setCoords(null) };
}
