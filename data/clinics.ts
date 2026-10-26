import { Clinic } from '../types';

/** Sample clinics when no API URL is configured. */
export const clinics: Clinic[] = [
  { id: 'peachtree', name: 'Peachtree Family Health', isSyntheticDemo: true, address: '125 Peachtree St NE, Atlanta, GA', distanceMiles: 1.2, rating: 4.8, insuranceAccepted: ['Medicaid', 'Medicare', 'Self-pay'], languages: ['English', 'Spanish'], services: ['Primary care', 'Pediatrics', 'Vaccines'], wheelchairAccessible: true, transitAvailable: true, openNow: true, hours: 'Mon–Fri, 8 AM–6 PM' },
  { id: 'eastside', name: 'Eastside Community Clinic', isSyntheticDemo: true, address: '742 Memorial Dr SE, Atlanta, GA', distanceMiles: 2.6, rating: 4.6, insuranceAccepted: ['Medicaid', 'Peach State Health Plan', 'Self-pay'], languages: ['English', 'Spanish', 'Vietnamese'], services: ['Primary care', 'Women’s health', 'Behavioral health'], wheelchairAccessible: true, transitAvailable: true, openNow: true, hours: 'Mon–Sat, 9 AM–5 PM' },
  { id: 'west-end', name: 'West End Health Center', isSyntheticDemo: true, address: '980 Ralph David Abernathy Blvd, Atlanta, GA', distanceMiles: 3.4, rating: 4.5, insuranceAccepted: ['Medicaid', 'Medicare'], languages: ['English', 'Korean'], services: ['Primary care', 'Dental care', 'Lab services'], wheelchairAccessible: true, transitAvailable: true, openNow: false, hours: 'Mon–Fri, 8 AM–4 PM' },
  { id: 'north-atlanta', name: 'North Atlanta Wellness Clinic', isSyntheticDemo: true, address: '3100 North Druid Hills Rd, Atlanta, GA', distanceMiles: 5.1, rating: 4.9, insuranceAccepted: ['Medicare', 'Self-pay'], languages: ['English', 'Spanish'], services: ['Primary care', 'Specialist referrals'], wheelchairAccessible: true, transitAvailable: false, openNow: true, hours: 'Mon–Fri, 7 AM–7 PM' },
  { id: 'south-fulton', name: 'South Fulton Care Clinic', isSyntheticDemo: true, address: '4780 Jonesboro Rd, Union City, GA', distanceMiles: 7.3, rating: 4.4, insuranceAccepted: ['Medicaid', 'Peach State Health Plan', 'Self-pay'], languages: ['English', 'Spanish'], services: ['Primary care', 'Pediatrics', 'Pharmacy support'], wheelchairAccessible: false, transitAvailable: true, openNow: true, hours: 'Mon–Fri, 9 AM–6 PM' },
  { id: 'midtown', name: 'Midtown Access Health', isSyntheticDemo: true, address: '950 West Peachtree St NW, Atlanta, GA', distanceMiles: 2.1, rating: 4.7, insuranceAccepted: ['Medicaid', 'Medicare', 'Peach State Health Plan'], languages: ['English', 'Spanish', 'Korean'], services: ['Primary care', 'Urgent care', 'Telehealth'], wheelchairAccessible: true, transitAvailable: true, openNow: true, hours: 'Every day, 8 AM–8 PM' },
];

export function getClinicById(id: string) {
  return clinics.find((clinic) => clinic.id === id);
}
