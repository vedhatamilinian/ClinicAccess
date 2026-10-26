import type { ApiGoogleReviews } from './googleReviews';

export type ApiClinic = {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string | null;
  medical_services: string[];
  accepted_insurance: string[];
  languages: string[];
  accessibility_features: string[];
  transit_options: string[];
  operating_hours: { summary?: string; open_now?: boolean };
  appointment_information: string;
  data_source: string;
  is_synthetic_demo: boolean;
  facility_type?: string;
  data_completeness_score?: number;
  google_reviews?: ApiGoogleReviews;
};

export type PaginatedClinicsResponse = {
  items: ApiClinic[];
  total: number;
  page: number;
  page_size: number;
};

export type ClinicListParams = {
  q?: string;
  service?: string;
  insurance?: string;
  language?: string;
  accessible?: boolean;
  transit?: boolean;
  open_now?: boolean;
  city?: string;
  include_demo?: boolean;
  page?: number;
  page_size?: number;
};
