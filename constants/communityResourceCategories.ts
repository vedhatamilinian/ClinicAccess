import { CommunityResourceCategory } from '../types/communityResource';

export const COMMUNITY_RESOURCE_CATEGORIES: {
  id: CommunityResourceCategory;
  label: string;
  icon: 'restaurant-outline' | 'bus-outline' | 'home-outline' | 'card-outline' | 'heart-outline' | 'accessibility-outline' | 'briefcase-outline';
  description: string;
}[] = [
  { id: 'food_assistance', label: 'Food assistance', icon: 'restaurant-outline', description: 'Food banks, meals, and nutrition programs' },
  { id: 'transportation', label: 'Transportation', icon: 'bus-outline', description: 'Transit and medical transportation' },
  { id: 'housing_utilities', label: 'Housing & utilities', icon: 'home-outline', description: 'Shelter, rental help, and utilities' },
  { id: 'insurance_health_costs', label: 'Insurance & costs', icon: 'card-outline', description: 'Medicaid, benefits, and prescription help' },
  { id: 'mental_health_family', label: 'Mental health & family', icon: 'heart-outline', description: 'Crisis lines and family support' },
  { id: 'language_disability', label: 'Language & disability', icon: 'accessibility-outline', description: 'Interpreter and disability resources' },
  { id: 'employment_essential', label: 'Employment & essentials', icon: 'briefcase-outline', description: 'Jobs, training, and benefits offices' },
];

export function categoryLabel(category: CommunityResourceCategory | string) {
  return COMMUNITY_RESOURCE_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}
