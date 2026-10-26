import { ApiError } from './client';

export function describeApiError(error: unknown, requestUrl?: string): string {
  if (error instanceof ApiError) {
    const urlPart = requestUrl ? ` URL: ${requestUrl}.` : '';
    switch (error.kind) {
      case 'config':
        return `${error.message}${urlPart}`;
      case 'url':
        return `${error.message}${urlPart}`;
      case 'aborted':
        return `Request was cancelled.${urlPart}`;
      case 'network':
        return `Network error , could not reach the server.${urlPart} ${error.message}`;
      case 'http':
        return `HTTP ${error.status}: ${error.message}${urlPart}`;
      case 'json':
        return `Invalid JSON from server (HTTP ${error.status}).${urlPart}`;
      default:
        return `${error.message}${urlPart}`;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown API error.';
}

export function devApiDiagnostics(error: unknown, requestUrl?: string): string | null {
  if (!__DEV__) return null;
  if (error instanceof ApiError) {
    return `[dev] kind=${error.kind} status=${error.status}${requestUrl ? ` url=${requestUrl}` : ''} message=${error.message}`;
  }
  if (error instanceof Error) {
    return `[dev] ${error.name}: ${error.message}${requestUrl ? ` url=${requestUrl}` : ''}`;
  }
  return `[dev] ${String(error)}`;
}
