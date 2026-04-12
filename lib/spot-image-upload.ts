/**
 * Scope C: subida de imagen de portada a Supabase Storage.
 * Bucket: spot-covers. Path: {spotId}/cover.jpg
 *
 * OL-CONTENT-002: galería en {spotId}/gallery/{uuid}.jpg
 */

import { supabase } from '@/lib/supabase';

const BUCKET = 'spot-covers';

function newGalleryObjectName(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${crypto.randomUUID()}.jpg`;
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
}

/**
 * Sube el blob como imagen de portada del spot y devuelve la URL pública.
 * Si falla (400/500, token, etc.), devuelve null sin lanzar.
 */
export async function uploadSpotCover(spotId: string, blob: Blob): Promise<string | null> {
  const path = `${spotId}/cover.jpg`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    return null;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData?.publicUrl ?? null;
}

/**
 * Sube una imagen de galería (dueño del spot; política Storage `gallery`).
 * Devuelve URL pública o null si falla.
 */
export async function uploadSpotGalleryImage(spotId: string, blob: Blob): Promise<string | null> {
  const path = `${spotId}/gallery/${newGalleryObjectName()}`;
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });

  if (error) {
    return null;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData?.publicUrl ?? null;
}
