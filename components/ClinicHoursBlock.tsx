import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { Clinic } from '../types';
import { clinicOpenStatusColor, clinicOpenStatusLabel } from '../utils/clinicOpenStatus';

type Props = {
  clinic: Pick<Clinic, 'openNow' | 'hoursKnown' | 'hours' | 'appointmentInformation'>;
  /** When false, open times and appointments start collapsed behind the link next to status. */
  defaultExpanded?: boolean;
};

function scheduleValue(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function ClinicHoursBlock({ clinic, defaultExpanded = true }: Props) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const openTimes = scheduleValue(clinic.hours, 'Not listed , contact the clinic.');
  const appointments = scheduleValue(
    clinic.appointmentInformation,
    'Not listed , call the clinic to ask about walk-ins and scheduling.',
  );
  const hasDetail = Boolean(clinic.hours?.trim() || clinic.appointmentInformation?.trim());
  const statusLabel = clinicOpenStatusLabel(clinic.openNow, clinic.hoursKnown);

  return (
    <View style={styles.wrap}>
      <View style={styles.statusRow}>
        <View style={styles.statusMain}>
          <View style={[styles.dot, { backgroundColor: clinicOpenStatusColor(clinic.openNow, colors) }]} />
          <Text style={[styles.statusText, { color: colors.text }]}>{statusLabel}</Text>
        </View>
        {hasDetail ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={expanded ? 'Hide open times and appointments' : 'Show open times and appointments'}
            onPress={(event) => {
              event.stopPropagation();
              setExpanded((value) => !value);
            }}
            hitSlop={8}
          >
            <Text style={[styles.link, { color: colors.blue }]}>
              {expanded ? 'Hide' : 'Hours & appointments'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {expanded ? (
        <View style={styles.detailBlock}>
          <ScheduleRow label="Open times" value={openTimes} />
          <ScheduleRow label="Appointments" value={appointments} />
        </View>
      ) : null}
    </View>
  );
}

function ScheduleRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.scheduleRow}>
      <Text style={[styles.scheduleLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.scheduleValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statusMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: typography.body, lineHeight: 22, flexShrink: 1 },
  link: { fontSize: typography.caption, fontWeight: '700' },
  detailBlock: { gap: spacing.sm, paddingLeft: spacing.md },
  scheduleRow: { gap: 2 },
  scheduleLabel: { fontSize: typography.caption, fontWeight: '700' },
  scheduleValue: { fontSize: typography.body, lineHeight: 22 },
});
