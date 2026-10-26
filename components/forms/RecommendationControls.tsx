import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClinicFilters, SortOption } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { radius, spacing, typography } from '../../constants/theme';
import { sortLabels } from '../../utils/sorting';

type Props = {
  filters: ClinicFilters;
  onChangeFilters: (filters: ClinicFilters) => void;
  sortOption: SortOption;
  onChangeSort: (sort: SortOption) => void;
  usingLocation?: boolean;
  locationLoading?: boolean;
  onToggleLocation?: () => void;
  locationPermissionDenied?: boolean;
};

function Toggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: active }} onPress={onPress} style={({ pressed }) => [styles.chip, { backgroundColor: active ? colors.blue : colors.surface, borderColor: active ? colors.blue : colors.border }, pressed && styles.pressed]}><Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.text }]}>{active ? '✓ ' : ''}{label}</Text></Pressable>;
}

export function RecommendationControls({
  filters,
  onChangeFilters,
  sortOption,
  onChangeSort,
  usingLocation = false,
  locationLoading = false,
  onToggleLocation,
  locationPermissionDenied = false,
}: Props) {
  const { colors } = useAppTheme();
  const toggle = (key: keyof ClinicFilters) => onChangeFilters({ ...filters, [key]: !filters[key] });
  const locationLabel = locationLoading
    ? 'Finding location…'
    : usingLocation
      ? 'Using my location'
      : 'Use my location';
  return (
    <View style={styles.container}>
      <Text style={[styles.label, styles.labelFirst, { color: colors.text }]}>Filters</Text>
      <View style={styles.chips}>
        <Toggle label="My insurance" active={filters.insuranceOnly} onPress={() => toggle('insuranceOnly')} />
        <Toggle label="My language" active={filters.languageOnly} onPress={() => toggle('languageOnly')} />
        <Toggle label="Open now" active={filters.openNowOnly} onPress={() => toggle('openNowOnly')} />
        <Toggle label="Wheelchair access" active={filters.wheelchairAccessibleOnly} onPress={() => toggle('wheelchairAccessibleOnly')} />
        {onToggleLocation ? (
          <Toggle
            label={locationLabel}
            active={usingLocation}
            onPress={() => {
              if (!locationLoading) onToggleLocation();
            }}
          />
        ) : null}
        <Toggle label="Public transit" active={filters.transitOnly} onPress={() => toggle('transitOnly')} />
      </View>
      {locationPermissionDenied && !usingLocation ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Location permission denied , distance scoring omitted.</Text>
      ) : null}
      <Text style={[styles.label, { color: colors.text }]}>Maximum distance</Text>
      <View style={styles.chips}>
        {[undefined, 3, 5].map((distance) => <Toggle key={distance ?? 'any'} label={distance ? `${distance} miles` : 'Any distance'} active={filters.maxDistance === distance} onPress={() => onChangeFilters({ ...filters, maxDistance: distance })} />)}
      </View>
      <Text style={[styles.label, { color: colors.text }]}>Sort by</Text>
      <View style={styles.chips}>
        {(Object.keys(sortLabels) as SortOption[]).map((option) => <Toggle key={option} label={sortLabels[option]} active={sortOption === option} onPress={() => onChangeSort(option)} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, marginBottom: spacing.sm },
  label: { fontSize: typography.caption, fontWeight: '800', marginTop: spacing.sm },
  labelFirst: { marginTop: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 40, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, justifyContent: 'center' },
  chipText: { fontSize: typography.caption, fontWeight: '700' },
  pressed: { opacity: 0.82 },
  hint: { fontSize: typography.caption, lineHeight: 18 },
});
