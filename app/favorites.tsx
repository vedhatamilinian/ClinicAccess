import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, EmptyState, ScreenBottomBar, ScreenContainer } from '../components/layout';
import { RecommendationCard } from '../components/RecommendationCard';
import { ResourceCard } from '../components/ResourceCard';
import { useFavorites } from '../hooks/useFavorites';
import { useResourceFavorites } from '../hooks/useResourceFavorites';
import { useRecommendations } from '../hooks/useRecommendations';
import { useCommunityResources } from '../hooks/useCommunityResources';
import { defaultFilters } from '../utils/filters';
import { useClinicCatalog } from '../hooks/useClinicCatalog';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, spacing, typography } from '../constants/theme';
import { AppButton } from '../components/ui';
import { goBackToProfile } from '../utils/navigation';

type FavoritesTab = 'clinics' | 'resources';

export default function FavoritesScreen() {
  const { colors } = useAppTheme();
  const [tab, setTab] = useState<FavoritesTab>('clinics');
  const { favoriteIds } = useFavorites();
  const { resourceFavoriteIds } = useResourceFavorites();
  const { clinics } = useClinicCatalog('', defaultFilters);
  const { recommendations } = useRecommendations(clinics, defaultFilters, 'best-match', '');
  const resourceParams = useMemo(() => ({ page_size: 100 }), []);
  const { resources } = useCommunityResources(resourceParams, null);

  const favoriteClinics = recommendations.filter((clinic) => favoriteIds.includes(clinic.id));
  const favoriteResources = resources.filter((resource) => resourceFavoriteIds.includes(resource.id));

  return (
    <ScreenContainer
      footer={
        <ScreenBottomBar>
          <AppButton label="Back to Profile" icon="arrow-back-outline" variant="outlined" expand onPress={goBackToProfile} />
        </ScreenBottomBar>
      }
    >
      <AppHeader title="Favorites" subtitle="Saved clinics and community resources on this device." />
      <View style={styles.tabs}>
        {(['clinics', 'resources'] as FavoritesTab[]).map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === key }}
            onPress={() => setTab(key)}
            style={[
              styles.tab,
              { borderColor: colors.border, backgroundColor: tab === key ? colors.blue : colors.surface },
            ]}
          >
            <Text style={{ color: tab === key ? '#FFF' : colors.text, fontWeight: '800' }}>
              {key === 'clinics' ? `Clinics (${favoriteClinics.length})` : `Resources (${favoriteResources.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.list}>
        {tab === 'clinics' ? (
          favoriteClinics.length ? (
            favoriteClinics.map((clinic) => <RecommendationCard key={clinic.id} clinic={clinic} />)
          ) : (
            <EmptyState title="No saved clinics yet" message="Tap the heart on a clinic to save it here." />
          )
        ) : favoriteResources.length ? (
          favoriteResources.map((resource) => <ResourceCard key={resource.id} resource={resource} compact />)
        ) : (
          <EmptyState title="No saved resources yet" message="Tap the heart on a community resource to save it here." />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tab: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  list: { gap: spacing.sm },
});
