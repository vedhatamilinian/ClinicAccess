import { PreferenceForm } from '../components/forms/PreferenceForm';
import { AppHeader, ScreenBottomBar, ScreenContainer } from '../components/layout';
import { AppButton } from '../components/ui';
import { goBackToProfile } from '../utils/navigation';

export default function PreferencesScreen() {
  return (
    <ScreenContainer
      footer={
        <ScreenBottomBar>
          <AppButton label="Back to Profile" icon="arrow-back-outline" variant="outlined" expand onPress={goBackToProfile} />
        </ScreenBottomBar>
      }
    >
      <AppHeader title="My Preferences" subtitle="Saved on this device and used for match scores on Find Care and the map." />
      <PreferenceForm />
    </ScreenContainer>
  );
}
