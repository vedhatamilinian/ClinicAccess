/** Preference languages: top five spoken in Georgia (Census/LEP estimates) plus Other. */
export const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'Vietnamese',
  'Korean',
  'Chinese',
  'Other',
] as const;

export type Language = (typeof LANGUAGE_OPTIONS)[number];
