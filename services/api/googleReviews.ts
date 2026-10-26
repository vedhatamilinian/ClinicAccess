import { GoogleReviewsInfo } from '../../types';

export type ApiGoogleReview = {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description?: string | null;
};

export type ApiGoogleReviews = {
  source?: string;
  place_id?: string | null;
  rating?: number | null;
  user_rating_count?: number | null;
  maps_url?: string | null;
  reviews?: ApiGoogleReview[];
  fetched_at?: string | null;
  /** ``google`` when snippets came from Places API; ``illustrative_demo`` for labeled demo text. */
  review_snippets_source?: string | null;
};

export function mapApiGoogleReviews(raw: ApiGoogleReviews | null | undefined): GoogleReviewsInfo | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const reviews = (raw.reviews ?? []).map((item) => ({
    authorName: item.author_name,
    rating: item.rating,
    text: item.text,
    relativeTime: item.relative_time_description ?? undefined,
  }));
  if (raw.rating == null && reviews.length === 0 && !raw.maps_url) {
    return undefined;
  }
  const reviewSnippetsSource =
    raw.review_snippets_source === 'google' || raw.review_snippets_source === 'illustrative_demo'
      ? raw.review_snippets_source
      : undefined;

  return {
    placeId: raw.place_id ?? undefined,
    rating: raw.rating ?? undefined,
    userRatingCount: raw.user_rating_count ?? undefined,
    mapsUrl: raw.maps_url ?? undefined,
    reviews,
    fetchedAt: raw.fetched_at ?? undefined,
    reviewSnippetsSource,
  };
}
