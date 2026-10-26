export type CommunityResourceCategory =
  | 'food_assistance'
  | 'transportation'
  | 'housing_utilities'
  | 'insurance_health_costs'
  | 'mental_health_family'
  | 'language_disability'
  | 'employment_essential';

export type CommunityResource = {
  id: string;
  name: string;
  category: CommunityResourceCategory;
  description: string;
  organization_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  website?: string | null;
  hours: string;
  services_offered: string[];
  eligibility_requirements: string;
  cost_information: string;
  languages_supported: string[];
  accessibility_information: string;
  appointment_required?: boolean | null;
  service_area: string;
  source_name: string;
  source_url?: string | null;
  verification_status: string;
  record_status: string;
  last_verified_at?: string | null;
  distance_miles?: number | null;
};

export type CommunityResourceListParams = {
  q?: string;
  category?: CommunityResourceCategory;
  zip_code?: string;
  language?: string;
  origin_latitude?: number;
  origin_longitude?: number;
  max_distance_miles?: number;
  sort?: 'name' | 'distance';
  page?: number;
  page_size?: number;
};
