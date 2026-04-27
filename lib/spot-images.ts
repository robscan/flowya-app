/**
 * OL-CONTENT-002 — Galería de imágenes por spot (`spot_images`).
 * Requiere migraciones 024 (tabla) y 025 (Storage gallery).
 */

import { supabase } from '@/lib/supabase';

export const MAX_SPOT_GALLERY_IMAGES = 12;

type SpotImagesCacheEntry = {
  at: number;
  rows: SpotImageRow[];
  inflight?: Promise<SpotImageRow[]>;
};

const CACHE_TTL_MS = 15_000;
const spotImagesCache = new Map<string, SpotImagesCacheEntry>();

export function invalidateSpotImagesCache(spotId: string): void {
  spotImagesCache.delete(spotId);
}

function setSpotImagesCache(spotId: string, rows: SpotImageRow[]): void {
  spotImagesCache.set(spotId, { at: Date.now(), rows });
}

function getSpotImagesCache(spotId: string): SpotImagesCacheEntry | null {
  const entry = spotImagesCache.get(spotId);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    spotImagesCache.delete(spotId);
    return null;
  }
  return entry;
}

export type SpotImageRow = {
  id: string;
  spot_id: string;
  url: string;
  storage_bucket: string | null;
  storage_path: string | null;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  thumb_path: string | null;
  version: number;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
};

function rowFromDb(r: Record<string, unknown>): SpotImageRow {
  return {
    id: String(r.id),
    spot_id: String(r.spot_id),
    url: String(r.url),
    storage_bucket: typeof r.storage_bucket === 'string' ? r.storage_bucket : null,
    storage_path: typeof r.storage_path === 'string' ? r.storage_path : null,
    width: typeof r.width === 'number' ? r.width : null,
    height: typeof r.height === 'number' ? r.height : null,
    blurhash: typeof r.blurhash === 'string' ? r.blurhash : null,
    thumb_path: typeof r.thumb_path === 'string' ? r.thumb_path : null,
    version: typeof r.version === 'number' ? r.version : 1,
    sort_order: Number(r.sort_order),
    created_at: String(r.created_at),
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : null,
  };
}

export function getSpotImagePublicUrl(row: Pick<SpotImageRow, 'url' | 'storage_bucket' | 'storage_path'>): string {
  const bucket = row.storage_bucket?.trim();
  const path = row.storage_path?.trim();
  if (bucket === 'spot-covers' && path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (data.publicUrl) return data.publicUrl;
  }
  return row.url;
}

/** Lista imágenes del spot por `sort_order` (primera = portada en mapa tras sincronizar). */
export async function listSpotImages(spotId: string): Promise<SpotImageRow[]> {
  const cached = getSpotImagesCache(spotId);
  if (cached?.rows) return cached.rows;
  if (cached?.inflight) return await cached.inflight;

  const run = (async () => {
    const { data, error } = await supabase
    .from('spot_images')
    .select('id, spot_id, url, storage_bucket, storage_path, width, height, blurhash, thumb_path, version, sort_order, created_at, updated_at')
    .eq('spot_id', spotId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

    if (error || !data) {
      setSpotImagesCache(spotId, []);
      return [];
    }
    const rows = data.map((x) => rowFromDb(x as Record<string, unknown>));
    setSpotImagesCache(spotId, rows);
    return rows;
  })();

  spotImagesCache.set(spotId, { at: Date.now(), rows: [], inflight: run });
  try {
    return await run;
  } finally {
    const latest = spotImagesCache.get(spotId);
    if (latest?.inflight === run) {
      // inflight se limpia cuando run completa (rows ya fueron seteadas).
      spotImagesCache.set(spotId, { at: Date.now(), rows: latest.rows });
    }
  }
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
  const storagePath = extractStoragePathFromPublicUrl(url);
  const { error } = await supabase.from('spot_images').insert({
    spot_id: spotId,
    url,
    storage_bucket: storagePath ? 'spot-covers' : null,
    storage_path: storagePath,
    sort_order: 0,
  });
  if (!error) invalidateSpotImagesCache(spotId);
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
  const normalizedUrl = publicImageUrlWithoutQuery(publicUrl);
  const storagePath = extractStoragePathFromPublicUrl(normalizedUrl);

  const { data, error } = await supabase
    .from('spot_images')
    .insert({
      spot_id: spotId,
      url: normalizedUrl,
      storage_bucket: storagePath ? 'spot-covers' : null,
      storage_path: storagePath,
      sort_order: nextOrder,
    })
    .select('id, spot_id, url, storage_bucket, storage_path, width, height, blurhash, thumb_path, version, sort_order, created_at, updated_at')
    .single();

  if (error || !data) {
    return { row: null, error: 'db' };
  }
  invalidateSpotImagesCache(spotId);
  return { row: rowFromDb(data as Record<string, unknown>), error: null };
}

/** Elimina la fila; intenta borrar el objeto en Storage desde la URL pública. */
export async function removeSpotImage(imageId: string): Promise<boolean> {
  const { data: row, error: fetchErr } = await supabase
    .from('spot_images')
    .select('id, url, storage_path, spot_id')
    .eq('id', imageId)
    .maybeSingle();

  if (fetchErr || !row) {
    return false;
  }

  const url = String((row as { url: string }).url);
  const storagePath =
    typeof (row as { storage_path?: unknown }).storage_path === 'string'
      ? String((row as { storage_path: string }).storage_path)
      : extractStoragePathFromPublicUrl(url);
  // Primero eliminar la fila DB (rápido) para que la UI pueda actualizar sin esperar a Storage.
  // Luego, intentar limpiar el objeto en Storage en background (no bloquear).
  const { error } = await supabase.from('spot_images').delete().eq('id', imageId);
  if (error) return false;
  const spotId = String((row as { spot_id?: string }).spot_id ?? '');
  if (spotId) invalidateSpotImagesCache(spotId);

  if (storagePath) {
    void supabase.storage.from('spot-covers').remove([storagePath]);
  }
  return true;
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
  invalidateSpotImagesCache(spotId);
  return true;
}

/**
 * Asigna `spots.cover_image_url` a la primera imagen por `sort_order`, o null si no hay filas.
 */
export async function syncCoverFromGallery(spotId: string): Promise<boolean> {
  const images = await listSpotImages(spotId);
  const first = images[0];
  const nextCover = first ? getSpotImagePublicUrl(first) : null;

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
