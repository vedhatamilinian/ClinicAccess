import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { radius, spacing, typography, cardShadow } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useFavorites } from '../../hooks/useFavorites';
import { RecommendedClinic } from '../../types';
import { formatFacilityType } from '../../utils/mapMarkers';
import { openDirections, openPhoneCall } from '../../utils/mapLinks';
import { AppButton } from '../ui';

type Props = {
  clinic: RecommendedClinic;
  distanceIsEstimate: boolean;
  onDismiss: () => void;
};

export function MapClinicPreviewCard({ clinic, distanceIsEstimate, onDismiss }: Props) {
  const { colors } = useAppTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(clinic.id);

  const insuranceLine =
    clinic.insuranceAccepted.length > 0
      ? clinic.dataSource === 'hrsa_hcsd'
        ? `${clinic.insuranceAccepted.join(', ')} (typical , confirm your plan)`
        : clinic.insuranceAccepted.join(', ')
      : 'Insurance not verified';

  const languageLine =
    clinic.languages.length > 0
      ? clinic.languages.join(', ')
      : clinic.dataSource === 'hrsa_hcsd'
        ? 'Languages not in HRSA data , ask about interpreters'
        : 'Languages not listed';

  const accessibilityLine =
    clinic.wheelchairAccessible === true
      ? 'Wheelchair accessible (listed)'
      : clinic.wheelchairAccessible === false
        ? 'Wheelchair access not listed'
        : 'Accessibility not verified';

  const verificationLine = clinic.isSyntheticDemo
    ? 'Fictional demo record'
    : clinic.dataSource
      ? `Source: ${clinic.dataSource}`
      : 'Verification status unavailable';

  return (
    <View style={[styles.card, cardShadow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{clinic.name}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{formatFacilityType(clinic.facilityType)}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close clinic preview" onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </Pressable>
      </View>
      <Text style={[styles.address, { color: colors.text }]} numberOfLines={2}>{clinic.address}</Text>
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        {distanceIsEstimate ? '~' : ''}{clinic.distanceMiles.toFixed(1)} mi straight-line estimate · ★ {clinic.recommendation.score}% match
      </Text>
      {clinic.services.length > 0 && (
        <Text style={[styles.detail, { color: colors.text }]} numberOfLines={2}>
          Services: {clinic.services.slice(0, 4).join(' • ')}
        </Text>
      )}
      <Text style={[styles.detail, { color: colors.textMuted }]} numberOfLines={1}>Insurance: {insuranceLine}</Text>
      <Text style={[styles.detail, { color: colors.textMuted }]} numberOfLines={1}>Languages: {languageLine}</Text>
      <Text style={[styles.detail, { color: colors.textMuted }]} numberOfLines={1}>{accessibilityLine}</Text>
      <Text style={[styles.verification, { color: colors.teal }]}>{verificationLine}</Text>
      <View style={styles.actions}>
        <AppButton label="Details" icon="document-text-outline" variant="secondary" expand onPress={() => router.push(`/clinics/${clinic.id}`)} />
        <AppButton
          label="Directions"
          icon="navigate-outline"
          variant="outlined"
          expand
          onPress={() => openDirections({ latitude: clinic.latitude, longitude: clinic.longitude, address: clinic.address, label: clinic.name })}
        />
      </View>
      <View style={styles.actions}>
        {clinic.phone ? (
          <AppButton label="Call" icon="call-outline" variant="outlined" expand onPress={() => openPhoneCall(clinic.phone!)} />
        ) : null}
        <AppButton
          label={favorite ? 'Unfavorite' : 'Favorite'}
          icon={favorite ? 'heart-dislike-outline' : 'heart-outline'}
          variant="outlined"
          expand
          onPress={() => toggleFavorite(clinic.id)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, maxHeight: 340 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  name: { fontSize: typography.subheading, fontWeight: '800' },
  address: { fontSize: typography.caption, lineHeight: 18 },
  meta: { fontSize: typography.caption, fontWeight: '600' },
  detail: { fontSize: typography.caption, lineHeight: 17 },
  verification: { fontSize: typography.caption, fontWeight: '700', marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
