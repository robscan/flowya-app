import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Web: evita el parpadeo light → dark al cargar.
 * El template `app/+html.tsx` aplica `prefers-color-scheme` en el documento antes del primer paint.
 *
 * `useSyncExternalStore` alinea con `matchMedia` (mismo criterio que RN Web) sin forzar
 * `'light'` hasta hidratar (patrón antiguo que causaba el salto visible).
 */
function subscribePreference(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function getPreferenceSnapshot(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getServerSnapshot(): 'light' | 'dark' {
  return 'light';
}

export function useColorScheme() {
  const mediaScheme = useSyncExternalStore(
    subscribePreference,
    getPreferenceSnapshot,
    getServerSnapshot,
  );
  const rnScheme = useRNColorScheme();
  if (rnScheme === 'light' || rnScheme === 'dark') {
    return rnScheme;
  }
  return mediaScheme;
}
