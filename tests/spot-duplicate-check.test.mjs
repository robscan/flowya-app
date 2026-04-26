import assert from "node:assert/strict";
import test from "node:test";

const {
  normalizeAddressKey,
  normalizeSpotTitle,
  titlesExactlyDuplicate,
} = await import("../lib/spot-duplicate-text.ts");

test("normalizeSpotTitle removes accents and collapses whitespace", () => {
  assert.equal(normalizeSpotTitle("  Café   CENTRAL  "), "cafe central");
});

test("titlesExactlyDuplicate only matches exact normalized titles", () => {
  assert.equal(titlesExactlyDuplicate("Cafe Central", "cafe central"), true);
  assert.equal(titlesExactlyDuplicate("Cafe Central", "Cafe Central Terraza"), false);
  assert.equal(titlesExactlyDuplicate("Panaderia San Juan", "San Juan"), false);
});

test("normalizeAddressKey keeps address matching exact and safe for empty values", () => {
  assert.equal(normalizeAddressKey(" Av. 5 de Mayo 123 "), "av. 5 de mayo 123");
  assert.equal(normalizeAddressKey(null), "");
  assert.equal(normalizeAddressKey(undefined), "");
});
