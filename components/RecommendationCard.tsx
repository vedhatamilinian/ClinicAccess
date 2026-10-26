import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RecommendedClinic } from '../types';
import { cardShadow, radius, spacing, typography } from '../constants/theme';
import { useFavorites } from '../hooks/useFavorites';
import { useAppTheme } from '../hooks/useAppTheme';
import { Badge, MatchScoreBadge } from './ui';
import { formatClinicRatingLine } from '../utils/clinicRating';
import { ClinicHoursBlock } from './ClinicHoursBlock';
import { clinicDirectionsTarget, openDirections } from '../utils/mapLinks';
import { clinicReviewsRoute } from '../utils/routes';
import { martaTransitSummary } from '../utils/martaTransit';

export function RecommendationCard({ clinic }: { clinic: RecommendedClinic }) {
  const { colors } = useAppTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(clinic.id);
  const ratingLine = formatClinicRatingLine(clinic);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`View recommendation for ${clinic.name}`} onPress={() => router.push(`/clinics/${clinic.id}`)} style={({ pressed }) => [styles.card, cardShadow, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
      <View style={styles.titleBlock}>
        <Text style={[styles.name, { color: colors.text }]}>{clinic.name}</Text>
        {clinic.isSyntheticDemo && <Badge label="Fictional demo record" />}
        {!clinic.isSyntheticDemo && clinic.dataSource === 'hrsa_hcsd' && <Badge label="HRSA site data" />}
        <Text style={[styles.address, { color: colors.textMuted }]} numberOfLines={2}>{clinic.address}</Text>
      </View>

      <View style={styles.matchRow}>
        <View style={styles.matchBadges}>
          <MatchScoreBadge
            score={clinic.recommendation.score}
            confidenceLabel={clinic.recommendation.confidenceLabel}
          />
          {clinic.recommendation.eligibilityStatus === 'needs_verification' ? (
            <Badge label="Needs verification" />
          ) : null}
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Directions to ${clinic.name}`}
            onPress={(event) => {
              event.stopPropagation();
              openDirections(clinicDirectionsTarget(clinic));
            }}
            hitSlop={8}
            style={styles.iconTap}
          >
            <Ionicons name="navigate-outline" color={colors.teal} size={24} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={favorite ? `Remove ${clinic.name} from favorites` : `Save ${clinic.name} as a favorite`}
            onPress={(event) => {
              event.stopPropagation();
              toggleFavorite(clinic.id);
            }}
            hitSlop={8}
            style={styles.iconTap}
          >
            <Ionicons name={favorite ? 'heart' : 'heart-outline'} color={favorite ? colors.error : colors.teal} size={24} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Google reviews for ${clinic.name}`}
            onPress={(event) => {
              event.stopPropagation();
              router.push(clinicReviewsRoute(clinic.id));
            }}
            hitSlop={8}
            style={styles.iconTap}
          >
            <Ionicons name="chatbubble-ellipses-outline" color={colors.teal} size={24} />
          </Pressable>
        </View>
      </View>

      <Text style={[styles.reason, { color: colors.text }]} numberOfLines={2}>
        {clinic.recommendation.reasons[0] ?? `${clinic.distanceMiles.toFixed(1)} miles away.`}
      </Text>
      <View style={styles.metaBlock}>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {clinic.distanceMiles.toFixed(1)} mi
          {ratingLine ? ` · ${ratingLine}` : ''}
        </Text>
        <ClinicHoursBlock clinic={clinic} defaultExpanded={false} />
      </View>
      <Text style={[styles.coverage, { color: colors.textMuted }]} numberOfLines={2}>
        Insurance:{' '}
        {clinic.insuranceAccepted.length
          ? clinic.insuranceAccepted.join(', ')
          : 'Not listed , call the clinic'}
        {' · '}
        Languages:{' '}
        {clinic.languages.length ? clinic.languages.join(', ') : 'Not listed , ask about interpreters'}
      </Text>
      <Text style={[styles.coverage, { color: colors.textMuted }]} numberOfLines={1}>
        Transit:{' '}
        {martaTransitSummary(clinic.transitOptions ?? [], clinic.transitAvailable ?? null)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  titleBlock: { gap: spacing.xs },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  matchBadges: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconTap: { padding: spacing.xs },
  name: { fontSize: typography.subheading, fontWeight: '800' },
  address: { fontSize: typography.caption, lineHeight: 18 },
  reason: { fontSize: typography.body, lineHeight: 22 },
  metaBlock: { gap: 2 },
  meta: { fontSize: typography.caption, lineHeight: 18 },
  coverage: { fontSize: typography.caption, lineHeight: 18 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
