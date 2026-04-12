/**
 * OL-CONTENT-002 — Galería de imágenes por spot (`spot_images`).
 * Requiere migraciones 024 (tabla) y 025 (Storage gallery).
 */

import { supabase } from '@/lib/supabase';

export const MAX_SPOT_GALLERY_IMAGES = 12;

export type SpotImageRow = {
  id: string;
  spot_id: string;
  url: string;
  sort_order: number;
  created_at: string;
};

function rowFromDb(r: Record<string, unknown>): SpotImageRow {
  return {
    id: String(r.id),
    spot_id: String(r.spot_id),
    url: String(r.url),
    sort_order: Number(r.sort_order),
    created_at: String(r.created_at),
  };
}

/** Lista imágenes del spot por `sort_order` (primera = portada en mapa tras sincronizar). */
export async function listSpotImages(spotId: string): Promise<SpotImageRow[]> {
  const { data, error } = await supabase
    .from('spot_images')
    .select('id, spot_id, url, sort_order, created_at')
    .eq('spot_id', spotId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }
  return data.map((x) => rowFromDb(x as Record<string, unknown>));
}

/** Cuenta filas actuales (límite antes de insertar). */
export async function countSpotImages(spotId: string): Promise<number> {
  const { count, error } = await supabase
    .from('spot_images')
    .select('*', { count: 'exact', head: true })
    .eq('spot_id', spotId);

  if (error) return 0;
  return count ?? 0;
}

/** URL pública sin query (p. ej. cache-buster `?t=`) para alinear con Storage/DB. */
export function publicImageUrlWithoutQuery(url: string): string {
  const i = url.indexOf('?');
  return i === -1 ? url.trim() : url.slice(0, i).trim();
}

/**
 * Si `spot_images` está vacío pero el spot ya tiene portada en `spots.cover_image_url`,
 * inserta esa URL como fila (`sort_order` 0) para no perderla al añadir más fotos.
 */
export async function ensureGallerySeedFromCover(
  spotId: string,
  coverImageUrl: string | null | undefined,
): Promise<boolean> {
  if (!coverImageUrl?.trim()) return false;
  const n = await countSpotImages(spotId);
  if (n > 0) return false;
  const url = publicImageUrlWithoutQuery(coverImageUrl);
  if (!url) return false;
  const { error } = await supabase.from('spot_images').insert({
    spot_id: spotId,
    url,
    sort_order: 0,
  });
  return !error;
}

/**
 * Inserta una fila tras subida exitosa a Storage.
 * Respeta `MAX_SPOT_GALLERY_IMAGES`.
 */
export async function addSpotImageRow(
  spotId: string,
  publicUrl: string,
): Promise<{ row: SpotImageRow | null; error: 'limit' | 'db' | null }> {
  const n = await countSpotImages(spotId);
  if (n >= MAX_SPOT_GALLERY_IMAGES) {
    return { row: null, error: 'limit' };
  }

  const { data: maxRow } = await supabase
    .from('spot_images')
    .select('sort_order')
    .eq('spot_id', spotId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder =
    maxRow && typeof (maxRow as { sort_order?: number }).sort_order === 'number'
      ? (maxRow as { sort_order: number }).sort_order + 1
      : 0;

  const { data, error } = await supabase
    .from('spot_images')
    .insert({
      spot_id: spotId,
      url: publicUrl,
      sort_order: nextOrder,
    })
    .select('id, spot_id, url, sort_order, created_at')
    .single();

  if (error || !data) {
    return { row: null, error: 'db' };
  }
  return { row: rowFromDb(data as Record<string, unknown>), error: null };
}

/** Elimina la fila; intenta borrar el objeto en Storage desde la URL pública. */
export async function removeSpotImage(imageId: string): Promise<boolean> {
  const { data: row, error: fetchErr } = await supabase
    .from('spot_images')
    .select('id, url')
    .eq('id', imageId)
    .maybeSingle();

  if (fetchErr || !row) {
    return false;
  }

  const url = String((row as { url: string }).url);
  const storagePath = extractStoragePathFromPublicUrl(url);
  if (storagePath) {
    await supabase.storage.from('spot-covers').remove([storagePath]);
  }

  const { error } = await supabase.from('spot_images').delete().eq('id', imageId);
  return !error;
}

/**
 * Reordena asignando `sort_order` 0..n-1 según el orden de ids (primera = portada en mapa).
 */
export async function reorderSpotImages(spotId: string, orderedIds: string[]): Promise<boolean> {
  if (orderedIds.length === 0) {
    return true;
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('spot_images')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('spot_id', spotId);
    if (error) {
      return false;
    }
  }
  return true;
}

/**
 * Asigna `spots.cover_image_url` a la primera imagen por `sort_order`, o null si no hay filas.
 */
export async function syncCoverFromGallery(spotId: string): Promise<boolean> {
  const images = await listSpotImages(spotId);
  const first = images[0];
  const nextCover = first?.url ?? null;

  const { error } = await supabase.from('spots').update({ cover_image_url: nextCover }).eq('id', spotId);

  return !error;
}

/** `/object/public/spot-covers/<path>` → `<path>` */
export function extractStoragePathFromPublicUrl(publicUrl: string): string | null {
  try {
    const marker = '/object/public/spot-covers/';
    const i = publicUrl.indexOf(marker);
    if (i === -1) {
      return null;
    }
    return decodeURIComponent(publicUrl.slice(i + marker.length).split('?')[0]);
  } catch {
    return null;
  }
}
