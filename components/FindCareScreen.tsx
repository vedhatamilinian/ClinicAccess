import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { EmptyState, ScreenContainer, SectionHeader } from './layout';
import { AppButton } from './ui';
import { radius, spacing, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationControls } from './forms/RecommendationControls';
import { defaultFilters } from '../utils/filters';
import { ClinicFilters, SortOption } from '../types';
import { useRecommendations } from '../hooks/useRecommendations';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { useClinicCatalog } from '../hooks/useClinicCatalog';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useUserLocation } from '../hooks/useUserLocation';
import { LegalDisclaimer } from './LegalDisclaimer';
import { LoadingSpinner } from './ui';

export function FindCareScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? '');
  const debouncedQuery = useDebouncedValue(query, 350);
  const [filters, setFilters] = useState<ClinicFilters>(defaultFilters);
  const [sortOption, setSortOption] = useState<SortOption>('best-match');
  const { colors } = useAppTheme();
  const { coords, permissionDenied, loading: locationLoading, requestLocation, clearLocation } = useUserLocation({
    requestOnMount: true,
  });
  const { clinics, loading, refreshing, error, source, retry } = useClinicCatalog(debouncedQuery, filters);
  const origin = coords ? { latitude: coords.latitude, longitude: coords.longitude, label: 'your device location' } : null;
  const {
    recommendations,
    loading: recoLoading,
    error: recoError,
    retry: retryReco,
  } = useRecommendations(clinics, filters, sortOption, debouncedQuery, origin);
  const { addRecentSearch } = useRecentSearches();
  useEffect(() => {
    if (q) setQuery(q);
  }, [q]);
  const visibleClinics = recommendations;
  const listLoading = (loading && clinics.length === 0) || (recoLoading && visibleClinics.length === 0);
  const listError = error ?? recoError;
  const onRetry = () => {
    retry();
    retryReco();
  };
  return (
    <ScreenContainer>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]}>Find Care</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="My preferences"
          onPress={() => router.push('/preferences')}
          hitSlop={8}
          style={({ pressed }) => [styles.prefsButton, pressed && styles.pressed]}
        >
          <Ionicons name="options-outline" size={22} color={colors.teal} />
        </Pressable>
      </View>

      {source === 'api-unavailable' && error && (
        <View style={styles.errorBanner}>
          <Text style={[styles.errorText, { color: colors.textMuted }]} numberOfLines={3}>
            API unreachable. Check backend URL and network.
          </Text>
          <AppButton label="Retry" icon="refresh-outline" variant="outlined" onPress={retry} />
        </View>
      )}

      <TextInput
        accessibilityLabel="Search clinics by name, neighborhood, or service"
        autoCapitalize="none"
        placeholder="Search clinics by name, neighborhood, or service"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => addRecentSearch(query)}
        returnKeyType="search"
        style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
      />

      <RecommendationControls
        filters={filters}
        onChangeFilters={setFilters}
        sortOption={sortOption}
        onChangeSort={setSortOption}
        usingLocation={coords != null}
        locationLoading={locationLoading}
        locationPermissionDenied={permissionDenied}
        onToggleLocation={() => {
          if (coords) clearLocation();
          else requestLocation();
        }}
      />

      <SectionHeader
        compact
        title={`${visibleClinics.length} clinic${visibleClinics.length === 1 ? '' : 's'}${refreshing ? ' · updating…' : ''}`}
      />

      <View style={styles.list}>
        {listLoading ? (
          <LoadingSpinner />
        ) : listError && visibleClinics.length === 0 ? (
          <EmptyState title="API unavailable" message={listError} />
        ) : visibleClinics.length ? (
          visibleClinics.map((clinic) => <RecommendationCard key={clinic.id} clinic={clinic} />)
        ) : (
          <EmptyState
            title="No clinics found"
            message={
              source === 'live-api' && clinics.length === 0
                ? 'Import Fulton HRSA data (backend/data/README.md), then reload.'
                : 'Try another search or reset filters above.'
            }
          />
        )}
      </View>
      <LegalDisclaimer />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: { fontSize: typography.heading, fontWeight: '800' },
  prefsButton: { padding: spacing.xs },
  pressed: { opacity: 0.75 },
  search: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    marginBottom: spacing.sm,
  },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  errorText: { flex: 1, fontSize: typography.caption, lineHeight: 18 },
  list: { gap: spacing.sm, marginTop: spacing.xs },
});
