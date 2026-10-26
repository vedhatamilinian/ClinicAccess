import { useContext } from 'react';
import { SearchHistoryContext } from '../contexts/AppContext';

export function useRecentSearches() {
  return useContext(SearchHistoryContext);
}
