import assert from "node:assert/strict";
import test from "node:test";

const {
  bboxMaxSpanDegrees,
  doesCameraBBoxContainPoint,
  sanitizeCameraBBoxForPoint,
} = await import("../lib/places/cameraBBox.ts");

const meridaPoint = { lat: 20.9674, lng: -89.5926 };

test("sanitizeCameraBBoxForPoint keeps a bbox that contains the anchor point", () => {
  const bbox = { west: -89.75, south: 20.84, east: -89.45, north: 21.08 };

  assert.equal(sanitizeCameraBBoxForPoint(bbox, meridaPoint), bbox);
  assert.equal(doesCameraBBoxContainPoint(bbox, meridaPoint), true);
});

test("sanitizeCameraBBoxForPoint rejects contaminated bbox from another country", () => {
  const newOrleansBBox = {
    west: -90.138,
    south: 29.897,
    east: -89.902,
    north: 30.058,
  };

  assert.equal(sanitizeCameraBBoxForPoint(newOrleansBBox, meridaPoint), undefined);
  assert.equal(doesCameraBBoxContainPoint(newOrleansBBox, meridaPoint), false);
});

test("sanitizeCameraBBoxForPoint preserves large country or region bboxes when valid", () => {
  const mexicoBBox = { west: -118.45, south: 14.53, east: -86.7, north: 32.72 };

  assert.equal(sanitizeCameraBBoxForPoint(mexicoBBox, meridaPoint), mexicoBBox);
  assert.equal(bboxMaxSpanDegrees(mexicoBBox), 31.75);
});

test("sanitizeCameraBBoxForPoint rejects malformed bbox and invalid coordinates", () => {
  assert.equal(
    sanitizeCameraBBoxForPoint({ west: -89, south: 20, east: -90, north: 21 }, meridaPoint),
    undefined,
  );
  assert.equal(
    sanitizeCameraBBoxForPoint({ west: -89.75, south: 20.84, east: -89.45, north: 21.08 }, {
      lat: 120,
      lng: -89.5926,
    }),
    undefined,
  );
});
