import { CarePreferences, ClinicFilters, RecommendedClinic } from '../types';

export const defaultFilters: ClinicFilters = {
  insuranceOnly: false,
  languageOnly: false,
  wheelchairAccessibleOnly: false,
  openNowOnly: false,
  transitOnly: false,
};

export function applyClinicFilters(
  clinics: RecommendedClinic[],
  filters: ClinicFilters,
  preferences: CarePreferences,
) {
  return clinics.filter((clinic) => {
    if (
      filters.insuranceOnly &&
      clinic.insuranceAccepted.length > 0 &&
      !clinic.insuranceAccepted.includes(preferences.insurance)
    ) {
      return false;
    }
    if (filters.maxDistance !== undefined && clinic.distanceMiles > filters.maxDistance) return false;
    if (
      filters.languageOnly &&
      clinic.languages.length > 0 &&
      !clinic.languages.includes(preferences.language)
    ) {
      return false;
    }
    if (filters.wheelchairAccessibleOnly && clinic.wheelchairAccessible === false) return false;
    if (filters.openNowOnly && clinic.openNow !== true) return false;
    if (filters.transitOnly && clinic.transitAvailable === false) return false;
    return true;
  });
}
