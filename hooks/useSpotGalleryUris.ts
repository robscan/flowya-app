import { getSpotImagePublicUrl, listSpotImages } from '@/lib/spot-images';
import { useEffect, useState } from 'react';

/**
 * Carga URLs públicas de `spot_images` para un spot persistido (orden `sort_order`, primera ≈ portada).
 * Si la tabla aún no existe o hay error de red, devuelve [] (sin romper UI: se usa portada).
 */
export function useSpotGalleryUris(spotId: string | null | undefined): {
  galleryUris: string[];
  loading: boolean;
} {
  const [galleryUris, setGalleryUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!spotId || spotId.startsWith('draft_')) {
      setGalleryUris([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void listSpotImages(spotId)
      .then((rows) => {
        if (cancelled) return;
        setGalleryUris(rows.map((r) => getSpotImagePublicUrl(r)));
      })
      .catch(() => {
        if (cancelled) return;
        setGalleryUris([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [spotId]);

  return { galleryUris, loading };
}
