import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryLabel } from '../constants/communityResourceCategories';
import { cardShadow, radius, spacing, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useResourceFavorites } from '../hooks/useResourceFavorites';
import { CommunityResource } from '../types/communityResource';
import { openDirections, openPhoneCall } from '../utils/mapLinks';
import { isValidCoordinate } from '../utils/coordinates';

type Props = { resource: CommunityResource; compact?: boolean };

export function ResourceCard({ resource, compact }: Props) {
  const { colors } = useAppTheme();
  const { isResourceFavorite, toggleResourceFavorite } = useResourceFavorites();
  const favorite = isResourceFavorite(resource.id);
  const locationLine = resource.address
    ? `${resource.address}${resource.city ? `, ${resource.city}` : ''}`
    : resource.service_area || 'Service area , see details';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/community-resources/${resource.id}`)}
      style={({ pressed }) => [
        styles.card,
        cardShadow,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{resource.name}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? 'Remove from favorites' : 'Save to favorites'}
          onPress={(event) => {
            event.stopPropagation();
            toggleResourceFavorite(resource.id);
          }}
          hitSlop={8}
        >
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={22} color={favorite ? colors.error : colors.teal} />
        </Pressable>
      </View>
      <Text style={[styles.category, { color: colors.teal }]}>{categoryLabel(resource.category)}</Text>
      {!compact && <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>{resource.description}</Text>}
      <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>{locationLine}</Text>
      {resource.distance_miles != null && (
        <Text style={[styles.meta, { color: colors.textMuted }]}>~{resource.distance_miles.toFixed(1)} mi straight-line estimate</Text>
      )}
      <Text style={[styles.verification, { color: colors.textMuted }]}>
        {resource.verification_status === 'verified_authoritative' ? 'Verified official source' : 'Confirm details with provider'}
      </Text>
      <View style={styles.actions}>
        {resource.phone ? (
          <Pressable
            accessibilityRole="button"
            onPress={(e) => {
              e.stopPropagation();
              openPhoneCall(resource.phone);
            }}
            style={styles.action}
          >
            <Ionicons name="call-outline" size={18} color={colors.blue} />
            <Text style={[styles.actionText, { color: colors.blue }]}>Call</Text>
          </Pressable>
        ) : null}
        {resource.website ? (
          <Pressable
            accessibilityRole="button"
            onPress={(e) => {
              e.stopPropagation();
              Linking.openURL(resource.website!);
            }}
            style={styles.action}
          >
            <Ionicons name="globe-outline" size={18} color={colors.blue} />
            <Text style={[styles.actionText, { color: colors.blue }]}>Website</Text>
          </Pressable>
        ) : null}
        {(isValidCoordinate(resource.latitude, resource.longitude) || resource.address) && (
          <Pressable
            accessibilityRole="button"
            onPress={(e) => {
              e.stopPropagation();
              openDirections({
                latitude: resource.latitude != null ? resource.latitude : undefined,
                longitude: resource.longitude != null ? resource.longitude : undefined,
                address: locationLine,
                label: resource.name,
              });
            }}
            style={styles.action}
          >
            <Ionicons name="navigate-outline" size={18} color={colors.blue} />
            <Text style={[styles.actionText, { color: colors.blue }]}>Directions</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  name: { flex: 1, fontSize: typography.subheading, fontWeight: '800' },
  category: { fontSize: typography.caption, fontWeight: '800' },
  description: { fontSize: typography.body, lineHeight: 20 },
  meta: { fontSize: typography.caption, lineHeight: 17 },
  verification: { fontSize: typography.caption, fontStyle: 'italic' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: typography.caption, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
