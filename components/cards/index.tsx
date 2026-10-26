import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cardShadow, radius, spacing, typography } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';

export function SectionCard({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return <View style={[styles.card, cardShadow, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>;
}

export function FeatureCard({ icon, title, description }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }) {
  const { colors } = useAppTheme();
  return (
    <SectionCard>
      <View style={styles.featureRow}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name={icon} size={24} color={colors.teal} />
        </View>
        <View style={styles.featureCopy}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
        </View>
      </View>
    </SectionCard>
  );
}

export function InfoCard({ title, description }: { title: string; description: string }) {
  const { colors } = useAppTheme();
  return <SectionCard><Text style={[styles.title, { color: colors.text }]}>{title}</Text><Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text></SectionCard>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureCopy: { flex: 1, gap: spacing.xs },
  icon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.subheading, fontWeight: '800' },
  description: { fontSize: typography.body, lineHeight: 22 },
});
