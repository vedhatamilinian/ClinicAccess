from scripts.seed_database import DEMO_CLINICS


def test_list_clinics_excludes_demo_by_default(client):
    response = client.get("/api/v1/clinics", params={"page_size": 100})
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 2
    assert all(not item["is_synthetic_demo"] for item in payload["items"])
    assert all(item["data_source"] == "hrsa_hcsd" for item in payload["items"])


def test_list_clinics_include_demo(client):
    response = client.get("/api/v1/clinics", params={"include_demo": True, "page_size": 100})
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == len(DEMO_CLINICS) + 2


def test_get_existing_clinic(client):
    response = client.get("/api/v1/clinics/peachtree", params={"include_demo": True})
    assert response.status_code == 200
    assert response.json()["name"].startswith("Peachtree")


def test_get_hrsa_clinic(client):
    response = client.get("/api/v1/clinics/hrsa-bphc000001-1")
    assert response.status_code == 200
    body = response.json()
    assert body["is_synthetic_demo"] is False
    assert body["data_source"] == "hrsa_hcsd"


def test_get_unknown_clinic_returns_404(client):
    assert client.get("/api/v1/clinics/does-not-exist").status_code == 404


def test_search_by_text(client):
    response = client.get("/api/v1/clinics", params={"q": "Midtown", "include_demo": True})
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["id"] == "midtown"


def test_filter_by_service(client):
    response = client.get("/api/v1/clinics", params={"service": "Dental care", "include_demo": True})
    assert response.json()["total"] == 1


def test_filter_by_insurance(client):
    response = client.get("/api/v1/clinics", params={"insurance": "Medicare", "include_demo": True})
    assert response.json()["total"] >= 1


def test_filter_by_language(client):
    response = client.get("/api/v1/clinics", params={"language": "Vietnamese", "include_demo": True})
    assert response.json()["total"] >= 1


def test_filter_by_accessibility(client):
    response = client.get("/api/v1/clinics", params={"accessible": True, "include_demo": True})
    assert response.json()["total"] >= 1


def test_filter_by_transit(client):
    response = client.get("/api/v1/clinics", params={"transit": True, "include_demo": True})
    assert response.json()["total"] >= 1


def test_combine_filters(client):
    response = client.get(
        "/api/v1/clinics",
        params={"insurance": "Medicaid", "language": "Spanish", "transit": True, "include_demo": True},
    )
    payload = response.json()
    assert payload["total"] >= 1
    for item in payload["items"]:
        assert "Medicaid" in item["accepted_insurance"]
        assert "Spanish" in item["languages"]


def test_pagination(client):
    response = client.get("/api/v1/clinics", params={"page": 1, "page_size": 3, "include_demo": True})
    payload = response.json()
    assert payload["page"] == 1
    assert payload["page_size"] == 3
    assert len(payload["items"]) == 3
    assert payload["total"] >= 10


def test_invalid_page_size(client):
    assert client.get("/api/v1/clinics", params={"page_size": 500}).status_code == 422


def test_create_update_delete_clinic(client, admin_headers):
    create_payload = {
        "id": "demo-new",
        "name": "New Demo Clinic",
        "description": "Temporary demo clinic",
        "address": "1 Demo Way",
        "city": "Atlanta",
        "state": "GA",
        "postal_code": "30303",
        "latitude": 33.75,
        "longitude": -84.39,
        "medical_services": ["Primary care"],
        "accepted_insurance": ["Self-pay"],
        "languages": ["English"],
        "accessibility_features": ["wheelchair_accessible"],
        "transit_options": ["marta"],
        "operating_hours": {"summary": "Mon–Fri", "open_now": True},
    }
    assert client.post("/api/v1/clinics", json=create_payload, headers=admin_headers).status_code == 201
    assert client.patch(
        "/api/v1/clinics/demo-new",
        json={"description": "Updated demo clinic"},
        headers=admin_headers,
    ).status_code == 200
    assert client.delete("/api/v1/clinics/demo-new", headers=admin_headers).status_code == 204
    assert client.get("/api/v1/clinics/demo-new").status_code == 404


def test_write_requires_admin_key(client):
    assert client.post("/api/v1/clinics", json={}).status_code == 401


def test_seed_record_count_matches_fixture(client):
    payload = client.get("/api/v1/clinics", params={"page_size": 100, "include_demo": True}).json()
    assert payload["total"] == len(DEMO_CLINICS) + 2


def test_clinic_api_returns_google_reviews(client, admin_headers):
    clinic_id = "hrsa-bphc000001-1"
    google_payload = {
        "source": "google",
        "place_id": "ChIJtest",
        "rating": 4.6,
        "user_rating_count": 12,
        "maps_url": "https://maps.google.com/?cid=1",
        "reviews": [{"author_name": "Sam", "rating": 5, "text": "Great care.", "relative_time_description": "1 month ago"}],
    }
    assert (
        client.patch(
            f"/api/v1/clinics/{clinic_id}",
            headers=admin_headers,
            json={"google_reviews": google_payload},
        ).status_code
        == 200
    )

    body = client.get(f"/api/v1/clinics/{clinic_id}").json()
    assert body["google_reviews"]["rating"] == 4.6
    assert body["google_reviews"]["reviews"][0]["author_name"] == "Sam"
