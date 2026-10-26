import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { spacing, typography } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { goBackToProfile } from '../../utils/navigation';

export function BackToProfileLink() {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to Profile"
      onPress={goBackToProfile}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Ionicons name="chevron-back" size={22} color={colors.blue} />
      <Text style={[styles.text, { color: colors.blue }]}>Profile</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, minHeight: 44 },
  text: { fontSize: typography.body, fontWeight: '800' },
  pressed: { opacity: 0.75 },
});
