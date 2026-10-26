/** User-facing copy from API `transit_options` (MARTA GTFS enrichment). */
export function martaTransitSummary(
  transitOptions: string[],
  transitAvailable: boolean | null,
): string {
  if (transitAvailable === null) {
    return 'Not assessed , confirm with the clinic';
  }
  if (transitAvailable === false) {
    return 'No MARTA rail or bus stop within walking distance (MARTA GTFS)';
  }
  const rail = transitOptions.includes('marta');
  const bus = transitOptions.includes('marta_bus');
  if (rail && bus) {
    return 'MARTA rail (~0.75 mi) and bus (~0.25 mi) nearby per GTFS';
  }
  if (rail) {
    return 'MARTA rail within ~0.75 mi (MARTA GTFS)';
  }
  if (bus) {
    return 'MARTA bus within ~0.25 mi (MARTA GTFS)';
  }
  return 'MARTA transit nearby (MARTA GTFS)';
}
