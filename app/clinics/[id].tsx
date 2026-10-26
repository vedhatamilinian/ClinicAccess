import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NotFoundScreen } from '../../components/PlaceholderScreen';
import { AppHeader, Divider, EmptyState, ScreenContainer, SectionHeader } from '../../components/layout';
import { AppButton, LoadingSpinner, MatchScoreBadge } from '../../components/ui';
import { MatchExplanation } from '../../components/MatchExplanation';
import { RecommendationBreakdown } from '../../components/RecommendationBreakdown';
import { radius, spacing, typography } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { API_ENABLED } from '../../constants/api';
import { usePreferences } from '../../hooks/usePreferences';
import { createRecommendation } from '../../services/recommendationEngine';
import { useFavorites } from '../../hooks/useFavorites';
import { useClinicDetail } from '../../hooks/useClinicDetail';
import { useClinicRecommendation } from '../../hooks/useClinicRecommendation';
import { ClinicContactActions } from '../../components/ClinicContactActions';
import { ClinicHoursBlock } from '../../components/ClinicHoursBlock';
import { clinicReviewsRoute } from '../../utils/routes';
import { martaTransitSummary } from '../../utils/martaTransit';
import { LegalDisclaimer } from '../../components/LegalDisclaimer';

export default function ClinicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clinic, loading, error, notFound, source, retry } = useClinicDetail(id);
  const { colors } = useAppTheme();
  const { preferences } = usePreferences();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { recommendation: apiRecommendation, loading: recoLoading } = useClinicRecommendation(id, null);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingSpinner />
      </ScreenContainer>
    );
  }
  if (!loading && error && !clinic) {
    return (
      <ScreenContainer>
        <EmptyState title="API unavailable" message={error} />
        <AppButton label="Retry" icon="refresh-outline" onPress={retry} />
      </ScreenContainer>
    );
  }
  if (notFound || !clinic) return <NotFoundScreen />;
  const recommendation = API_ENABLED && apiRecommendation ? apiRecommendation : createRecommendation(clinic, preferences);
  const favorite = isFavorite(clinic.id);
  const distanceText = `${clinic.distanceMiles.toFixed(1)} miles away${
    recommendation.distanceIsEstimate ? ' (straight-line estimate)' : ''
  }`;
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/find-care'));

  return (
    <ScreenContainer>
      <AppHeader title={clinic.name} subtitle={clinic.address} />
      {source === 'bundled-demo' && (
        <Text style={[styles.sourceNote, { color: colors.textMuted }]}>
          Bundled demonstration clinic (EXPO_PUBLIC_API_BASE_URL is not set).
        </Text>
      )}
      <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.matchRow}>
          <View style={styles.matchBadges}>
            <MatchScoreBadge score={recommendation.score} confidenceLabel={recommendation.confidenceLabel} />
          </View>
          <View style={styles.summaryActions}>
            <SummaryIconButton
              icon="arrow-back"
              label="Back"
              color={colors.teal}
              onPress={goBack}
            />
            <SummaryIconButton
              icon={favorite ? 'heart' : 'heart-outline'}
              label={favorite ? 'Remove from favorites' : 'Save to favorites'}
              color={favorite ? colors.error : colors.teal}
              onPress={() => toggleFavorite(clinic.id)}
            />
            <SummaryIconButton
              icon="chatbubble-ellipses-outline"
              label="View Google reviews"
              color={colors.teal}
              onPress={() => router.push(clinicReviewsRoute(clinic.id))}
            />
          </View>
        </View>

        <View style={styles.metaBlock}>
          <MetaRow icon="navigate-outline" text={distanceText} />
          <ClinicHoursBlock clinic={clinic} defaultExpanded />
        </View>
        {recoLoading ? (
          <Text style={[styles.metaHint, { color: colors.textMuted }]}>Updating match score…</Text>
        ) : null}
      </View>

      <MatchExplanation recommendation={recommendation} />
      <View style={{ height: spacing.lg }} />
      <RecommendationBreakdown recommendation={recommendation} />
      <View style={{ height: spacing.md }} />
      <ClinicContactActions clinic={clinic} variant="full" />
      <SectionHeader title="Services" />
      <Text style={[styles.body, { color: colors.text }]}>
        {clinic.services.length
          ? clinic.services.join(' • ')
          : 'Services not listed in the imported source , contact the clinic.'}
      </Text>
      <Divider />
      <SectionHeader title="Access details" />
      <View style={styles.details}>
        <Detail
          icon="card-outline"
          label="Insurance"
          value={
            clinic.insuranceAccepted.length
              ? `${clinic.insuranceAccepted.join(', ')}${
                  clinic.dataSource === 'hrsa_hcsd' ? ' (typical for HRSA sites , confirm your plan)' : ''
                }`
              : 'Not listed , confirm with the clinic'
          }
        />
        <Detail
          icon="language-outline"
          label="Languages"
          value={
            clinic.languages.length
              ? clinic.languages.join(', ')
              : clinic.dataSource === 'hrsa_hcsd'
                ? 'Not in HRSA site data , ask about interpreter services'
                : 'Not listed , confirm with the clinic'
          }
        />
        <Detail
          icon="walk-outline"
          label="Transportation"
          value={
            martaTransitSummary(clinic.transitOptions ?? [], clinic.transitAvailable ?? null)
          }
        />
        <Detail
          icon="accessibility-outline"
          label="Accessibility"
          value={
            clinic.wheelchairAccessible === true
              ? 'Wheelchair accessible'
              : clinic.wheelchairAccessible === false
                ? 'Not listed as wheelchair accessible'
                : 'Not listed , call clinic to ask about access'
          }
        />
      </View>
      <LegalDisclaimer />
    </ScreenContainer>
  );
}

function SummaryIconButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.iconTap, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={24} color={color} />
    </Pressable>
  );
}

function MetaRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={[styles.metaText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

function Detail({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={22} color={colors.teal} />
      <View style={styles.detailText}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  matchBadges: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  summaryActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconTap: { padding: spacing.xs },
  pressed: { opacity: 0.75 },
  metaBlock: { gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  metaText: { flex: 1, fontSize: typography.body, lineHeight: 22 },
  metaHint: { fontSize: typography.caption },
  body: { fontSize: typography.body, lineHeight: 23 },
  details: { gap: spacing.md },
  detail: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  detailText: { flex: 1, gap: 2 },
  label: { fontSize: typography.caption, fontWeight: '700' },
  value: { fontSize: typography.body, lineHeight: 22 },
  sourceNote: { fontSize: typography.caption, fontWeight: '700', marginBottom: spacing.sm },
});
