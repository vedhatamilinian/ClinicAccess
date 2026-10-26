import { router } from 'expo-router';

/** Return to the Profile tab after opening a screen from Profile menu links. */
export function goBackToProfile() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)/profile');
}
