import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { getMatchScoreColors } from '../../utils/matchScoreColors';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'outlined';
  expand?: boolean;
};

export function AppButton({ label, onPress, icon, variant = 'primary', expand }: ButtonProps) {
  const { colors } = useAppTheme();
  const isOutlined = variant === 'outlined';
  const backgroundColor = isOutlined ? 'transparent' : variant === 'primary' ? colors.blue : colors.teal;
  const textColor = isOutlined ? colors.blue : '#FFFFFF';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        expand && styles.buttonExpand,
        { backgroundColor, borderColor: colors.blue },
        pressed && styles.pressed,
      ]}
    >
      {icon && <Ionicons name={icon} size={20} color={textColor} />}
      <Text maxFontSizeMultiplier={1.4} style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress }: Pick<ButtonProps, 'icon' | 'label' | 'onPress'>) {
  const { colors } = useAppTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.surfaceMuted }, pressed && styles.pressed]}>
      <Ionicons name={icon ?? 'help-circle-outline'} size={22} color={colors.blue} />
    </Pressable>
  );
}

export function Badge({ label }: { label: string }) {
  const { colors } = useAppTheme();
  return <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}><Text style={[styles.badgeText, { color: colors.teal }]}>{label}</Text></View>;
}

type MatchScoreBadgeProps = {
  score: number | null | undefined;
  confidenceLabel: string;
};

export function MatchScoreBadge({ score, confidenceLabel }: MatchScoreBadgeProps) {
  const { colors } = useAppTheme();
  if (score == null) {
    return <Badge label={confidenceLabel} />;
  }
  const rounded = Math.round(score);
  const palette = getMatchScoreColors(rounded, colors);
  return (
    <View style={styles.matchScoreRow}>
      <View style={[styles.matchBadge, { backgroundColor: palette.accent, borderColor: palette.accent }]}>
        <Text maxFontSizeMultiplier={1.3} style={[styles.matchScore, { color: '#FFFFFF' }]}>
          ★ {rounded}%
        </Text>
        <Text maxFontSizeMultiplier={1.3} style={[styles.matchLabel, { color: '#FFFFFF' }]}>Match</Text>
      </View>
      <Badge label={confidenceLabel} />
    </View>
  );
}

export function AvatarPlaceholder() {
  const { colors } = useAppTheme();
  return <View accessibilityLabel="Profile avatar placeholder" style={[styles.avatar, { backgroundColor: colors.teal }]}><Ionicons name="person" size={22} color="#FFFFFF" /></View>;
}

export function LoadingSpinner() {
  const { colors } = useAppTheme();
  return <ActivityIndicator accessibilityLabel="Loading" color={colors.blue} size="large" />;
}

export function SkeletonLoader() {
  const { colors } = useAppTheme();
  return <View accessibilityLabel="Loading content" style={[styles.skeleton, { backgroundColor: colors.surfaceMuted }]} />;
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  buttonExpand: { flex: 1, alignSelf: 'stretch', width: '100%' },
  buttonText: { fontSize: typography.button, fontWeight: '700' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  iconButton: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill },
  badgeText: { fontSize: typography.caption, fontWeight: '700' },
  matchScoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  matchScore: { fontSize: typography.subheading, fontWeight: '900', letterSpacing: -0.3 },
  matchLabel: { fontSize: typography.caption, fontWeight: '800' },
  avatar: { width: 48, height: 48, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center' },
  skeleton: { height: 18, borderRadius: radius.sm, width: '100%' },
});
