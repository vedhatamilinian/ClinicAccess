import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DISCLAIMER_EMERGENCY, DISCLAIMER_FULL_PARAGRAPHS, DISCLAIMER_SHORT } from '../constants/disclaimers';
import { radius, spacing, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

type Props = {
  variant?: 'compact' | 'full';
};

export function LegalDisclaimer({ variant = 'compact' }: Props) {
  const { colors } = useAppTheme();

  if (variant === 'full') {
    return (
      <View
        style={[styles.box, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
        accessibilityRole="text"
      >
        <View style={styles.titleRow}>
          <Ionicons name="information-circle-outline" size={20} color={colors.teal} />
          <Text style={[styles.title, { color: colors.text }]}>Important</Text>
        </View>
        {DISCLAIMER_FULL_PARAGRAPHS.map((paragraph) => (
          <Text key={paragraph} style={[styles.body, { color: colors.textMuted }]}>
            {paragraph}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <View
      style={[styles.compact, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
      accessibilityRole="text"
    >
      <Text style={[styles.body, { color: colors.textMuted }]}>{DISCLAIMER_SHORT}</Text>
      <Text style={[styles.emergency, { color: colors.text }]}>{DISCLAIMER_EMERGENCY}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  compact: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { fontSize: typography.body, fontWeight: '800' },
  body: { fontSize: typography.caption, lineHeight: 19 },
  emergency: { fontSize: typography.caption, lineHeight: 19, fontWeight: '700' },
});
