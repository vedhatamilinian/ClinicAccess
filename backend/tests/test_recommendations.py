def test_recommendations_endpoint(client):
    response = client.post(
        "/api/v1/recommendations",
        json={
            "preferences": {
                "insurance": "Medicaid",
                "language": "English",
                "transportation": "Car",
                "needs_wheelchair_access": False,
            },
            "sort": "best-match",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    item = payload["items"][0]
    assert "match_score" in item
    assert "data_completeness" in item
    assert item["clinic"]["is_synthetic_demo"] is False
