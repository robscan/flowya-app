import assert from "node:assert/strict";
import test from "node:test";

const {
  normalizeSearchText,
  tokenizeSearchText,
} = await import("../lib/search/intent-normalize.ts");

const {
  buildSpotSearchDocument,
  scoreSpotForQuery,
} = await import("../lib/search/intent-scoring.ts");

function doc(title, extra = {}) {
  return buildSpotSearchDocument({
    id: title,
    title,
    latitude: 20.97,
    longitude: -89.62,
    ...extra,
  });
}

test("normalizeSearchText removes accents, punctuation and repeated spaces", () => {
  assert.equal(normalizeSearchText("  Café,   La-Plancha!! "), "cafe la plancha");
  assert.deepEqual(tokenizeSearchText("Gran Parque"), ["gran", "parque"]);
});

test("scoreSpotForQuery finds internal title tokens", () => {
  const score = scoreSpotForQuery(doc("Gran Parque La Pancha"), "parque");
  assert.equal(score.matchedField, "title");
  assert.ok(score.score >= 80);
});

test("scoreSpotForQuery recovers light typo for long title tokens", () => {
  const plancha = scoreSpotForQuery(doc("Gran Parque La Pancha"), "plancha");
  const placha = scoreSpotForQuery(doc("Gran Parque La Pancha"), "placha");
  assert.equal(plancha.matchedField, "title");
  assert.equal(placha.matchedField, "title");
  assert.ok(plancha.score >= 55);
  assert.ok(placha.score >= 55);
});

test("scoreSpotForQuery supports accent-insensitive city/address matches conservatively", () => {
  const score = scoreSpotForQuery(
    doc("Museo Local", { address: "Mérida, Yucatán, México" }),
    "merida",
  );
  assert.equal(score.matchedField, "secondary");
  assert.ok(score.score >= 40);
  assert.ok(score.score < 60);
});
