import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNTS_KEY = '@clinicaccess/accounts';
const SESSION_KEY = '@clinicaccess/session';
const ONBOARDING_PREFIX = '@clinicaccess/onboarding-complete/';

export type AuthSession = { email: string };

type AccountRecord = { password: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function readAccounts(): Promise<Record<string, AccountRecord>> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, AccountRecord>;
  } catch {
    return {};
  }
}

async function writeAccounts(accounts: Record<string, AccountRecord>) {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function loadStoredSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed?.email) return { email: normalizeEmail(parsed.email) };
  } catch {
    return null;
  }
  return null;
}

export async function saveSession(session: AuthSession | null) {
  if (!session) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return;
  }
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ email: normalizeEmail(session.email) }));
}

export async function isOnboardingComplete(email: string) {
  const value = await AsyncStorage.getItem(`${ONBOARDING_PREFIX}${normalizeEmail(email)}`);
  return value === 'true';
}

export async function markOnboardingComplete(email: string) {
  await AsyncStorage.setItem(`${ONBOARDING_PREFIX}${normalizeEmail(email)}`, 'true');
}

export async function signUpAccount(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email);
  if (!normalized.includes('@')) return { ok: false, error: 'Enter a valid email address.' };
  if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  const accounts = await readAccounts();
  if (accounts[normalized]) return { ok: false, error: 'An account with this email already exists.' };
  accounts[normalized] = { password };
  await writeAccounts(accounts);
  await saveSession({ email: normalized });
  return { ok: true };
}

export async function signInAccount(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email);
  const accounts = await readAccounts();
  const record = accounts[normalized];
  if (!record || record.password !== password) {
    return { ok: false, error: 'Email or password is incorrect.' };
  }
  await saveSession({ email: normalized });
  return { ok: true };
}

export async function signOutAccount() {
  await saveSession(null);
}

export function preferencesStorageKey(email: string | null) {
  if (!email) return '@clinicaccess/care-preferences';
  return `@clinicaccess/care-preferences/${email}`;
}
