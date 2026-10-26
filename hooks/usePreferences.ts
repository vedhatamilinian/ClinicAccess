import { useContext } from 'react';
import { PreferencesContext } from '../contexts/AppContext';

export function usePreferences() {
  return useContext(PreferencesContext);
}
