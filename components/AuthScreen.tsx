import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from './ui';
import { appName, radius, spacing, tagline, typography } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../hooks/useAuth';
import { LegalDisclaimer } from './LegalDisclaimer';
import { ScreenContainer } from './layout';

type Mode = 'sign-in' | 'sign-up';

export function AuthScreen() {
  const { colors } = useAppTheme();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setError(null);
    const message = mode === 'sign-in' ? await signIn(email, password) : await signUp(email, password);
    if (message) setError(message);
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={[styles.hero, { backgroundColor: colors.blue }]}>
          <Text style={styles.appName}>{appName}</Text>
          <Text style={styles.tagline}>{tagline}</Text>
          <Text style={styles.heroBody}>Sign in to save your clinic preferences and favorites on this device.</Text>
        </View>

        <View style={styles.modeRow}>
          {(['sign-in', 'sign-up'] as Mode[]).map((item) => {
            const active = mode === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                onPress={() => {
                  setMode(item);
                  setError(null);
                }}
                style={[
                  styles.modeChip,
                  { borderColor: colors.border, backgroundColor: active ? colors.blue : colors.surface },
                ]}
              >
                <Text style={{ color: active ? '#FFFFFF' : colors.text, fontWeight: '800' }}>
                  {item === 'sign-in' ? 'Sign in' : 'Create account'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
        />
        <TextInput
          accessibilityLabel="Password"
          secureTextEntry
          placeholder="Password (6+ characters)"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
        />

        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

        <AppButton
          label={mode === 'sign-in' ? 'Sign in' : 'Create account'}
          icon={mode === 'sign-in' ? 'log-in-outline' : 'person-add-outline'}
          expand
          onPress={submit}
        />
        <LegalDisclaimer />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: spacing.md },
  hero: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  appName: { color: '#FFFFFF', fontSize: typography.display, fontWeight: '900' },
  tagline: { color: '#FFFFFF', fontSize: typography.subheading, fontWeight: '700' },
  heroBody: { color: '#EAF5FF', fontSize: typography.body, lineHeight: 22 },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeChip: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
  },
  error: { fontSize: typography.body, fontWeight: '700' },
});
