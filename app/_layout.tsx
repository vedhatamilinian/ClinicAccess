import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SplashScreen } from '../components/SplashScreen';
import { LoadingSpinner } from '../components/ui';
import { AppProvider } from '../contexts/AppContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../hooks/useAppTheme';

function useAuthNavigation() {
  const { ready, session, needsOnboarding } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!ready) return;
    const root = segments[0];
    const onAuth = root === 'auth';
    const onOnboarding = root === 'onboarding';

    if (!session && !onAuth) {
      router.replace('/auth');
      return;
    }
    if (session && needsOnboarding && !onOnboarding) {
      router.replace('/onboarding');
      return;
    }
    if (session && !needsOnboarding && (onAuth || onOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [ready, session, needsOnboarding, segments, router]);
}

function RootNavigator() {
  const { isDark } = useAppTheme();
  const { ready } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  useAuthNavigation();

  if (showSplash) return <SplashScreen onFinished={() => setShowSplash(false)} />;
  if (!ready) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="about" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="clinics/[id]" />
        <Stack.Screen name="clinic-reviews/[id]" />
        <Stack.Screen name="community-resources/[id]" />
        <Stack.Screen name="[page]" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
