export type GeolocationPermissionState = 'granted' | 'prompt' | 'denied' | 'unsupported';

export type RequestCurrentLocationResult =
  | {
      status: 'ok';
      coords: { latitude: number; longitude: number };
    }
  | { status: 'denied' | 'timeout' | 'unavailable' | 'unsupported' | 'unknown' };

const DEFAULT_GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000,
};

function hasGeolocationSupport(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.geolocation !== 'undefined';
}

function getCurrentPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export async function getGeolocationPermissionState(): Promise<GeolocationPermissionState> {
  if (!hasGeolocationSupport()) return 'unsupported';
  if (typeof navigator.permissions?.query !== 'function') return 'prompt';

  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    if (status.state === 'granted') return 'granted';
    if (status.state === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

export async function requestCurrentLocation(
  options: PositionOptions = DEFAULT_GEO_OPTIONS
): Promise<RequestCurrentLocationResult> {
  if (!hasGeolocationSupport()) return { status: 'unsupported' };

  const permissionState = await getGeolocationPermissionState();
  if (permissionState === 'denied') return { status: 'denied' };

  try {
    const pos = await getCurrentPosition(options);
    return {
      status: 'ok',
      coords: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      },
    };
  } catch (error) {
    const err = error as GeolocationPositionError | undefined;
    switch (err?.code) {
      case 1:
        return { status: 'denied' };
      case 2:
        return { status: 'unavailable' };
      case 3:
        return { status: 'timeout' };
      default:
        return { status: 'unknown' };
    }
  }
}
