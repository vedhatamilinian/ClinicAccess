import { createContext, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import {
  AuthSession,
  isOnboardingComplete,
  loadStoredSession,
  markOnboardingComplete,
  signInAccount,
  signOutAccount,
  signUpAccount,
} from '../services/authStorage';

type AuthContextValue = {
  session: AuthSession | null;
  ready: boolean;
  needsOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  ready: false,
  needsOnboarding: false,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => undefined,
  completeOnboarding: async () => undefined,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const refreshOnboardingFlag = useCallback(async (email: string | null) => {
    if (!email) {
      setNeedsOnboarding(false);
      return;
    }
    const done = await isOnboardingComplete(email);
    setNeedsOnboarding(!done);
  }, []);

  useEffect(() => {
    loadStoredSession()
      .then(async (stored) => {
        setSession(stored);
        await refreshOnboardingFlag(stored?.email ?? null);
      })
      .finally(() => setReady(true));
  }, [refreshOnboardingFlag]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInAccount(email, password);
    if (!result.ok) return result.error;
    const next = { email: email.trim().toLowerCase() };
    setSession(next);
    await refreshOnboardingFlag(next.email);
    return null;
  }, [refreshOnboardingFlag]);

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await signUpAccount(email, password);
    if (!result.ok) return result.error;
    const next = { email: email.trim().toLowerCase() };
    setSession(next);
    setNeedsOnboarding(true);
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await signOutAccount();
    setSession(null);
    setNeedsOnboarding(false);
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!session?.email) return;
    await markOnboardingComplete(session.email);
    setNeedsOnboarding(false);
  }, [session?.email]);

  return (
    <AuthContext.Provider
      value={{ session, ready, needsOnboarding, signIn, signUp, signOut, completeOnboarding }}
    >
      {children}
    </AuthContext.Provider>
  );
}
