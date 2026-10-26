import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LANGUAGE_OPTIONS, Language } from '../../constants/languages';
import { CarePreferences, Insurance, Transportation } from '../../types';
import { usePreferences } from '../../hooks/usePreferences';
import { radius, spacing, typography } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  CARE_NEED_OPTIONS,
  CareNeedId,
  careNeedIdFromRequiredService,
  requiredServiceFromCareNeedId,
} from '../../constants/careNeeds';

type Choice = Insurance | Language | Transportation;
const insuranceOptions: Insurance[] = [
  'Medicaid',
  'Medicare',
  'Peach State Health Plan',
  'Self-pay',
  'Private insurance',
];
const languageOptions: Language[] = [...LANGUAGE_OPTIONS];
const transportationOptions: Transportation[] = ['MARTA', 'Car', 'Walking'];

function ChoiceRow<T extends Choice>({ label, options, selected, onSelect }: { label: string; options: T[]; selected: T; onSelect: (option: T) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.choices}>
        {options.map((option) => {
          const active = selected === option;
          return <Pressable key={option} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => onSelect(option)} style={({ pressed }) => [styles.choice, { backgroundColor: active ? colors.blue : colors.surface, borderColor: active ? colors.blue : colors.border }, pressed && styles.pressed]}><Text style={[styles.choiceText, { color: active ? '#FFFFFF' : colors.text }]}>{option}</Text></Pressable>;
        })}
      </View>
    </View>
  );
}

function CareNeedRow({
  selectedId,
  onSelect,
}: {
  selectedId: CareNeedId;
  onSelect: (id: CareNeedId) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: colors.text }]}>Type of care</Text>
      <View style={styles.choices}>
        {CARE_NEED_OPTIONS.map((option) => {
          const active = selectedId === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(option.id)}
              style={({ pressed }) => [
                styles.choice,
                { backgroundColor: active ? colors.blue : colors.surface, borderColor: active ? colors.blue : colors.border },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.choiceText, { color: active ? '#FFFFFF' : colors.text }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function PreferenceForm() {
  const { preferences, updatePreferences } = usePreferences();
  const { colors } = useAppTheme();
  const careNeedId = careNeedIdFromRequiredService(preferences.requiredService);
  return (
    <View style={styles.form}>
      <CareNeedRow
        selectedId={careNeedId}
        onSelect={(id) => updatePreferences({ requiredService: requiredServiceFromCareNeedId(id) })}
      />
      <ChoiceRow label="Insurance" options={insuranceOptions} selected={preferences.insurance} onSelect={(insurance) => updatePreferences({ insurance })} />
      <ChoiceRow label="Preferred language" options={languageOptions} selected={preferences.language} onSelect={(language) => updatePreferences({ language })} />
      <ChoiceRow label="Getting there" options={transportationOptions} selected={preferences.transportation} onSelect={(transportation) => updatePreferences({ transportation })} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Other</Text>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: preferences.needsWheelchairAccess }} onPress={() => updatePreferences({ needsWheelchairAccess: !preferences.needsWheelchairAccess })} style={({ pressed }) => [styles.accessibility, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}>
        <Text style={[styles.checkbox, { color: colors.teal }]}>{preferences.needsWheelchairAccess ? '✓' : '○'}</Text>
        <Text style={[styles.accessibilityText, { color: colors.text }]}>I need wheelchair-accessible care</Text>
      </Pressable>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: preferences.costIsBarrier }} onPress={() => updatePreferences({ costIsBarrier: !preferences.costIsBarrier })} style={({ pressed }) => [styles.accessibility, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}>
        <Text style={[styles.checkbox, { color: colors.teal }]}>{preferences.costIsBarrier ? '✓' : '○'}</Text>
        <Text style={[styles.accessibilityText, { color: colors.text }]}>Cost is a barrier: prioritize sliding-scale, free care, and affordable self-pay</Text>
      </Pressable>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: preferences.prioritizeCoordinatedCare }} onPress={() => updatePreferences({ prioritizeCoordinatedCare: !preferences.prioritizeCoordinatedCare })} style={({ pressed }) => [styles.accessibility, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}>
        <Text style={[styles.checkbox, { color: colors.teal }]}>{preferences.prioritizeCoordinatedCare ? '✓' : '○'}</Text>
        <Text style={[styles.accessibilityText, { color: colors.text }]}>Prioritize coordinated care (multiple services or referral pathways)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  sectionTitle: { fontSize: typography.subheading, fontWeight: '800', marginTop: spacing.xs },
  group: { gap: spacing.sm },
  label: { fontSize: typography.body, fontWeight: '800' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: { minHeight: 44, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, justifyContent: 'center' },
  choiceText: { fontSize: typography.caption, fontWeight: '700' },
  accessibility: { minHeight: 58, borderWidth: 1, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  checkbox: { fontSize: 24, fontWeight: '800' },
  accessibilityText: { flex: 1, fontSize: typography.body, fontWeight: '700' },
  pressed: { opacity: 0.82 },
});
