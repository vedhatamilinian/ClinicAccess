export type ThemePreference = 'system' | 'light' | 'dark';

export type PlaceholderPage = 'Settings' | 'Help';

export type Insurance = 'Medicaid' | 'Medicare' | 'Peach State Health Plan' | 'Self-pay' | 'Private insurance';
export type { Language } from '../constants/languages';
import type { Language } from '../constants/languages';
export type Transportation = 'Car' | 'MARTA' | 'Walking';

export type GoogleReview = {
  authorName: string;
  rating: number;
  text: string;
  relativeTime?: string;
};

export type GoogleReviewsInfo = {
  placeId?: string;
  rating?: number;
  userRatingCount?: number;
  mapsUrl?: string;
  reviews: GoogleReview[];
  fetchedAt?: string;
  reviewSnippetsSource?: 'google' | 'illustrative_demo';
};

export type Clinic = {
  id: string;
  name: string;
  /** True when the record is fictional demonstration data from the API. */
  isSyntheticDemo?: boolean;
  address: string;
  latitude?: number;
  longitude?: number;
  postalCode?: string;
  phone?: string;
  website?: string;
  facilityType?: string;
  dataCompletenessScore?: number;
  distanceMiles: number;
  /** Star rating when available (Google Places or bundled demo sample). */
  rating?: number | null;
  ratingSource?: 'google' | 'demo';
  googleReviews?: GoogleReviewsInfo;
  /** Provenance label from API `data_source` when available. */
  dataSource?: string;
  insuranceAccepted: Insurance[];
  languages: Language[];
  services: string[];
  /** null when the source did not provide accessibility information. */
  wheelchairAccessible?: boolean | null;
  /** null when the source did not provide transit information. */
  transitAvailable?: boolean | null;
  /** Tokens from API MARTA GTFS enrichment (`marta`, `marta_bus`, etc.). */
  transitOptions?: string[];
  /** true/false when known (including derived from hours); null when hours/open status unknown. */
  openNow: boolean | null;
  /** false when hours/open status are not available from the data source. */
  hoursKnown?: boolean;
  hours: string;
  appointmentInformation?: string;
};

export type CarePreferences = {
  insurance: Insurance;
  language: Language;
  transportation: Transportation;
  /** API `required_service`: substring match against clinic services. */
  requiredService: string | null;
  needsWheelchairAccess: boolean;
  /** When true, match scores favor verified sliding-scale, free care, and self-pay options. */
  costIsBarrier: boolean;
  /** When true, favor clinics with multiple services or referral pathways. */
  prioritizeCoordinatedCare: boolean;
};

export type RecommendationCriterion =
  | 'insurance'
  | 'affordability'
  | 'distance'
  | 'language'
  | 'accessibility'
  | 'transportation'
  | 'appointment'
  | 'hours'
  | 'services'
  | 'coordinated_care';

export type CriterionStatus = 'match' | 'partial' | 'mismatch' | 'unknown' | 'not_applicable';
export type EligibilityStatus = 'eligible' | 'excluded' | 'needs_verification';

export type RecommendationBreakdownItem = {
  criterion: RecommendationCriterion | string;
  label: string;
  points: number;
  maximumPoints: number;
  matched: boolean;
  status?: CriterionStatus;
  explanation?: string;
  applicable?: boolean;
};
export type ClinicRecommendation = {
  clinicId: string;
  score: number | null;
  confidenceLabel: string;
  eligibilityStatus?: EligibilityStatus;
  summary?: string;
  evaluatedCriteriaCount?: number;
  unknownCriteriaCount?: number;
  distanceIsEstimate?: boolean;
  reasons: string[];
  matchedCriteria: RecommendationCriterion[];
  missingCriteria: string[];
  breakdown: RecommendationBreakdownItem[];
};
export type RecommendationOrigin = {
  latitude: number;
  longitude: number;
  label?: string;
};
export type RecommendedClinic = Clinic & { recommendation: ClinicRecommendation };
export type ClinicFilters = {
  insuranceOnly: boolean;
  maxDistance?: number;
  languageOnly: boolean;
  wheelchairAccessibleOnly: boolean;
  openNowOnly: boolean;
  transitOnly: boolean;
  /** When true, search text is treated as a required medical service (API mandatory match). */
};
export type SortOption = 'best-match' | 'nearest' | 'highest-rated' | 'open-now' | 'alphabetical';

export type MapMinMatchScore = 'any' | '51' | '80' | '95';

export type MapViewMode = 'map' | 'list';
