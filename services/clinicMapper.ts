import { Clinic, Insurance, Language } from '../types';
import { formatClinicDisplayName } from '../utils/clinicDisplay';
import { mapApiGoogleReviews } from './api/googleReviews';
import { ApiClinic } from './api/types';

const DEMO_ORIGIN = { latitude: 33.749, longitude: -84.388 };

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function milesBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function demoRatingFromId(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = (hash + id.charCodeAt(index) * (index + 1)) % 7;
  return 4.4 + hash * 0.1;
}

export function mapApiClinicToClinic(apiClinic: ApiClinic): Clinic {
  const distanceMiles = milesBetween(
    DEMO_ORIGIN.latitude,
    DEMO_ORIGIN.longitude,
    apiClinic.latitude,
    apiClinic.longitude,
  );
  const synthetic = apiClinic.is_synthetic_demo;
  const googleReviews = mapApiGoogleReviews(apiClinic.google_reviews);
  const googleRating = googleReviews?.rating;
  let rating: number | null = null;
  let ratingSource: 'google' | 'demo' | undefined;
  if (googleRating != null) {
    rating = googleRating;
    ratingSource = 'google';
  } else if (synthetic) {
    rating = demoRatingFromId(apiClinic.id);
    ratingSource = 'demo';
  }
  const hoursSummary = apiClinic.operating_hours?.summary;
  const hasOpenNowField =
    apiClinic.operating_hours != null && Object.prototype.hasOwnProperty.call(apiClinic.operating_hours, 'open_now');
  const hours = hoursSummary ?? (synthetic ? 'Hours unavailable in demo data' : 'Hours not provided , contact the clinic.');
  const openNow = hasOpenNowField ? Boolean(apiClinic.operating_hours?.open_now) : null;

  const accessibilityFeatures = apiClinic.accessibility_features ?? [];
  const transitOptions = apiClinic.transit_options ?? [];
  let wheelchairAccessible: boolean | null = null;
  if (synthetic || accessibilityFeatures.length > 0) {
    wheelchairAccessible = accessibilityFeatures.includes('wheelchair_accessible');
  }
  let transitAvailable: boolean | null = null;
  if (synthetic || transitOptions.length > 0) {
    if (
      transitOptions.includes('transit_not_within_walking_distance') ||
      transitOptions.includes('rail_not_within_walking_distance')
    ) {
      transitAvailable = false;
    } else {
      transitAvailable =
        transitOptions.includes('marta') ||
        transitOptions.includes('marta_bus') ||
        transitOptions.includes('public_transit');
    }
  }

  return {
    id: apiClinic.id,
    name: formatClinicDisplayName(apiClinic.name),
    isSyntheticDemo: synthetic,
    dataSource: apiClinic.data_source,
    latitude: apiClinic.latitude,
    longitude: apiClinic.longitude,
    postalCode: apiClinic.postal_code,
    phone: apiClinic.phone?.trim() || undefined,
    website: apiClinic.website?.trim() || undefined,
    facilityType: apiClinic.facility_type,
    dataCompletenessScore: apiClinic.data_completeness_score,
    address: `${apiClinic.address}, ${apiClinic.city}, ${apiClinic.state} ${apiClinic.postal_code}`,
    distanceMiles: Math.round(distanceMiles * 10) / 10,
    rating,
    ratingSource,
    googleReviews,
    insuranceAccepted: apiClinic.accepted_insurance as Insurance[],
    languages: apiClinic.languages as Language[],
    services: apiClinic.medical_services,
    wheelchairAccessible,
    transitAvailable,
    transitOptions: transitOptions.length > 0 ? transitOptions : undefined,
    openNow,
    hoursKnown: Boolean(hoursSummary) || hasOpenNowField,
    hours,
    appointmentInformation: apiClinic.appointment_information?.trim() || undefined,
  };
}
