/** Backend seeds may suffix names with "(Demo)"; show cleaner titles in the app. */
export function formatClinicDisplayName(name: string): string {
  const withoutSuffix = name.replace(/\s*\(Demo\)\s*$/i, '').trim();
  return withoutSuffix || name;
}
