import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clinic } from '../../types';
import { cardShadow, radius, spacing, typography } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { formatClinicRatingLine } from '../../utils/clinicRating';
import { ClinicHoursBlock } from '../ClinicHoursBlock';

export function ClinicCard({ clinic }: { clinic: Clinic }) {
  const { colors } = useAppTheme();
  const ratingLine = formatClinicRatingLine(clinic);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View details for ${clinic.name}`}
      onPress={() => router.push(`/clinics/${clinic.id}`)}
      style={({ pressed }) => [styles.card, cardShadow, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name="medkit-outline" color={colors.teal} size={24} />
      </View>
      <Text style={[styles.name, { color: colors.text }]}>{clinic.name}</Text>
      <Text style={[styles.address, { color: colors.textMuted }]} numberOfLines={1}>{clinic.address}</Text>
      <ClinicHoursBlock clinic={clinic} defaultExpanded={false} />
      <View style={styles.stats}>
        {ratingLine ? <Text style={[styles.stat, { color: colors.text }]}>{ratingLine}</Text> : null}
        <Text style={[styles.stat, { color: colors.text }]}>{clinic.distanceMiles.toFixed(1)} mi away</Text>
      </View>
      <Text style={[styles.services, { color: colors.teal }]} numberOfLines={1}>{clinic.services.join(' • ')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: typography.subheading, fontWeight: '800' },
  address: { fontSize: typography.caption },
  stats: { flexDirection: 'row', gap: spacing.lg },
  stat: { fontSize: typography.caption, fontWeight: '700' },
  services: { fontSize: typography.caption, fontWeight: '700' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
