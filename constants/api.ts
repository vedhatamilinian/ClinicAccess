/** Base URL for the FastAPI backend (no trailing slash). Adds http:// when the scheme is omitted. */
export function getApiBaseUrl(): string | null {
  const value = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!value) return null;
  const withoutTrailingSlash = value.replace(/\/$/, '');
  if (/^https?:\/\//i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }
  return `http://${withoutTrailingSlash}`;
}

export const API_ENABLED = Boolean(getApiBaseUrl());
