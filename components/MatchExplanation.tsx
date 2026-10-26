import { StyleSheet, Text, View } from 'react-native';
import { ClinicRecommendation } from '../types';
import { radius, spacing, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

const CONFIRM_PREFIX = 'Confirm ';

function splitSummary(summary: string): { intro: string | null; hasConfirm: boolean } {
  const trimmed = summary.trim();
  const confirmIdx = trimmed.indexOf(CONFIRM_PREFIX);
  if (confirmIdx === -1) {
    return { intro: trimmed || null, hasConfirm: false };
  }
  const before = trimmed.slice(0, confirmIdx).trim();
  return { intro: before || null, hasConfirm: true };
}

function ConfirmParagraph() {
  const { colors } = useAppTheme();
  const suffix = 'insurance, appointments, and access before visiting.';
  return (
    <Text style={[styles.summary, { color: colors.text }]}>
      Confirm {suffix}
    </Text>
  );
}

export function MatchExplanation({ recommendation }: { recommendation: ClinicRecommendation }) {
  const { colors } = useAppTheme();
  const { intro, hasConfirm } = recommendation.summary
    ? splitSummary(recommendation.summary)
    : { intro: null, hasConfirm: false };

  return (
    <View style={styles.container}>
      {intro ? <Text style={[styles.summary, { color: colors.text }]}>{intro}</Text> : null}
      <Text style={[styles.heading, { color: colors.text }]}>Why it matches</Text>
      {recommendation.reasons.length > 0 ? (
        recommendation.reasons.map((reason) => (
          <Text key={reason} style={[styles.item, { color: colors.text }]}>✓ {reason}</Text>
        ))
      ) : (
        <Text style={[styles.item, { color: colors.textMuted }]}>No verified preference matches to highlight yet.</Text>
      )}
      {hasConfirm ? <ConfirmParagraph /> : null}
      {recommendation.missingCriteria.length > 0 && (
        <View style={[styles.considerations, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.heading, { color: colors.text }]}>Things to consider</Text>
          {recommendation.missingCriteria.map((item) => (
            <Text key={item} style={[styles.item, { color: colors.textMuted }]}>• {item}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  summary: { fontSize: typography.body, lineHeight: 23 },
  heading: { fontSize: typography.subheading, fontWeight: '800' },
  item: { fontSize: typography.body, lineHeight: 23 },
  considerations: { borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm },
});
