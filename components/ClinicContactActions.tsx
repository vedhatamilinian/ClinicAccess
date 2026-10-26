import { StyleSheet, View } from 'react-native';
import { Clinic } from '../types';
import { AppButton } from './ui';
import { spacing } from '../constants/theme';
import { clinicDirectionsTarget, openDirections, openPhoneCall, openWebsite } from '../utils/mapLinks';

type Props = {
  clinic: Pick<Clinic, 'name' | 'address' | 'latitude' | 'longitude' | 'phone' | 'website'>;
  /** full = directions + call/website when known; directions-only = single button for lists. */
  variant?: 'full' | 'directions-only';
};

export function ClinicContactActions({ clinic, variant = 'full' }: Props) {
  const hasPhone = Boolean(clinic.phone?.trim());
  const hasWebsite = Boolean(clinic.website?.trim());

  if (variant === 'directions-only') {
    return (
      <AppButton
        label="Directions"
        icon="navigate-outline"
        variant="outlined"
        expand
        onPress={() => openDirections(clinicDirectionsTarget(clinic))}
      />
    );
  }

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <View style={hasPhone || hasWebsite ? styles.cell : styles.cellFull}>
          <AppButton
            label="Directions"
            icon="navigate-outline"
            variant="outlined"
            expand
            onPress={() => openDirections(clinicDirectionsTarget(clinic))}
          />
        </View>
        {hasPhone ? (
          <View style={styles.cell}>
            <AppButton label="Call" icon="call-outline" variant="outlined" expand onPress={() => openPhoneCall(clinic.phone!)} />
          </View>
        ) : null}
        {hasWebsite ? (
          <View style={styles.cell}>
            <AppButton label="Website" icon="globe-outline" variant="outlined" expand onPress={() => openWebsite(clinic.website!)} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  cell: { flex: 1, minWidth: 100 },
  cellFull: { flex: 1 },
});
