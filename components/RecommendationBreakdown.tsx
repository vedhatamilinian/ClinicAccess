import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClinicRecommendation } from '../types';
import { radius, spacing, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

function statusSuffix(status?: string) {
  if (!status || status === 'match') return '';
  const label = status.replace(/_/g, ' ');
  return ` (${label})`;
}

export function RecommendationBreakdown({ recommendation }: { recommendation: ClinicRecommendation }) {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useAppTheme();
  const rows = recommendation.breakdown;
  const earned = rows.reduce((sum, item) => sum + (item.applicable !== false ? item.points : 0), 0);
  const maxPoints = rows.reduce((sum, item) => sum + (item.applicable !== false ? item.maximumPoints : 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Toggle recommendation breakdown"
        onPress={() => setExpanded(!expanded)}
        style={styles.heading}
      >
        <Text style={[styles.title, { color: colors.text }]}>Recommendation breakdown</Text>
        <Text style={[styles.chevron, { color: colors.teal }]}>{expanded ? '−' : '+'}</Text>
      </Pressable>
      {expanded && (
        <View style={styles.rows}>
          <Text style={[styles.intro, { color: colors.textMuted }]}>
            Match % is earned points divided by the maximum for factors below that apply to your profile and this
            clinic's public data (Georgia service area). Factors marked not applicable or unknown do not add
            points but are listed for transparency.
          </Text>
          {rows.map((item) => (
            <View key={`${item.criterion}-${item.label}`} style={styles.rowBlock}>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  {item.status === 'match' ? '✓ ' : '• '}
                  {item.label}
                  {statusSuffix(item.status)}
                </Text>
                <Text style={[styles.points, { color: item.points ? colors.success : colors.textMuted }]}>
                  {item.applicable === false ? 'n/a' : `+${item.points}/${item.maximumPoints}`}
                </Text>
              </View>
              {item.explanation ? (
                <Text style={[styles.explanation, { color: colors.textMuted }]}>{item.explanation}</Text>
              ) : null}
            </View>
          ))}
          {recommendation.missingCriteria.length > 0 && (
            <View style={[styles.barriers, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.barriersTitle, { color: colors.text }]}>Eligibility notes</Text>
              {recommendation.missingCriteria.map((item) => (
                <Text key={item} style={[styles.barrierItem, { color: colors.textMuted }]}>• {item}</Text>
              ))}
            </View>
          )}
          <View style={[styles.total, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Match score{maxPoints > 0 ? ` (${earned}/${maxPoints} pts)` : ''}
            </Text>
            <Text style={[styles.totalScore, { color: colors.blue }]}>
              {recommendation.score != null ? `${recommendation.score}%` : 'N/A'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  heading: { minHeight: 58, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.body, fontWeight: '800' },
  chevron: { fontSize: 28, fontWeight: '700' },
  rows: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  intro: { fontSize: typography.caption, lineHeight: 20, marginBottom: spacing.xs },
  rowBlock: { gap: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  rowLabel: { fontSize: typography.body, flex: 1 },
  explanation: { fontSize: typography.caption, lineHeight: 18, paddingLeft: spacing.md },
  points: { fontSize: typography.body, fontWeight: '800' },
  barriers: { borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs },
  barriersTitle: { fontSize: typography.caption, fontWeight: '800' },
  barrierItem: { fontSize: typography.caption, lineHeight: 18 },
  total: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: typography.body, fontWeight: '800', flex: 1 },
  totalScore: { fontSize: typography.subheading, fontWeight: '900' },
});
