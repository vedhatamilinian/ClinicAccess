import { useLocalSearchParams } from 'expo-router';
import { ClinicReviewsScreen } from '../../components/ClinicReviewsScreen';

export default function ClinicReviewsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;
  return <ClinicReviewsScreen clinicId={id} />;
}
