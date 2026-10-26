import { StyleSheet, Text, View } from 'react-native';
import { SectionCard } from './cards';
import { spacing, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { GoogleReview } from '../types';

type Props = {
  reviews: GoogleReview[];
  emptyMessage?: string;
};

export function GoogleReviewList({ reviews, emptyMessage }: Props) {
  const { colors } = useAppTheme();

  if (!reviews.length) {
    return (
      <Text style={[styles.empty, { color: colors.textMuted }]}>
        {emptyMessage ?? 'No review text is cached for this clinic yet.'}
      </Text>
    );
  }

  return (
    <SectionCard>
      {reviews.map((review, index) => (
        <View
          key={`${review.authorName}-${index}`}
          style={index > 0 ? [styles.reviewSpacing, { borderTopColor: colors.border }] : undefined}
        >
          <View style={styles.reviewHeader}>
            <Text style={[styles.author, { color: colors.text }]}>{review.authorName}</Text>
            <Text style={[styles.reviewStars, { color: colors.teal }]}>★ {review.rating}</Text>
          </View>
          {review.relativeTime ? (
            <Text style={[styles.reviewTime, { color: colors.textMuted }]}>{review.relativeTime}</Text>
          ) : null}
          {review.text ? <Text style={[styles.reviewText, { color: colors.text }]}>{review.text}</Text> : null}
        </View>
      ))}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: typography.body, lineHeight: 23 },
  reviewSpacing: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  author: { fontSize: typography.body, fontWeight: '800', flex: 1 },
  reviewStars: { fontSize: typography.caption, fontWeight: '800' },
  reviewTime: { fontSize: typography.caption, marginTop: 2 },
  reviewText: { fontSize: typography.body, lineHeight: 22, marginTop: spacing.xs },
});
