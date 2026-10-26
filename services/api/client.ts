import { getApiBaseUrl } from '../../constants/api';

export type ApiFailureKind = 'config' | 'url' | 'network' | 'http' | 'json' | 'aborted';

export class ApiError extends Error {
  status: number;
  kind: ApiFailureKind;
  url?: string;

  constructor(message: string, status: number, kind: ApiFailureKind, url?: string) {
    super(message);
    this.status = status;
    this.kind = kind;
    this.url = url;
  }
}

export function buildApiUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const base = getApiBaseUrl();
  if (!base) {
    throw new ApiError('EXPO_PUBLIC_API_BASE_URL is not configured', 0, 'config');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const combined = `${base}${normalizedPath}`;
  let url: URL;
  try {
    url = new URL(combined);
  } catch {
    throw new ApiError(
      `Invalid API base URL "${base}". Use a full URL such as http://192.168.1.226:8000`,
      0,
      'url',
      combined,
    );
  }

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

export async function apiGet<T>(
  path: string,
  options?: { query?: Record<string, string | number | boolean | undefined>; signal?: AbortSignal },
): Promise<T> {
  const requestUrl = buildApiUrl(path, options?.query);

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: options?.signal,
    });
  } catch (error) {
    if (options?.signal?.aborted) {
      throw new ApiError('Request aborted', 0, 'aborted', requestUrl);
    }
    const detail = error instanceof Error ? error.message : String(error);
    throw new ApiError(detail || 'Fetch failed', 0, 'network', requestUrl);
  }

  let bodyText = '';
  try {
    bodyText = await response.text();
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Could not read response body';
    throw new ApiError(detail, response.status, 'network', requestUrl);
  }

  if (!response.ok) {
    throw new ApiError(bodyText || `Request failed (${response.status})`, response.status, 'http', requestUrl);
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new ApiError('The server returned invalid JSON.', response.status, 'json', requestUrl);
  }
}

export async function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const requestUrl = buildApiUrl(path);
  let response: Response;
  try {
    response = await fetch(requestUrl, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw new ApiError('Request aborted', 0, 'aborted', requestUrl);
    }
    const detail = error instanceof Error ? error.message : String(error);
    throw new ApiError(detail || 'Fetch failed', 0, 'network', requestUrl);
  }

  const bodyText = await response.text();
  if (!response.ok) {
    throw new ApiError(bodyText || `Request failed (${response.status})`, response.status, 'http', requestUrl);
  }
  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new ApiError('The server returned invalid JSON.', response.status, 'json', requestUrl);
  }
}
