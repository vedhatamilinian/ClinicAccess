import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { APP_REGION_DETAIL, APP_REGION_LABEL } from '../constants/region';
import { spacing, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { DISCLAIMER_SHORT } from '../constants/disclaimers';

function HelpSection({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function HelpParagraph({ children }: { children: string }) {
  const { colors } = useAppTheme();
  return <Text style={[styles.paragraph, { color: colors.text }]}>{children}</Text>;
}

function HelpBullet({ children }: { children: string }) {
  const { colors } = useAppTheme();
  return <Text style={[styles.bullet, { color: colors.text }]}>• {children}</Text>;
}

export function HelpContent() {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.lead, { color: colors.textMuted }]}>
        ClinicAccess helps you search clinics and community resources using preferences you save in your profile. Match
        scores are calculated from public clinic data; always confirm details with each provider.
      </Text>

      <HelpSection title="Account and profile">
        <HelpParagraph>
          Sign in or create an account to save preferences and favorites on this device. New accounts set care preferences
          during onboarding; you can change them anytime under Profile → Care preferences.
        </HelpParagraph>
      </HelpSection>

      <HelpSection title="Home">
        <HelpParagraph>Overview of what the app does and links to the main tools below.</HelpParagraph>
      </HelpSection>

      <HelpSection title="Find Care">
        <HelpBullet>Search by clinic name, neighborhood, or service.</HelpBullet>
        <HelpBullet>Use filters for insurance, language, open now, wheelchair access, transit, and distance.</HelpBullet>
        <HelpBullet>Device location is used by default for distance and transit scoring when you allow it.</HelpBullet>
        <HelpBullet>Open a clinic card to see match reasons, hours, and contact actions.</HelpBullet>
      </HelpSection>

      <HelpSection title="Map">
        <HelpBullet>View clinic pins colored by match strength when clinic data is loaded.</HelpBullet>
        <HelpBullet>Tap a pin for a preview; open the full clinic page for the breakdown.</HelpBullet>
        <HelpBullet>Use the same filters as Find Care where available.</HelpBullet>
      </HelpSection>

      <HelpSection title="Community resources">
        <HelpBullet>Browse food, housing, transit, and other support listings with source links.</HelpBullet>
        <HelpBullet>Confirm eligibility, hours, and availability directly with each organization.</HelpBullet>
      </HelpSection>

      <HelpSection title="Clinic detail and match %">
        <HelpParagraph>
          Each clinic shows a match percentage and an expandable breakdown. The score is earned points divided by the
          maximum for factors that apply (insurance, affordability, distance, language, accessibility, transportation,
          appointments, coordinated care, and required care type). Rows marked unknown or not applicable explain gaps
          in public data; they do not always lower the percentage.
        </HelpParagraph>
      </HelpSection>

      <HelpSection title={`Coverage (${APP_REGION_LABEL})`}>
        <HelpParagraph>{APP_REGION_DETAIL}</HelpParagraph>
      </HelpSection>

      <HelpSection title="Emergencies and crisis help">
        <HelpParagraph>For medical emergencies, call 911. For community referrals in Georgia, dial 211 or visit 211.org.</HelpParagraph>
      </HelpSection>

      <Text style={[styles.disclaimer, { color: colors.textMuted }]}>{DISCLAIMER_SHORT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, marginBottom: spacing.lg },
  lead: { fontSize: typography.body, lineHeight: 24 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: typography.subheading, fontWeight: '800' },
  sectionBody: { gap: spacing.xs },
  paragraph: { fontSize: typography.body, lineHeight: 24 },
  bullet: { fontSize: typography.body, lineHeight: 24, paddingLeft: spacing.xs },
  disclaimer: { fontSize: typography.caption, lineHeight: 20 },
});
