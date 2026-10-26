import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { GoogleReviewList } from './GoogleReviewList';
import { AppHeader, ScreenContainer, SectionHeader } from './layout';
import { AppButton, LoadingSpinner } from './ui';
import { spacing, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useClinicDetail } from '../hooks/useClinicDetail';
import { formatClinicRatingLine } from '../utils/clinicRating';

type Props = { clinicId: string };

export function ClinicReviewsScreen({ clinicId }: Props) {
  const { colors } = useAppTheme();
  const { clinic, loading, error, notFound, retry } = useClinicDetail(clinicId);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingSpinner />
      </ScreenContainer>
    );
  }

  if (notFound || !clinic) {
    return (
      <ScreenContainer>
        <AppHeader title="Reviews" subtitle="Clinic not found." />
        <AppButton label="Back" icon="arrow-back-outline" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  if (error && !clinic) {
    return (
      <ScreenContainer>
        <AppHeader title="Reviews" subtitle="Could not load clinic." />
        <Text style={{ color: colors.textMuted }}>{error}</Text>
        <AppButton label="Retry" icon="refresh-outline" onPress={retry} />
      </ScreenContainer>
    );
  }

  const reviews = clinic.googleReviews?.reviews ?? [];
  const ratingLine = formatClinicRatingLine(clinic);
  const count = clinic.googleReviews?.userRatingCount;
  const illustrative = clinic.googleReviews?.reviewSnippetsSource === 'illustrative_demo';

  return (
    <ScreenContainer>
      <AppHeader
        title={illustrative ? 'Sample reviews (demo)' : 'Google reviews'}
        subtitle={clinic.name}
      />
      <AppButton label="Back to clinic" icon="arrow-back-outline" variant="outlined" onPress={() => router.back()} />

      <View style={styles.summaryBlock}>
        {ratingLine ? <Text style={[styles.rating, { color: colors.text }]}>{ratingLine}</Text> : null}
        {count != null ? (
          <Text style={[styles.meta, { color: colors.textMuted }]}>{count} ratings on Google (cached in app)</Text>
        ) : null}
      </View>

      <SectionHeader title="What people said" />
      <GoogleReviewList
        reviews={reviews}
        emptyMessage={
          clinic.ratingSource === 'google' && reviews.length === 0
            ? 'Google star rating is cached, but Google did not return review text for this API key (often needs Place Details Enterprise on your Cloud project). For demos, run: python scripts/backfill_illustrative_review_snippets.py'
            : 'No reviews are cached for this clinic. Run backend scripts/enrich_google_reviews.py, then reload.'
        }
      />

      <Text style={[styles.attribution, { color: colors.textMuted }]}>
        {illustrative
          ? 'Sample snippets for demonstration only , not real Google reviews. Star ratings above are from Google when cached.'
          : 'Reviews from Google when available. They reflect individual experiences, not medical advice or clinic quality guarantees.'}
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryBlock: { gap: spacing.xs, marginVertical: spacing.md },
  rating: { fontSize: typography.subheading, fontWeight: '800' },
  meta: { fontSize: typography.caption, lineHeight: 18 },
  attribution: { fontSize: typography.caption, lineHeight: 18, marginTop: spacing.lg },
});
