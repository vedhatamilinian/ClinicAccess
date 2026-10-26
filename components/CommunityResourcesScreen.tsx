import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COMMUNITY_RESOURCE_CATEGORIES } from '../constants/communityResourceCategories';
import { radius, spacing, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCommunityResources } from '../hooks/useCommunityResources';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useUserLocation } from '../hooks/useUserLocation';
import { CommunityResourceCategory } from '../types/communityResource';
import { EmptyState, ScreenContainer } from './layout';
import { ResourceCard } from './ResourceCard';
import { LegalDisclaimer } from './LegalDisclaimer';
import { AppButton, LoadingSpinner } from './ui';

const DISTANCE_OPTIONS: { value: number | undefined; label: string }[] = [
  { value: undefined, label: 'Any distance' },
  { value: 10, label: '10 mi' },
  { value: 25, label: '25 mi' },
];

export function CommunityResourcesScreen() {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  const [zipQuery, setZipQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 350);
  const [category, setCategory] = useState<CommunityResourceCategory | undefined>();
  const [maxDistance, setMaxDistance] = useState<number | undefined>();
  const [criteriaExpanded, setCriteriaExpanded] = useState(false);
  const { coords, permissionDenied, requestLocation } = useUserLocation();

  const listParams = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      zip_code: zipQuery.trim() || undefined,
      category,
      max_distance_miles: maxDistance,
      page_size: 100,
    }),
    [debouncedQuery, zipQuery, category, maxDistance],
  );

  const { resources, total, loading, error, retry } = useCommunityResources(listParams, coords);

  const activeCategoryLabel =
    category ? COMMUNITY_RESOURCE_CATEGORIES.find((c) => c.id === category)?.label ?? 'Category' : 'All categories';

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: colors.text }]}>Community Resources</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Find local support for food, transportation, housing, healthcare costs, and more.
      </Text>

      <View style={[styles.criteriaBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.criteriaHeading, { color: colors.text }]}>Search criteria</Text>

        <TextInput
          accessibilityLabel="Search community resources"
          placeholder="Search name or organization"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
        />
        <TextInput
          accessibilityLabel="ZIP code filter"
          placeholder="ZIP code (optional)"
          placeholderTextColor={colors.textMuted}
          value={zipQuery}
          onChangeText={setZipQuery}
          keyboardType="number-pad"
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
        />

        <View style={styles.thirdLine}>
          <Pressable
            accessibilityRole="button"
            onPress={requestLocation}
            style={[styles.toolChip, { borderColor: colors.border, backgroundColor: colors.surfaceMuted, flex: 1 }]}
          >
            <Ionicons name="locate-outline" size={16} color={colors.teal} />
            <Text style={[styles.toolText, { color: colors.text }]} numberOfLines={1}>
              {coords ? 'Update location' : 'Use my location'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: criteriaExpanded }}
            accessibilityLabel={criteriaExpanded ? 'Show fewer search options' : 'Show more search options'}
            onPress={() => setCriteriaExpanded((value) => !value)}
            style={[styles.moreButton, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
          >
            <Text style={[styles.toolText, { color: colors.blue }]}>{criteriaExpanded ? 'Less' : 'More'}</Text>
            <Ionicons name={criteriaExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.blue} />
          </Pressable>
        </View>

        {!criteriaExpanded && (
          <Text style={[styles.collapsedHint, { color: colors.textMuted }]}>
            {activeCategoryLabel}
            {maxDistance != null ? ` · Within ${maxDistance} mi` : ''}
          </Text>
        )}

        {criteriaExpanded && (
          <>
            <View style={styles.categoryWrap}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCategory(undefined)}
                style={[
                  styles.categoryChip,
                  { borderColor: colors.border, backgroundColor: !category ? colors.blue : colors.surface },
                ]}
              >
                <Text style={{ color: !category ? '#FFF' : colors.text, fontWeight: '700', fontSize: typography.caption }}>
                  All
                </Text>
              </Pressable>
              {COMMUNITY_RESOURCE_CATEGORIES.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => setCategory(item.id)}
                  style={[
                    styles.categoryChip,
                    { borderColor: colors.border, backgroundColor: category === item.id ? colors.blue : colors.surface },
                  ]}
                >
                  <Ionicons name={item.icon} size={14} color={category === item.id ? '#FFF' : colors.teal} />
                  <Text
                    style={{ color: category === item.id ? '#FFF' : colors.text, fontWeight: '700', fontSize: typography.caption }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.distanceRow}>
              {DISTANCE_OPTIONS.map((option) => (
                <Pressable
                  key={option.label}
                  accessibilityRole="button"
                  onPress={() => setMaxDistance(option.value)}
                  style={[
                    styles.distanceChip,
                    {
                      borderColor: colors.border,
                      backgroundColor: maxDistance === option.value ? colors.teal : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: maxDistance === option.value ? '#FFF' : colors.text,
                      fontSize: typography.caption,
                      fontWeight: '700',
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      {permissionDenied && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Location denied , enter a ZIP or browse by category.</Text>
      )}

      <Text style={[styles.count, { color: colors.textMuted }]}>{total} resource{total === 1 ? '' : 's'} found</Text>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <View style={styles.errorBlock}>
          <EmptyState title="Could not load resources" message={error} />
          <AppButton label="Retry" icon="refresh-outline" variant="outlined" onPress={retry} />
        </View>
      ) : resources.length === 0 ? (
        <EmptyState
          title="No matching resources"
          message="Try another category, clear filters, or call 211 for live referrals in Georgia."
        />
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ResourceCard resource={item} />}
        />
      )}

      <LegalDisclaimer />

      <View style={[styles.directoryCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.directoryTitle, { color: colors.text }]}>Need more options?</Text>
        <Text style={[styles.directoryBody, { color: colors.textMuted }]}>
          Dial <Text style={{ fontWeight: '800' }}>211</Text> or visit 211.org for up-to-date referrals. Availability changes , always confirm with the provider.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: typography.heading, fontWeight: '800', marginBottom: spacing.xs },
  subtitle: { fontSize: typography.body, lineHeight: 22, marginBottom: spacing.sm },
  criteriaBox: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, marginBottom: spacing.sm },
  criteriaHeading: { fontSize: typography.caption, fontWeight: '800', marginBottom: spacing.xs },
  input: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
  },
  thirdLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  collapsedHint: { fontSize: typography.caption, marginTop: 2 },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  distanceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  distanceChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  toolText: { fontSize: typography.caption, fontWeight: '700' },
  hint: { fontSize: typography.caption, marginBottom: spacing.xs },
  count: { fontSize: typography.caption, fontWeight: '800', marginBottom: spacing.sm },
  list: { gap: spacing.sm },
  errorBlock: { gap: spacing.sm },
  directoryCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg, marginBottom: spacing.lg },
  directoryTitle: { fontSize: typography.body, fontWeight: '800', marginBottom: spacing.xs },
  directoryBody: { fontSize: typography.caption, lineHeight: 18 },
});
