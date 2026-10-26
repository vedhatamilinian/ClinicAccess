def test_list_community_resources(client):
    response = client.get("/api/v1/community-resources", params={"page_size": 100})
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 10
    assert all(item["verification_status"] == "verified_authoritative" for item in payload["items"])


def test_filter_by_category(client):
    response = client.get("/api/v1/community-resources", params={"category": "food_assistance"})
    assert response.status_code == 200
    items = response.json()["items"]
    assert items
    assert all(item["category"] == "food_assistance" for item in items)


def test_get_resource_detail(client):
    response = client.get("/api/v1/community-resources/res-marta")
    assert response.status_code == 200
    assert response.json()["name"].startswith("MARTA")


def test_search_by_name(client):
    response = client.get("/api/v1/community-resources", params={"q": "211"})
    assert response.status_code == 200
    assert response.json()["total"] >= 1
