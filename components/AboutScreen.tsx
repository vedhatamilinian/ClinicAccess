import Constants from 'expo-constants';
import { Text, View, StyleSheet } from 'react-native';
import { SectionCard } from './cards';
import { AppHeader, BackToProfileLink, ScreenBottomBar, ScreenContainer, SectionHeader } from './layout';
import { AppButton, Badge } from './ui';
import { API_ENABLED, getApiBaseUrl } from '../constants/api';
import { appName, spacing, tagline, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { goBackToProfile } from '../utils/navigation';
import { LegalDisclaimer } from './LegalDisclaimer';

const version = Constants.expoConfig?.version ?? '1.0.0';

export function AboutScreen() {
  const { colors } = useAppTheme();
  const apiBase = getApiBaseUrl();

  return (
    <ScreenContainer
      footer={
        <ScreenBottomBar>
          <AppButton label="Back to Profile" icon="arrow-back-outline" variant="outlined" expand onPress={goBackToProfile} />
        </ScreenBottomBar>
      }
    >
      <BackToProfileLink />
      <AppHeader title="About" subtitle="Mission, data, and important limitations." />

      <View style={[styles.hero, { backgroundColor: colors.blue }]}>
        <Badge label="CLINICACCESS" />
        <Text style={styles.heroTitle}>{appName}</Text>
        <Text style={styles.heroTagline}>{tagline}</Text>
        <Text style={styles.heroVersion}>Version {version}</Text>
      </View>

      <SectionHeader title="Our mission" />
      <SectionCard>
        <Text style={[styles.body, { color: colors.text }]}>
          ClinicAccess helps Fulton County residents find healthcare and community support based on real-life needs , insurance,
          language, distance, transportation, accessibility, and services , not just the nearest address on a map.
        </Text>
      </SectionCard>

      <SectionHeader title="How matching works" />
      <SectionCard>
        <Text style={[styles.body, { color: colors.text }]}>
          Match scores use a transparent rules engine on the backend (not a chatbot). Preferences can emphasize affordability when cost is a
          barrier (sliding-scale, free care, self-pay) and coordinated care when clinics list multiple services or referral pathways. Rankings
          also use distance, language, transit, accessibility, and hours. Each result shows why it matched and flags missing data honestly.
        </Text>
      </SectionCard>

      <SectionHeader title="What you can do" />
      <SectionCard>
        <Bullet colors={colors} text="Find Care , search clinics with explainable match scores and filters (including required service)." />
        <Bullet colors={colors} text="Map , explore clinic locations with filters and directions." />
        <Bullet colors={colors} text="Community Resources , food, housing, transit, benefits, and crisis support referrals." />
        <Bullet colors={colors} text="Profile , save preferences and favorites on your device." />
      </SectionCard>

      <SectionHeader title="Technology (for judges & teachers)" />
      <SectionCard>
        <Bullet colors={colors} text="Mobile: React Native, Expo SDK 57, TypeScript, Expo Router." />
        <Bullet colors={colors} text="Backend: Python FastAPI, SQLAlchemy, SQLite; HRSA + Fulton BOH imports." />
        <Bullet colors={colors} text="Matching: app/matching/ with configurable weights and eligibility checks." />
        <Bullet colors={colors} text="Map & location: react-native-maps, expo-location for optional distance scoring." />
      </SectionCard>

      <SectionHeader title="Where data comes from" />
      <SectionCard>
        <Bullet colors={colors} text="HRSA health center sites and Fulton County Board of Health locations (imported locally)." />
        <Bullet colors={colors} text="Curated community resource listings with source links , not live 211 feeds." />
        <Bullet colors={colors} text="Match scores use verified fields when available; missing data is shown honestly." />
        <Bullet colors={colors} text="Google star ratings and review snippets appear when enriched from Google Places (not medical endorsements)." />
        <Text style={[styles.muted, { color: colors.textMuted }]}>
          {API_ENABLED
            ? apiBase
              ? `Live API: ${apiBase}`
              : 'Live API is configured.'
            : 'Demo mode: set EXPO_PUBLIC_API_BASE_URL to connect to the FastAPI backend.'}
        </Text>
      </SectionCard>

      <SectionHeader title="Important" />
      <LegalDisclaimer variant="full" />
    </ScreenContainer>
  );
}

function Bullet({ text, colors }: { text: string; colors: { text: string } }) {
  return <Text style={[styles.bullet, { color: colors.text }]}>• {text}</Text>;
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: spacing.lg, gap: spacing.xs, marginBottom: spacing.md },
  heroTitle: { color: '#FFFFFF', fontSize: typography.display, fontWeight: '900' },
  heroTagline: { color: '#EAF5FF', fontSize: typography.subheading, fontWeight: '700', lineHeight: 24 },
  heroVersion: { color: '#EAF5FF', fontSize: typography.caption, marginTop: spacing.sm },
  body: { fontSize: typography.body, lineHeight: 23 },
  bullet: { fontSize: typography.body, lineHeight: 24 },
  muted: { fontSize: typography.caption, lineHeight: 18, marginTop: spacing.sm },
});
