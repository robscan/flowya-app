import assert from "node:assert/strict";
import test from "node:test";

const {
  buildSpotSharePreviewHtml,
  buildSpotSharePreviewNotFoundHtml,
  isSharePreviewBotUserAgent,
  resolveSpotSharePreviewDescription,
} = await import("../lib/spot-share-preview.ts");

const sampleSpot = {
  id: "spot_123",
  title: "Cafe Central",
  description_short: "Brunch luminoso frente a la plaza.",
  description_long: "Descripcion larga que no deberia ganar cuando existe la corta.",
  address: "Calle 10 #42, Centro",
  cover_image_url: "https://cdn.flowya.app/spots/spot_123/cover.jpg",
};

test("resolveSpotSharePreviewDescription prefers short description and trims whitespace", () => {
  assert.equal(
    resolveSpotSharePreviewDescription({
      ...sampleSpot,
      description_short: "  Brunch luminoso frente a la plaza.  ",
    }),
    "Brunch luminoso frente a la plaza.",
  );
});

test("buildSpotSharePreviewHtml emits OG metadata and human redirect", () => {
  const html = buildSpotSharePreviewHtml({
    spot: sampleSpot,
    origin: "https://flowya.com",
    humanRedirect: true,
  });

  assert.match(html, /<meta property="og:title" content="Cafe Central · FLOWYA"/);
  assert.match(html, /<meta property="og:url" content="https:\/\/flowya\.com\/s\/spot_123"/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/cdn\.flowya\.app\/spots\/spot_123\/cover\.jpg"/);
  assert.match(html, /window\.location\.replace\("https:\/\/flowya\.com\/\?spotId=spot_123&sheet=medium"\)/);
});

test("buildSpotSharePreviewHtml omits redirect script for bots", () => {
  const html = buildSpotSharePreviewHtml({
    spot: { ...sampleSpot, cover_image_url: null },
    origin: "https://flowya.com",
    humanRedirect: false,
  });

  assert.doesNotMatch(html, /window\.location\.replace/);
  assert.match(html, /Vista previa p[\u00fa]blica de FLOWYA\./u);
  assert.match(html, /twitter:card" content="summary"/);
});

test("buildSpotSharePreviewNotFoundHtml points back to the app home", () => {
  const html = buildSpotSharePreviewNotFoundHtml("https://flowya.com");
  assert.match(html, /Lugar no encontrado · FLOWYA/);
  assert.match(html, /href="https:\/\/flowya\.com"/);
});

test("isSharePreviewBotUserAgent detects common crawlers", () => {
  assert.equal(isSharePreviewBotUserAgent("Twitterbot/1.0"), true);
  assert.equal(isSharePreviewBotUserAgent("Mozilla/5.0"), false);
});
