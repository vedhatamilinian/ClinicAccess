import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';

export { BackToProfileLink } from './BackToProfileLink';

export function ScreenBottomBar({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
      <View style={styles.bottomBarInner}>{children}</View>
    </SafeAreaView>
  );
}

export function ScreenContainer({
  children,
  scroll = true,
  footer,
}: PropsWithChildren<{ scroll?: boolean; footer?: ReactNode }>) {
  const { colors } = useAppTheme();
  const content = <View style={styles.content}>{children}</View>;
  const scrollPadding = footer ? styles.scrollContentWithFooter : styles.scrollContent;
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={scrollPadding} showsVerticalScrollIndicator={false}>{content}</ScrollView>
      ) : (
        <View style={styles.flex}>{content}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useAppTheme();
  return <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>{title}</Text>{subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}</View>;
}

export function SectionHeader({ title, action, compact }: { title: string; action?: string; compact?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.sectionHeader, compact && styles.sectionHeaderCompact]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {action && <Text style={[styles.action, { color: colors.teal }]}>{action}</Text>}
    </View>
  );
}

export function Divider() {
  const { colors } = useAppTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  const { colors } = useAppTheme();
  return <View style={styles.centered}><Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.emptyMessage, { color: colors.textMuted }]}>{message}</Text></View>;
}

export function ErrorState({ title = 'Something went wrong', message }: { title?: string; message: string }) {
  return <EmptyState title={title} message={message} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  scrollContentWithFooter: { paddingBottom: spacing.xxl + spacing.lg },
  bottomBar: { borderTopWidth: StyleSheet.hairlineWidth },
  bottomBarInner: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  header: { gap: spacing.xs, marginBottom: spacing.lg },
  title: { fontSize: typography.heading, fontWeight: '800' },
  subtitle: { fontSize: typography.body, lineHeight: 23 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionHeaderCompact: { marginTop: spacing.sm, marginBottom: spacing.xs },
  sectionTitle: { fontSize: typography.subheading, fontWeight: '800' },
  action: { fontSize: typography.caption, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  centered: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: typography.subheading, fontWeight: '800', textAlign: 'center' },
  emptyMessage: { fontSize: typography.body, lineHeight: 23, textAlign: 'center' },
});
