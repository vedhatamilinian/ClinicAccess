import { router } from 'expo-router';
import { PreferenceForm } from '../components/forms/PreferenceForm';
import { AppHeader, ScreenBottomBar, ScreenContainer } from '../components/layout';
import { AppButton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();

  const finish = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <ScreenContainer
      footer={
        <ScreenBottomBar>
          <AppButton label="Save & continue" icon="checkmark-circle-outline" expand onPress={finish} />
        </ScreenBottomBar>
      }
    >
      <AppHeader
        title="Your care preferences"
        subtitle="Tell us what you need from a clinic. We save these to your profile for match scores and search."
      />
      <PreferenceForm />
    </ScreenContainer>
  );
}
