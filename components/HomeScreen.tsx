import { StyleSheet, Text, View } from 'react-native';
import { FeatureCard } from './cards';
import { ScreenContainer, SectionHeader } from './layout';
import { appName, radius, spacing, tagline, typography } from '../constants/theme';
import { APP_REGION_DETAIL } from '../constants/region';
import { useAppTheme } from '../hooks/useAppTheme';
import { LegalDisclaimer } from './LegalDisclaimer';

export function HomeScreen() {
  const { colors } = useAppTheme();
  return (
    <ScreenContainer>
      <View style={[styles.hero, { backgroundColor: colors.blue }]}>
        <Text style={styles.appName}>{appName}</Text>
        <Text style={styles.tagline}>{tagline}</Text>
        <Text style={styles.heroBody}>
          Search clinics and community resources using your saved preferences and public data for Georgia.
        </Text>
      </View>

      <Text style={[styles.regionNote, { color: colors.textMuted }]}>{APP_REGION_DETAIL}</Text>

      <SectionHeader title="What you can do" />
      <View style={styles.cardList}>
        <FeatureCard
          icon="analytics-outline"
          title="Match scores"
          description="See how each clinic fits your insurance, care type, affordability needs, distance, language, accessibility, transit, and hours."
        />
        <FeatureCard
          icon="bus-outline"
          title="Location and transit"
          description="Optional device location and MARTA proximity estimates help you plan trips in Georgia."
        />
        <FeatureCard
          icon="people-outline"
          title="Community resources"
          description="Food, housing, transit, benefits, and crisis referrals alongside clinic search."
        />
      </View>

      <LegalDisclaimer />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  appName: { color: '#FFFFFF', fontSize: typography.display, fontWeight: '900' },
  tagline: { color: '#FFFFFF', fontSize: typography.subheading, lineHeight: 25, fontWeight: '700' },
  heroBody: { color: '#EAF5FF', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm },
  regionNote: { fontSize: typography.caption, lineHeight: 20, marginBottom: spacing.lg },
  cardList: { gap: spacing.sm },
});
