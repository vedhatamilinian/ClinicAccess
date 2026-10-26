import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryLabel } from '../../constants/communityResourceCategories';
import { API_ENABLED } from '../../constants/api';
import { radius, spacing, typography } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useResourceFavorites } from '../../hooks/useResourceFavorites';
import { useUserLocation } from '../../hooks/useUserLocation';
import { fetchCommunityResourceById } from '../../services/api/communityResourcesApi';
import { CommunityResource } from '../../types/communityResource';
import { AppHeader, Divider, EmptyState, ScreenContainer } from '../../components/layout';
import { AppButton, LoadingSpinner } from '../../components/ui';
import { openDirections, openPhoneCall } from '../../utils/mapLinks';
import { isValidCoordinate } from '../../utils/coordinates';

export default function CommunityResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { coords } = useUserLocation();
  const { isResourceFavorite, toggleResourceFavorite } = useResourceFavorites();
  const [resource, setResource] = useState<CommunityResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!API_ENABLED || !id) {
      setError('API not configured.');
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCommunityResourceById(id, coords ?? undefined)
      .then(setResource)
      .catch(() => setError('Could not load this resource.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id, coords?.latitude, coords?.longitude]);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingSpinner />
      </ScreenContainer>
    );
  }

  if (error || !resource) {
    return (
      <ScreenContainer>
        <EmptyState title="Resource unavailable" message={error ?? 'Not found'} />
        <AppButton label="Back" icon="arrow-back-outline" variant="outlined" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  const favorite = isResourceFavorite(resource.id);
  const addressLine = resource.address
    ? `${resource.address}, ${resource.city}, ${resource.state} ${resource.zip_code}`.replace(/ ,/g, ',')
    : resource.service_area;

  return (
    <ScreenContainer>
      <AppHeader title={resource.name} subtitle={resource.organization_name} />
      <Text style={[styles.category, { color: colors.teal }]}>{categoryLabel(resource.category)}</Text>
      <Text style={[styles.body, { color: colors.text }]}>{resource.description}</Text>

      {resource.distance_miles != null && (
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          ~{resource.distance_miles.toFixed(1)} mi straight-line estimate from your location
        </Text>
      )}

      <Divider />
      <Section label="Services" value={resource.services_offered.length ? resource.services_offered.join(' • ') : 'Not listed , contact provider'} />
      <Section label="Eligibility" value={resource.eligibility_requirements || 'Confirm eligibility with the organization.'} />
      <Section label="Cost" value={resource.cost_information || 'Not published , confirm with provider.'} />
      <Section label="Hours" value={resource.hours || 'Not published , confirm with provider.'} />
      <Section label="Service area" value={resource.service_area || 'Not listed'} />
      <Section label="Address" value={addressLine} />
      <Section
        label="Languages"
        value={resource.languages_supported.length ? resource.languages_supported.join(', ') : 'Not listed , ask about interpreters'}
      />
      <Section label="Accessibility" value={resource.accessibility_information || 'Not listed , contact provider'} />
      <Section
        label="Appointment"
        value={
          resource.appointment_required === true
            ? 'Appointment may be required , confirm'
            : resource.appointment_required === false
              ? 'Walk-in may be available , confirm hours'
              : 'Not specified'
        }
      />

      <Text style={[styles.source, { color: colors.teal }]}>
        Source: {resource.source_name}
        {resource.last_verified_at ? ` · Verified ${resource.last_verified_at.slice(0, 10)}` : ''}
      </Text>
      {resource.source_url ? (
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(resource.source_url!)}>
          <Text style={[styles.link, { color: colors.blue }]}>{resource.source_url}</Text>
        </Pressable>
      ) : null}

      <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
        Programs change. Confirm availability, eligibility, and hours directly with the organization before visiting.
      </Text>

      <View style={styles.actions}>
        <AppButton label="Back" icon="arrow-back-outline" variant="outlined" expand onPress={() => router.back()} />
        <AppButton
          label={favorite ? 'Unfavorite' : 'Favorite'}
          icon={favorite ? 'heart-dislike-outline' : 'heart-outline'}
          variant="outlined"
          expand
          onPress={() => toggleResourceFavorite(resource.id)}
        />
      </View>
      <View style={styles.actions}>
        {resource.phone ? <AppButton label="Call" icon="call-outline" expand onPress={() => openPhoneCall(resource.phone)} /> : null}
        {resource.website ? (
          <AppButton label="Website" icon="globe-outline" variant="secondary" expand onPress={() => Linking.openURL(resource.website!)} />
        ) : null}
      </View>
      {(isValidCoordinate(resource.latitude, resource.longitude) || resource.address) && (
        <AppButton
          label="Get directions"
          icon="navigate-outline"
          onPress={() =>
            openDirections({
              latitude: resource.latitude != null ? resource.latitude : undefined,
              longitude: resource.longitude != null ? resource.longitude : undefined,
              address: addressLine,
              label: resource.name,
            })
          }
        />
      )}
    </ScreenContainer>
  );
}

function Section({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.sectionValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  category: { fontSize: typography.caption, fontWeight: '800', marginBottom: spacing.sm },
  body: { fontSize: typography.body, lineHeight: 23, marginBottom: spacing.sm },
  meta: { fontSize: typography.caption, marginBottom: spacing.sm },
  section: { marginBottom: spacing.md, gap: 2 },
  sectionLabel: { fontSize: typography.caption, fontWeight: '800' },
  sectionValue: { fontSize: typography.body, lineHeight: 22 },
  source: { fontSize: typography.caption, fontWeight: '700', marginTop: spacing.sm },
  link: { fontSize: typography.caption, marginBottom: spacing.sm },
  disclaimer: { fontSize: typography.caption, lineHeight: 18, marginVertical: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
});
