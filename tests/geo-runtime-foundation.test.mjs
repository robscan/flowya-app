import assert from "node:assert/strict";
import test from "node:test";

const { buildGeoSearchResults, parseGeoBoundingBox } = await import("../lib/geo/search-core.ts");
const { buildUserGeoMarkPayload } = await import("../lib/geo/user-geo-marks-core.ts");

const rows = {
  countries: [
    {
      id: "country-mx",
      iso2: "MX",
      iso3: "MEX",
      name_es: "Mexico",
      name_en: "Mexico",
      slug: "mexico",
      centroid_latitude: 23.6345,
      centroid_longitude: -102.5528,
      bbox: { west: -118.5, south: 14.5, east: -86.7, north: 32.8 },
    },
  ],
  regions: [
    {
      id: "region-roo",
      country_id: "country-mx",
      region_code: "MX-ROO",
      name_es: "Quintana Roo",
      name_en: "Quintana Roo",
      slug: "quintana-roo",
      region_type: "state",
      centroid_latitude: 19.1817,
      centroid_longitude: -88.4791,
      bbox: { west: -89.4, south: 17.8, east: -86.7, north: 21.7 },
    },
  ],
  cities: [
    {
      id: "city-holbox",
      country_id: "country-mx",
      region_id: "region-roo",
      official_name: "Holbox",
      name_es: "Holbox",
      name_en: "Holbox",
      slug: "holbox",
      city_type: "island_town",
      centroid_latitude: 21.5236,
      centroid_longitude: -87.3791,
      bbox: { west: -87.48, south: 21.48, east: -87.31, north: 21.57 },
    },
  ],
  aliases: [
    {
      entity_type: "country",
      entity_id: "country-mx",
      name: "México",
      normalized_name: "mexico",
      is_primary: true,
    },
    {
      entity_type: "city",
      entity_id: "city-holbox",
      name: "Isla Holbox",
      normalized_name: "isla holbox",
      is_primary: false,
    },
  ],
  marks: [
    {
      entity_type: "city",
      entity_id: "city-holbox",
      saved: false,
      visited: true,
    },
  ],
};

test("buildGeoSearchResults ranks canonical geo entities without spots", () => {
  const [result] = buildGeoSearchResults(rows, "mexico");
  assert.equal(result.kind, "geo");
  assert.equal(result.entityType, "country");
  assert.equal(result.id, "country-mx");
});

test("buildGeoSearchResults matches aliases and carries user mark state", () => {
  const [result] = buildGeoSearchResults(rows, "isla");
  assert.equal(result.entityType, "city");
  assert.equal(result.title, "Holbox");
  assert.equal(result.visited, true);
  assert.equal(result.saved, false);
});

test("parseGeoBoundingBox rejects malformed boxes", () => {
  assert.deepEqual(parseGeoBoundingBox({ west: -10, south: -5, east: 10, north: 5 }), {
    west: -10,
    south: -5,
    east: 10,
    north: 5,
  });
  assert.equal(parseGeoBoundingBox({ west: 10, south: -5, east: -10, north: 5 }), null);
  assert.equal(parseGeoBoundingBox(null), null);
});

test("buildUserGeoMarkPayload keeps visited exclusive from saved", () => {
  assert.deepEqual(buildUserGeoMarkPayload("user-1", "city", "city-holbox", "visited"), {
    user_id: "user-1",
    entity_type: "city",
    entity_id: "city-holbox",
    saved: false,
    visited: true,
  });
});
