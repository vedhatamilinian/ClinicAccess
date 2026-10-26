import { Platform } from 'react-native';

export const appName = 'ClinicAccess';
export const tagline = 'Healthcare access for Georgia.';

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 };
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };

export const typography = {
  display: 32,
  heading: 24,
  subheading: 18,
  body: 16,
  caption: 13,
  button: 16,
};

const brand = { blue: '#1769AA', teal: '#087F8C', success: '#198754', warning: '#B76E00', error: '#C73838' };

export const lightColors = {
  ...brand,
  background: '#F6F9FC',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF2F8',
  text: '#132238',
  textMuted: '#5D6B7C',
  border: '#D7E1EA',
  tabInactive: '#718096',
};

export const darkColors = {
  ...brand,
  background: '#101923',
  surface: '#182532',
  surfaceMuted: '#203545',
  text: '#F3F7FA',
  textMuted: '#B2C1CC',
  border: '#314656',
  tabInactive: '#A1B1BE',
};

export type AppColors = typeof lightColors;

export const cardShadow = Platform.select({
  ios: { shadowColor: '#132238', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 3 },
  default: { shadowColor: '#132238', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
});
