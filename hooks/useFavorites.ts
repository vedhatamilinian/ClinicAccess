import { useContext } from 'react';
import { FavoritesContext } from '../contexts/AppContext';

export function useFavorites() {
  return useContext(FavoritesContext);
}
