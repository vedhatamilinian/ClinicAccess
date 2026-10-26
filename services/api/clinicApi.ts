import { ApiError, apiGet } from './client';
import { ApiClinic, ClinicListParams, PaginatedClinicsResponse } from './types';

const CLINICS_PATH = '/api/v1/clinics';
const HEALTH_PATH = '/api/v1/health';

export type HealthPayload = {
  status?: string;
  database?: string;
  message?: string;
};

/** Matches FastAPI `HealthResponse` and common alternate shapes from docs or proxies. */
export function isHealthPayloadHealthy(payload: HealthPayload): boolean {
  if (payload.status !== 'ok') return false;
  const connectivity = payload.database ?? payload.message;
  return connectivity === 'connected' || connectivity === 'ok';
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthPayload> {
  const payload = await apiGet<HealthPayload>(HEALTH_PATH, { signal });
  if (!isHealthPayloadHealthy(payload)) {
    throw new ApiError(
      `Health check failed: ${JSON.stringify(payload)}`,
      200,
      'http',
    );
  }
  return payload;
}

export async function fetchClinicsPage(params: ClinicListParams, signal?: AbortSignal): Promise<PaginatedClinicsResponse> {
  return apiGet<PaginatedClinicsResponse>(CLINICS_PATH, { query: params as Record<string, string | number | boolean | undefined>, signal });
}

export async function fetchAllClinics(params: ClinicListParams, signal?: AbortSignal): Promise<ApiClinic[]> {
  const pageSize = 100;
  let page = 1;
  let total = 0;
  const items: ApiClinic[] = [];

  do {
    const payload = await fetchClinicsPage({ ...params, page, page_size: pageSize }, signal);
    items.push(...payload.items);
    total = payload.total;
    page += 1;
  } while (items.length < total);

  return items;
}

export async function fetchClinicById(clinicId: string, signal?: AbortSignal): Promise<ApiClinic> {
  try {
    return await apiGet<ApiClinic>(`${CLINICS_PATH}/${encodeURIComponent(clinicId)}`, { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) throw new Error('NOT_FOUND');
    throw error;
  }
}
