import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export function useAppTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('Error!');
  return theme;
}
