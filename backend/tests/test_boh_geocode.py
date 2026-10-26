from app.importers.geocode import build_oneline_addresses, expand_street_aliases, geocode_us_census, simplify_street_address


def test_strips_floor_from_address():
    assert "5th floor" not in simplify_street_address("10 Park Place S.E., 5th floor")


def test_mlk_expands_to_martin_luther_king():
    variants = expand_street_aliases("3700 MLK Jr. Drive S.W.")
    assert any("Martin Luther King" in v for v in variants)


def test_build_queries_include_mlk_and_expanded():
    lines = build_oneline_addresses("3700 MLK Jr. Drive S.W.", "Atlanta", "GA", "30331")
    assert any("Martin Luther King" in line for line in lines)
    assert any("MLK" in line for line in lines)


def test_us_census_geocodes_adamsville_address():
    result = geocode_us_census("3700 Martin Luther King Jr Drive SW, Atlanta, GA 30331")
    assert result is not None
    assert 33.6 < result.latitude < 33.8
    assert -84.6 < result.longitude < -84.4
    assert result.provider == "derived_geocode_census"
