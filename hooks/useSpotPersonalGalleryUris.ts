import { createSpotPersonalImageSignedUrl, listSpotPersonalImages } from "@/lib/spot-personal-images";
import { useEffect, useState } from "react";

/**
 * Carga URLs firmadas de `spot_personal_images` para el usuario autenticado.
 * Si no hay filas o la consulta falla, devuelve [] sin romper la UI.
 */
export function useSpotPersonalGalleryUris(
  spotId: string | null | undefined,
  enabled: boolean = true,
): {
  personalGalleryUris: string[];
  loading: boolean;
} {
  const [personalGalleryUris, setPersonalGalleryUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !spotId || spotId.startsWith("draft_")) {
      setPersonalGalleryUris([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void listSpotPersonalImages(spotId)
      .then(async (rows) => {
        if (cancelled) return;
        if (rows.length === 0) {
          setPersonalGalleryUris([]);
          return;
        }
        const signed = (
          await Promise.all(rows.map((row) => createSpotPersonalImageSignedUrl(row.storage_path)))
        ).filter((uri): uri is string => Boolean(uri));
        if (cancelled) return;
        setPersonalGalleryUris(signed);
      })
      .catch(() => {
        if (cancelled) return;
        setPersonalGalleryUris([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, spotId]);

  return { personalGalleryUris, loading };
}
