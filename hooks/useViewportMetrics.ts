/**
 * useViewportMetrics — Visual Viewport as source of truth on web.
 * Returns viewport height, offsetTop, and keyboard height for overlay/sheet layout.
 * Only active when window.visualViewport exists (web); returns null on native.
 */

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type ViewportMetrics = {
  viewportHeight: number;
  offsetTop: number;
  keyboardHeight: number;
};

export function useViewportMetrics(): ViewportMetrics | null {
  const [metrics, setMetrics] = useState<ViewportMetrics | null>(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.visualViewport)
      return null;
    const vv = window.visualViewport;
    return {
      viewportHeight: vv.height,
      offsetTop: vv.offsetTop,
      keyboardHeight: Math.max(0, window.innerHeight - vv.height - vv.offsetTop),
    };
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () =>
      setMetrics({
        viewportHeight: vv.height,
        offsetTop: vv.offsetTop,
        keyboardHeight: Math.max(0, window.innerHeight - vv.height - vv.offsetTop),
      });
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return metrics;
}
