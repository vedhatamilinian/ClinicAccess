import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { createContext, PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { AppColors, darkColors, lightColors } from '../constants/theme';
import { ThemePreference } from '../types';

const storageKey = '@clinicaccess/theme-preference';

type ThemeContextValue = {
  colors: AppColors;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemTheme = useColorScheme();
  const [preference, setStoredPreference] = useState<ThemePreference>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((savedPreference) => {
        if (savedPreference === 'light' || savedPreference === 'dark' || savedPreference === 'system') {
          setStoredPreference(savedPreference);
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  const setPreference = (nextPreference: ThemePreference) => {
    setStoredPreference(nextPreference);
    AsyncStorage.setItem(storageKey, nextPreference).catch(() => {
      // The app still works if local storage is temporarily unavailable.
    });
  };

  const isDark = preference === 'system' ? systemTheme === 'dark' : preference === 'dark';
  const value = useMemo(
    () => ({ colors: isDark ? darkColors : lightColors, isDark, preference, setPreference }),
    [isDark, preference],
  );

  // Avoid a light-theme flash while a saved preference is loading.
  if (!isReady) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
