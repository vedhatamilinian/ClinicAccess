/** Display label for open/closed when API data may be missing or derived. */

export function clinicOpenStatusLabel(openNow: boolean | null | undefined, hoursKnown: boolean | undefined): string {
  if (openNow === true) return 'Open now';
  if (openNow === false) return 'Currently closed';
  if (hoursKnown) return 'Hours listed , open status unknown';
  return 'Hours not listed';
}

export function clinicOpenStatusColor(openNow: boolean | null | undefined, colors: { success: string; textMuted: string; teal: string }) {
  if (openNow === true) return colors.success;
  if (openNow === false) return colors.textMuted;
  return colors.teal;
}
