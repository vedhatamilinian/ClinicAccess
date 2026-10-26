import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SectionCard } from './cards';
import { AppHeader, ScreenContainer, SectionHeader } from './layout';
import { AvatarPlaceholder } from './ui';
import { radius, spacing, typography } from '../constants/theme';
import { routes } from '../constants/routes';
import { LegalDisclaimer } from './LegalDisclaimer';
import { useAppTheme } from '../hooks/useAppTheme';
import { useFavorites } from '../hooks/useFavorites';
import { usePreferences } from '../hooks/usePreferences';
import { useAuth } from '../hooks/useAuth';
import { careNeedIdFromRequiredService, CARE_NEED_OPTIONS } from '../constants/careNeeds';
import { AppButton } from './ui';

type MenuItem = {
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: string;
};

function ProfileMenuRow({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        { borderColor: colors.border, backgroundColor: colors.surface },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name={item.icon} size={20} color={colors.teal} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
        {item.subtitle ? <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{item.subtitle}</Text> : null}
      </View>
      {item.badge ? (
        <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.badgeText, { color: colors.teal }]}>{item.badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export function ProfileScreen() {
  const { colors, preference: themePreference } = useAppTheme();
  const { preferences } = usePreferences();
  const { favoriteIds } = useFavorites();
  const { session, signOut } = useAuth();
  const careTypeLabel =
    CARE_NEED_OPTIONS.find((o) => o.id === careNeedIdFromRequiredService(preferences.requiredService))?.label ??
    'Any care type';

  const careItems: MenuItem[] = [
    {
      label: 'Care preferences',
      subtitle: `${careTypeLabel} · ${preferences.insurance} · ${preferences.language}`,
      icon: 'options-outline',
      route: routes.preferences,
    },
    {
      label: 'Favorite clinics',
      subtitle: favoriteIds.length ? `${favoriteIds.length} saved on this device` : 'No saved clinics yet',
      icon: 'heart-outline',
      route: routes.favorites,
      badge: favoriteIds.length > 0 ? String(favoriteIds.length) : undefined,
    },
  ];

  const appItems: MenuItem[] = [
    {
      label: 'Settings',
      subtitle: `Theme: ${themePreference === 'system' ? 'System' : themePreference === 'light' ? 'Light' : 'Dark'}`,
      icon: 'settings-outline',
      route: routes.settings,
    },
    { label: 'Help', subtitle: 'How to use each part of the app', icon: 'help-circle-outline', route: routes.help },
  ];

  return (
    <ScreenContainer>
      <AppHeader title="Profile" subtitle="Your care preferences and app settings stay on this device." />

      <View style={styles.identity}>
        <AvatarPlaceholder />
        <View style={styles.identityText}>
          <Text style={[styles.displayName, { color: colors.text }]}>{session?.email ?? 'Your access profile'}</Text>
          <Text style={[styles.identityHint, { color: colors.textMuted }]}>
            Personalize matches with care type, insurance, language, and mobility needs.
          </Text>
        </View>
      </View>

      <SectionCard>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Current preferences</Text>
        <Text style={[styles.preferenceLine, { color: colors.text }]}>
          Type of care: <Text style={styles.preferenceValue}>{careTypeLabel}</Text>
        </Text>
        <Text style={[styles.preferenceLine, { color: colors.text }]}>
          Insurance: <Text style={styles.preferenceValue}>{preferences.insurance}</Text>
        </Text>
        <Text style={[styles.preferenceLine, { color: colors.text }]}>
          Language: <Text style={styles.preferenceValue}>{preferences.language}</Text>
        </Text>
        <Text style={[styles.preferenceLine, { color: colors.text }]}>
          Transportation: <Text style={styles.preferenceValue}>{preferences.transportation}</Text>
        </Text>
        <Text style={[styles.preferenceLine, { color: colors.text }]}>
          Wheelchair access needed:{' '}
          <Text style={styles.preferenceValue}>{preferences.needsWheelchairAccess ? 'Yes' : 'No'}</Text>
        </Text>
        <Text style={[styles.preferenceLine, { color: colors.text }]}>
          Cost is a barrier: <Text style={styles.preferenceValue}>{preferences.costIsBarrier ? 'Yes' : 'No'}</Text>
        </Text>
        <Text style={[styles.preferenceLine, { color: colors.text }]}>
          Prioritize coordinated care:{' '}
          <Text style={styles.preferenceValue}>{preferences.prioritizeCoordinatedCare ? 'Yes' : 'No'}</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit care preferences"
          onPress={() => router.push(routes.preferences)}
          style={({ pressed }) => [styles.editLink, pressed && styles.pressed]}
        >
          <Text style={[styles.editLinkText, { color: colors.teal }]}>Edit preferences</Text>
        </Pressable>
      </SectionCard>

      <SectionHeader title="Care tools" />
      <View style={styles.menu}>
        {careItems.map((item) => (
          <ProfileMenuRow key={item.route} item={item} onPress={() => router.push(item.route as never)} />
        ))}
      </View>

      <SectionHeader title="App" />
      <View style={styles.menu}>
        {appItems.map((item) => (
          <ProfileMenuRow key={item.route} item={item} onPress={() => router.push(item.route as never)} />
        ))}
      </View>

      <AppButton label="Sign out" icon="log-out-outline" variant="outlined" expand onPress={() => signOut()} />

      <LegalDisclaimer />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  identityText: { flex: 1, gap: spacing.xs },
  displayName: { fontSize: typography.subheading, fontWeight: '800' },
  identityHint: { fontSize: typography.caption, lineHeight: 18 },
  cardTitle: { fontSize: typography.body, fontWeight: '800', marginBottom: spacing.xs },
  preferenceLine: { fontSize: typography.body, lineHeight: 24 },
  preferenceValue: { fontWeight: '800' },
  editLink: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  editLinkText: { fontSize: typography.body, fontWeight: '800' },
  menu: { gap: spacing.sm, marginBottom: spacing.md },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 56,
  },
  menuIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1, gap: 2 },
  menuLabel: { fontSize: typography.body, fontWeight: '800' },
  menuSubtitle: { fontSize: typography.caption, lineHeight: 16 },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, marginRight: spacing.xs },
  badgeText: { fontSize: typography.caption, fontWeight: '800' },
  pressed: { opacity: 0.82 },
});
