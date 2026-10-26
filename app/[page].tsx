import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { HelpContent } from '../components/HelpContent';
import { PlaceholderScreen, NotFoundScreen } from '../components/PlaceholderScreen';
import { AppButton } from '../components/ui';
import { spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { PlaceholderPage, ThemePreference } from '../types';

const pages: Record<string, { title: PlaceholderPage; description: string; icon: 'settings-outline' | 'help-circle-outline' }> = {
  settings: { title: 'Settings', description: 'Choose how ClinicAccess looks on your device.', icon: 'settings-outline' },
  help: { title: 'Help', description: 'How to use Home, Find Care, Map, Resources, and your profile.', icon: 'help-circle-outline' },
};

export default function StackPlaceholderPage() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const details = pages[page];
  const { preference, setPreference } = useAppTheme();
  if (!details) return <NotFoundScreen />;

  return (
    <PlaceholderScreen {...details}>
      {page === 'settings' && (
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          {(['system', 'light', 'dark'] as ThemePreference[]).map((option) => (
            <AppButton
              key={option}
              label={`${option === 'system' ? 'Use Device Setting' : `${option[0].toUpperCase()}${option.slice(1)} Mode`}${preference === option ? ' ✓' : ''}`}
              variant={preference === option ? 'primary' : 'outlined'}
              onPress={() => setPreference(option)}
            />
          ))}
        </View>
      )}
      {page === 'help' && <HelpContent />}
    </PlaceholderScreen>
  );
}
