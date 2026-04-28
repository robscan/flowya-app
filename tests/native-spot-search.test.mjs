import assert from "node:assert/strict";
import test from "node:test";

const { filterNativeSpotResults } = await import("../lib/explore/native-spot-search.ts");

const spots = [
  { id: "1", title: "Gran Parque La Pancha", latitude: 20.97, longitude: -89.62 },
  { id: "2", title: "Plaza Principal Holbox", latitude: 21.52, longitude: -87.38 },
  { id: "3", title: "Museo Local", latitude: 9.92, longitude: -84.09 },
];

test("filterNativeSpotResults finds partial spot titles", () => {
  const [result] = filterNativeSpotResults(spots, "principal");
  assert.equal(result.id, "2");
});

test("filterNativeSpotResults is accent and case insensitive", () => {
  const [result] = filterNativeSpotResults(spots, "GRAN parque");
  assert.equal(result.id, "1");
});

test("filterNativeSpotResults returns empty for blank queries", () => {
  assert.deepEqual(filterNativeSpotResults(spots, " "), []);
});
