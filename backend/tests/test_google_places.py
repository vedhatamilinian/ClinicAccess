from unittest.mock import MagicMock

from app.services.google_places import (
    clinic_search_query,
    fetch_google_reviews_for_place_id,
    fetch_google_reviews_for_query,
    google_reviews_from_details,
    google_reviews_from_place,
)


def test_google_reviews_from_details_maps_fields():
    payload = google_reviews_from_details(
        {
            "place_id": "ChIJtest",
            "rating": 4.3,
            "user_ratings_total": 42,
            "url": "https://maps.google.com/?cid=1",
            "reviews": [
                {
                    "author_name": "Alex",
                    "rating": 5,
                    "text": "Helpful staff.",
                    "relative_time_description": "2 weeks ago",
                }
            ],
        }
    )
    assert payload["source"] == "google"
    assert payload["place_id"] == "ChIJtest"
    assert payload["rating"] == 4.3
    assert payload["user_rating_count"] == 42
    assert payload["reviews"][0]["author_name"] == "Alex"
    assert payload["fetched_at"]


def test_google_reviews_from_new_places_api_shape():
    payload = google_reviews_from_place(
        {
            "id": "places/ChIJabc",
            "rating": 4.1,
            "userRatingCount": 10,
            "googleMapsUri": "https://maps.google.com/?cid=2",
            "reviews": [
                {
                    "rating": 5,
                    "relativePublishTimeDescription": "1 month ago",
                    "text": {"text": "Great visit."},
                    "authorAttribution": {"displayName": "Sam"},
                }
            ],
        }
    )
    assert payload["place_id"] == "places/ChIJabc"
    assert payload["reviews"][0]["author_name"] == "Sam"
    assert payload["reviews"][0]["text"] == "Great visit."


def test_fetch_google_reviews_for_query_uses_places_search_text():
    client = MagicMock()
    search_response = MagicMock()
    search_response.raise_for_status = MagicMock()
    search_response.json.return_value = {
        "places": [
            {
                "id": "places/ChIJabc",
                "rating": 4.1,
                "userRatingCount": 10,
                "googleMapsUri": "https://maps.google.com/?cid=2",
                "reviews": [],
            }
        ]
    }
    client.post.return_value = search_response

    details_response = MagicMock()
    details_response.raise_for_status = MagicMock()
    details_response.json.return_value = {"reviews": []}
    client.get.return_value = details_response

    result = fetch_google_reviews_for_query("Clinic, 1 Main St, Atlanta, GA 30303", "test-key", client=client)
    assert result is not None
    assert result["place_id"] == "places/ChIJabc"
    assert result["rating"] == 4.1
    client.post.assert_called_once()
    client.get.assert_called_once()


def test_fetch_google_reviews_for_place_id_uses_details_only():
    client = MagicMock()
    details_response = MagicMock()
    details_response.raise_for_status = MagicMock()
    details_response.json.return_value = {
        "id": "ChIJtest",
        "rating": 4.0,
        "userRatingCount": 7,
        "googleMapsUri": "https://maps.google.com/?cid=3",
        "reviews": [
            {
                "rating": 5,
                "text": {"text": "Quick visit."},
                "authorAttribution": {"displayName": "Lee"},
            }
        ],
    }
    client.get.return_value = details_response

    result = fetch_google_reviews_for_place_id("ChIJtest", "test-key", client=client)
    assert result is not None
    assert result["place_id"] == "ChIJtest"
    assert result["review_snippets_source"] == "google"
    assert result["reviews"][0]["author_name"] == "Lee"
    client.get.assert_called_once()
    client.post.assert_not_called()


def test_clinic_search_query():
    text = clinic_search_query("Main Clinic", "1 St", "Atlanta", "GA", "30303")
    assert "Main Clinic" in text
    assert "30303" in text
