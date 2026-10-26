import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_ENABLED } from '../constants/api';
import { radius, spacing, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useClinicCatalog } from '../hooks/useClinicCatalog';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useMapClinicResults } from '../hooks/useMapClinicResults';
import { useRecommendations } from '../hooks/useRecommendations';
import { useUserLocation } from '../hooks/useUserLocation';
import { ClinicFilters, MapMinMatchScore, MapViewMode, RecommendedClinic, SortOption } from '../types';
import { defaultFilters } from '../utils/filters';
import { isValidCoordinate } from '../utils/coordinates';
import { markerColorForClinic } from '../utils/mapMarkers';
import { matchScoreTierThresholds } from '../utils/matchScoreColors';
import { RecommendationControls } from './forms/RecommendationControls';
import { EmptyState } from './layout';
import { MapClinicPreviewCard } from './map/MapClinicPreviewCard';
import { LegalDisclaimer } from './LegalDisclaimer';
import { AppButton, LoadingSpinner } from './ui';

const FULTON_REGION: Region = {
  latitude: 33.749,
  longitude: -84.388,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

const MIN_SCORE_OPTIONS: { value: MapMinMatchScore; label: string }[] = [
  { value: 'any', label: 'Any score' },
  { value: '51', label: `Good ${matchScoreTierThresholds.good}%+` },
  { value: '80', label: `Excellent ${matchScoreTierThresholds.excellent}%+` },
  { value: '95', label: `Strongest ${matchScoreTierThresholds.strongest}%+` },
];

export function InteractiveMapScreen() {
  const { colors } = useAppTheme();
  const mapRef = useRef<MapView>(null);
  const [query, setQuery] = useState('');
  const [zipQuery, setZipQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 350);
  const [filters, setFilters] = useState<ClinicFilters>(defaultFilters);
  const [sortOption, setSortOption] = useState<SortOption>('best-match');
  const [minMatchScore, setMinMatchScore] = useState<MapMinMatchScore>('any');
  const [viewMode, setViewMode] = useState<MapViewMode>('map');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { coords, permissionDenied, loading: locationLoading, requestLocation, clearLocation } = useUserLocation();

  const { clinics, loading, error, source, retry } = useClinicCatalog(debouncedQuery, filters);
  const {
    recommendations,
    loading: recoLoading,
    error: recoError,
    retry: retryReco,
  } = useRecommendations(
    clinics,
    filters,
    sortOption,
    debouncedQuery,
    coords ? { latitude: coords.latitude, longitude: coords.longitude, label: 'your device location' } : null,
  );

  const { mappable, unmapped } = useMapClinicResults(recommendations, zipQuery, minMatchScore, coords);
  const selectedClinic = useMemo(
    () => mappable.find((clinic) => clinic.id === selectedId) ?? recommendations.find((c) => c.id === selectedId) ?? null,
    [mappable, recommendations, selectedId],
  );

  const listLoading = (loading && clinics.length === 0) || (recoLoading && recommendations.length === 0);
  const listError = error ?? recoError;
  const distanceIsEstimate = coords != null;

  const fitToClinics = useCallback(
    (items: RecommendedClinic[]) => {
      const coordinates = items
        .filter((clinic) => isValidCoordinate(clinic.latitude, clinic.longitude))
        .map((clinic) => ({ latitude: clinic.latitude!, longitude: clinic.longitude! }));
      if (!mapRef.current || coordinates.length === 0) return;
      if (coordinates.length === 1) {
        mapRef.current.animateToRegion({
          ...coordinates[0],
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        });
        return;
      }
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 40, bottom: selectedId ? 280 : 120, left: 40 },
        animated: true,
      });
    },
    [selectedId],
  );

  const initialFitDone = useRef(false);
  useEffect(() => {
    if (viewMode !== 'map' || mappable.length === 0 || initialFitDone.current) return;
    fitToClinics(mappable);
    initialFitDone.current = true;
  }, [mappable.length, viewMode, fitToClinics]);

  const focusClinic = useCallback(
    (clinic: RecommendedClinic) => {
      setSelectedId(clinic.id);
      setViewMode('map');
      if (isValidCoordinate(clinic.latitude, clinic.longitude)) {
        mapRef.current?.animateToRegion({
          latitude: clinic.latitude!,
          longitude: clinic.longitude!,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        });
      }
    },
    [],
  );

  const onRetry = () => {
    retry();
    retryReco();
  };

  if (!API_ENABLED) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.pad}>
          <Text style={[styles.title, { color: colors.text }]}>Map</Text>
          <EmptyState
            title="Map unavailable"
            message="Clinic locations load when the app is connected to your clinic data server. Configure the app environment and start the backend to use the map."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.pad}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Map</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="My preferences"
            onPress={() => router.push('/preferences')}
            hitSlop={8}
          >
            <Ionicons name="options-outline" size={22} color={colors.teal} />
          </Pressable>
        </View>

        <TextInput
          accessibilityLabel="Search clinics"
          placeholder="Search name, service, or address"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        />
        <TextInput
          accessibilityLabel="Filter by ZIP code"
          placeholder="ZIP code (optional)"
          placeholderTextColor={colors.textMuted}
          value={zipQuery}
          onChangeText={setZipQuery}
          keyboardType="number-pad"
          maxLength={10}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        />

        <View style={styles.toolbar}>
          <View style={styles.viewToggle}>
            {(['map', 'list'] as MapViewMode[]).map((mode) => (
              <Pressable
                key={mode}
                accessibilityRole="button"
                accessibilityState={{ selected: viewMode === mode }}
                onPress={() => setViewMode(mode)}
                style={[
                  styles.toggleChip,
                  { borderColor: colors.border, backgroundColor: viewMode === mode ? colors.blue : colors.surface },
                ]}
              >
                <Text style={{ color: viewMode === mode ? '#FFF' : colors.text, fontWeight: '700', fontSize: typography.caption }}>
                  {mode === 'map' ? 'Map' : 'List'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: filtersExpanded }}
            onPress={() => setFiltersExpanded((value) => !value)}
            style={[styles.filterButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <Ionicons name="filter-outline" size={18} color={colors.teal} />
            <Text style={[styles.filterButtonText, { color: colors.text }]}>Filters</Text>
          </Pressable>
        </View>

        <View style={styles.scoreRow}>
          {MIN_SCORE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => setMinMatchScore(option.value)}
              style={[
                styles.scoreChip,
                {
                  borderColor: colors.border,
                  backgroundColor: minMatchScore === option.value ? colors.teal : colors.surface,
                },
              ]}
            >
              <Text style={{ color: minMatchScore === option.value ? '#FFF' : colors.text, fontSize: typography.caption, fontWeight: '700' }}>
                {option.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
              onPress={() => {
              setQuery('');
              setZipQuery('');
              setFilters(defaultFilters);
              setMinMatchScore('any');
              initialFitDone.current = false;
            }}
            style={[styles.clearChip, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.teal, fontSize: typography.caption, fontWeight: '700' }}>Clear</Text>
          </Pressable>
        </View>

        {filtersExpanded && (
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
        )}

        <Text style={[styles.count, { color: colors.textMuted }]}>
          {mappable.length} on map · {recommendations.length} matching
          {unmapped.length > 0 ? ` · ${unmapped.length} without map coordinates` : ''}
          {source === 'live-api' ? '' : ''}
        </Text>
      </View>

      {listLoading ? (
        <View style={styles.centered}>
          <LoadingSpinner />
        </View>
      ) : listError && recommendations.length === 0 ? (
        <View style={styles.pad}>
          <EmptyState title="API unavailable" message={listError} />
          <AppButton label="Retry" icon="refresh-outline" onPress={onRetry} />
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          data={[...mappable, ...unmapped]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title="No clinics found" message="Try adjusting search or filters." />}
          ListFooterComponent={<View style={styles.pad}><LegalDisclaimer /></View>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => focusClinic(item)}
              style={[styles.listRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.listTitle, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.listMeta, { color: colors.textMuted }]} numberOfLines={1}>{item.address}</Text>
              <Text style={[styles.listMeta, { color: colors.teal }]}>
                {item.recommendation.score}% match
                {!isValidCoordinate(item.latitude, item.longitude) ? ' · Map location unavailable' : ''}
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.mapWrap}>
          <MapView ref={mapRef} style={styles.map} initialRegion={FULTON_REGION} showsUserLocation={coords != null} showsMyLocationButton={false}>
            {mappable.map((clinic) => (
                <Marker
                  key={clinic.id}
                  coordinate={{ latitude: clinic.latitude!, longitude: clinic.longitude! }}
                  title={clinic.name}
                  pinColor={markerColorForClinic(clinic, colors)}
                  onPress={() => setSelectedId(clinic.id)}
                />
            ))}
          </MapView>

          <View style={styles.mapControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recenter on my location"
              onPress={async () => {
                const loc = await requestLocation();
                if (loc) {
                  mapRef.current?.animateToRegion({
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    latitudeDelta: 0.08,
                    longitudeDelta: 0.08,
                  });
                }
              }}
              style={[styles.mapControlBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="locate-outline" size={20} color={colors.blue} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show all clinics"
              onPress={() => fitToClinics(mappable)}
              style={[styles.mapControlBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="scan-outline" size={20} color={colors.blue} />
            </Pressable>
          </View>

          {permissionDenied && (
            <View style={[styles.banner, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.bannerText, { color: colors.textMuted }]}>
                Location denied , distances use Atlanta center. Search by ZIP or pan the map manually.
              </Text>
            </View>
          )}

          {selectedClinic && (
            <View style={styles.preview}>
              <MapClinicPreviewCard
                clinic={selectedClinic}
                distanceIsEstimate={distanceIsEstimate}
                onDismiss={() => setSelectedId(null)}
              />
            </View>
          )}

          {!selectedClinic && mappable.length === 0 && (
            <View style={[styles.banner, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.bannerText, { color: colors.textMuted }]}>No clinics with map coordinates match these filters.</Text>
            </View>
          )}
        </View>
      )}

      {locationLoading && (
        <View style={styles.locating}>
          <Text style={{ color: colors.textMuted, fontSize: typography.caption }}>Getting location…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  pad: { paddingHorizontal: spacing.md },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: typography.heading, fontWeight: '800' },
  input: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    marginBottom: spacing.xs,
  },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.xs },
  viewToggle: { flexDirection: 'row', gap: spacing.xs },
  toggleChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, minHeight: 36, justifyContent: 'center' },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, minHeight: 36 },
  filterButtonText: { fontSize: typography.caption, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  scoreChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  clearChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  count: { fontSize: typography.caption, fontWeight: '700', marginBottom: spacing.xs },
  mapWrap: { flex: 1, position: 'relative' },
  map: { ...StyleSheet.absoluteFill },
  mapControls: { position: 'absolute', top: spacing.sm, right: spacing.md, gap: spacing.sm },
  mapControlBtn: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  preview: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.sm },
  banner: { position: 'absolute', top: spacing.sm, left: spacing.md, right: spacing.md, borderRadius: radius.md, padding: spacing.sm },
  bannerText: { fontSize: typography.caption, lineHeight: 17 },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  listRow: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  listTitle: { fontSize: typography.body, fontWeight: '800' },
  listMeta: { fontSize: typography.caption },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  locating: { position: 'absolute', bottom: spacing.md, alignSelf: 'center' },
});
