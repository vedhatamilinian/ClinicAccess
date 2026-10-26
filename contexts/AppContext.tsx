import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useEffect, useState } from 'react';
import { CarePreferences } from '../types';
import { preferencesStorageKey } from '../services/authStorage';
import { useAuth } from '../hooks/useAuth';

type PreferencesContextValue = { preferences: CarePreferences; updatePreferences: (changes: Partial<CarePreferences>) => void };
type FavoritesContextValue = {
  favoriteIds: string[];
  toggleFavorite: (clinicId: string) => void;
  isFavorite: (clinicId: string) => boolean;
  resourceFavoriteIds: string[];
  toggleResourceFavorite: (resourceId: string) => void;
  isResourceFavorite: (resourceId: string) => boolean;
};
type SearchHistoryContextValue = { recentSearches: string[]; addRecentSearch: (query: string) => void };

const defaultPreferences: CarePreferences = {
  insurance: 'Medicaid',
  language: 'English',
  transportation: 'MARTA',
  requiredService: null,
  needsWheelchairAccess: false,
  costIsBarrier: false,
  prioritizeCoordinatedCare: true,
};

function isCarePreferences(value: unknown): value is CarePreferences {
  if (!value || typeof value !== 'object') return false;
  const record = value as CarePreferences;
  return (
    typeof record.insurance === 'string' &&
    typeof record.language === 'string' &&
    typeof record.transportation === 'string' &&
    typeof record.needsWheelchairAccess === 'boolean' &&
    (record.requiredService === null || record.requiredService === undefined || typeof record.requiredService === 'string') &&
    (record.costIsBarrier === undefined || typeof record.costIsBarrier === 'boolean') &&
    (record.prioritizeCoordinatedCare === undefined || typeof record.prioritizeCoordinatedCare === 'boolean')
  );
}

export const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: defaultPreferences,
  updatePreferences: () => undefined,
});
export const FavoritesContext = createContext<FavoritesContextValue>({
  favoriteIds: [],
  toggleFavorite: () => undefined,
  isFavorite: () => false,
  resourceFavoriteIds: [],
  toggleResourceFavorite: () => undefined,
  isResourceFavorite: () => false,
});
export const SearchHistoryContext = createContext<SearchHistoryContextValue>({ recentSearches: [], addRecentSearch: () => undefined });

export function AppProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [preferences, setPreferences] = useState<CarePreferences>(defaultPreferences);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [resourceFavoriteIds, setResourceFavoriteIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const storageKey = preferencesStorageKey(session?.email ?? null);

  const updatePreferences = (changes: Partial<CarePreferences>) =>
    setPreferences((current) => {
      const next = { ...current, ...changes };
      AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => undefined);
      return next;
    });

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('@clinicaccess/favorite-clinic-ids'),
      AsyncStorage.getItem('@clinicaccess/resource-favorite-ids'),
      AsyncStorage.getItem('@clinicaccess/recent-searches'),
      AsyncStorage.getItem(storageKey),
    ])
      .then(([savedFavorites, savedResourceFavorites, savedSearches, savedPreferences]) => {
        if (savedFavorites) setFavoriteIds(JSON.parse(savedFavorites));
        if (savedResourceFavorites) setResourceFavoriteIds(JSON.parse(savedResourceFavorites));
        if (savedSearches) setRecentSearches(JSON.parse(savedSearches));
        if (savedPreferences) {
          const parsed = JSON.parse(savedPreferences) as unknown;
          if (isCarePreferences(parsed)) {
            setPreferences({
              ...defaultPreferences,
              ...parsed,
              requiredService: parsed.requiredService ?? defaultPreferences.requiredService,
              costIsBarrier: parsed.costIsBarrier ?? defaultPreferences.costIsBarrier,
              prioritizeCoordinatedCare:
                parsed.prioritizeCoordinatedCare ?? defaultPreferences.prioritizeCoordinatedCare,
            });
            return;
          }
        }
        setPreferences(defaultPreferences);
      })
      .catch(() => setPreferences(defaultPreferences));
  }, [storageKey]);

  const toggleFavorite = (clinicId: string) => setFavoriteIds((current) => {
    const next = current.includes(clinicId) ? current.filter((id) => id !== clinicId) : [...current, clinicId];
    AsyncStorage.setItem('@clinicaccess/favorite-clinic-ids', JSON.stringify(next)).catch(() => undefined);
    return next;
  });
  const toggleResourceFavorite = (resourceId: string) =>
    setResourceFavoriteIds((current) => {
      const next = current.includes(resourceId) ? current.filter((id) => id !== resourceId) : [...current, resourceId];
      AsyncStorage.setItem('@clinicaccess/resource-favorite-ids', JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  const addRecentSearch = (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    setRecentSearches((current) => {
      const next = [cleanQuery, ...current.filter((item) => item.toLowerCase() !== cleanQuery.toLowerCase())].slice(0, 5);
      AsyncStorage.setItem('@clinicaccess/recent-searches', JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  };

  return (
    <SearchHistoryContext.Provider value={{ recentSearches, addRecentSearch }}>
      <FavoritesContext.Provider
        value={{
          favoriteIds,
          toggleFavorite,
          isFavorite: (clinicId) => favoriteIds.includes(clinicId),
          resourceFavoriteIds,
          toggleResourceFavorite,
          isResourceFavorite: (resourceId) => resourceFavoriteIds.includes(resourceId),
        }}
      >
        <PreferencesContext.Provider value={{ preferences, updatePreferences }}>{children}</PreferencesContext.Provider>
      </FavoritesContext.Provider>
    </SearchHistoryContext.Provider>
  );
}
