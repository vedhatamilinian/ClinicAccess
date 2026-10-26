import { useContext } from 'react';
import { FavoritesContext } from '../contexts/AppContext';

export function useResourceFavorites() {
  const { resourceFavoriteIds, toggleResourceFavorite, isResourceFavorite } = useContext(FavoritesContext);
  return { resourceFavoriteIds, toggleResourceFavorite, isResourceFavorite };
}
