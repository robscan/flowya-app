/**
 * Scope C: subida de imagen de portada a Supabase Storage.
 * Bucket: spot-covers. Path: {spotId}/cover.jpg
 */

import { supabase } from '@/lib/supabase';

const BUCKET = 'spot-covers';

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
