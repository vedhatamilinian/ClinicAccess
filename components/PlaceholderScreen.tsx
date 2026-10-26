import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { AppHeader, BackToProfileLink, ScreenBottomBar, ScreenContainer } from './layout';
import { AppButton } from './ui';
import { goBackToProfile } from '../utils/navigation';
import { spacing, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

type Props = { title: string; description: string; icon?: keyof typeof Ionicons.glyphMap; children?: React.ReactNode };

export function PlaceholderScreen({ title, description, icon = 'construct-outline', children }: Props) {
  const { colors } = useAppTheme();
  return (
    <ScreenContainer
      footer={
        <ScreenBottomBar>
          <AppButton label="Back to Profile" icon="arrow-back-outline" variant="outlined" expand onPress={goBackToProfile} />
        </ScreenBottomBar>
      }
    >
      <BackToProfileLink />
      <AppHeader title={title} subtitle={description} />
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <Ionicons name={icon} size={58} color={colors.teal} accessibilityLabel={`${title} icon`} />
      </View>
      {children}
    </ScreenContainer>
  );
}

export function NotFoundScreen() {
  const { colors } = useAppTheme();
  return (
    <ScreenContainer>
      <View style={{ paddingTop: spacing.xxl, alignItems: 'center', gap: spacing.md }}>
        <Ionicons name="compass-outline" size={64} color={colors.teal} />
        <Text style={{ color: colors.text, fontSize: typography.heading, fontWeight: '800' }}>Page not found</Text>
        <Text style={{ color: colors.textMuted, fontSize: typography.body, textAlign: 'center' }}>This page does not exist yet. Let’s get you back to the app.</Text>
        <AppButton label="Go Home" onPress={() => router.replace('/')} />
      </View>
    </ScreenContainer>
  );
}
