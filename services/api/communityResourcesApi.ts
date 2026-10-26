import { apiGet } from './client';
import { CommunityResource, CommunityResourceListParams } from '../../types/communityResource';

export type PaginatedCommunityResourcesResponse = {
  items: CommunityResource[];
  total: number;
  page: number;
  page_size: number;
};

const PATH = '/api/v1/community-resources';

export async function fetchCommunityResources(
  params: CommunityResourceListParams,
  signal?: AbortSignal,
): Promise<PaginatedCommunityResourcesResponse> {
  return apiGet<PaginatedCommunityResourcesResponse>(PATH, {
    query: params as Record<string, string | number | boolean | undefined>,
    signal,
  });
}

export async function fetchCommunityResourceById(
  resourceId: string,
  origin?: { latitude: number; longitude: number },
  signal?: AbortSignal,
): Promise<CommunityResource> {
  return apiGet<CommunityResource>(`${PATH}/${encodeURIComponent(resourceId)}`, {
    query: origin
      ? { origin_latitude: origin.latitude, origin_longitude: origin.longitude }
      : undefined,
    signal,
  });
}
