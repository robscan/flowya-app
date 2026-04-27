export type CameraBBox = { west: number; south: number; east: number; north: number };
export type CameraPoint = { lat: number; lng: number };

export function bboxMaxSpanDegrees(bbox: CameraBBox): number {
  return Math.max(Math.abs(bbox.east - bbox.west), Math.abs(bbox.north - bbox.south));
}

export function isFiniteCameraBBox(bbox: CameraBBox | null | undefined): bbox is CameraBBox {
  if (!bbox) return false;
  const values = [bbox.west, bbox.south, bbox.east, bbox.north];
  if (!values.every((value) => typeof value === 'number' && Number.isFinite(value))) return false;
  if (bbox.west < -180 || bbox.east > 180 || bbox.south < -90 || bbox.north > 90) return false;
  if (bbox.west >= bbox.east || bbox.south >= bbox.north) return false;
  return true;
}

export function isFiniteCameraPoint(point: CameraPoint | null | undefined): point is CameraPoint {
  return (
    !!point &&
    typeof point.lat === 'number' &&
    Number.isFinite(point.lat) &&
    Math.abs(point.lat) <= 90 &&
    typeof point.lng === 'number' &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lng) <= 180
  );
}

export function doesCameraBBoxContainPoint(
  bbox: CameraBBox | null | undefined,
  point: CameraPoint | null | undefined,
): boolean {
  if (!isFiniteCameraBBox(bbox) || !isFiniteCameraPoint(point)) return false;
  return (
    point.lng >= bbox.west &&
    point.lng <= bbox.east &&
    point.lat >= bbox.south &&
    point.lat <= bbox.north
  );
}

export function sanitizeCameraBBoxForPoint(
  bbox: CameraBBox | null | undefined,
  point: CameraPoint | null | undefined,
): CameraBBox | undefined {
  return doesCameraBBoxContainPoint(bbox, point) ? bbox ?? undefined : undefined;
}
