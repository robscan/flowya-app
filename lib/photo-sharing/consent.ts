import { supabase } from "@/lib/supabase";
import { updateMyProfile, type ProfileRow } from "@/lib/profile";

export type PhotoSharingPreference = boolean | null;

let cachedPref: PhotoSharingPreference = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

export async function fetchMyPhotoSharingPreference(): Promise<{
  pref: PhotoSharingPreference;
  profile: ProfileRow | null;
}> {
  const now = Date.now();
  if (now - cachedAt < CACHE_TTL_MS) {
    return { pref: cachedPref, profile: null };
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user || user.is_anonymous) return { pref: null, profile: null };

  const { data } = await supabase
    .from("profiles")
    .select("share_photos_with_world")
    .eq("id", user.id)
    .maybeSingle();

  const pref =
    data && typeof (data as { share_photos_with_world?: unknown }).share_photos_with_world === "boolean"
      ? ((data as { share_photos_with_world: boolean }).share_photos_with_world as boolean)
      : null;

  cachedPref = pref;
  cachedAt = now;
  return { pref, profile: null };
}

export async function persistMyPhotoSharingPreference(next: boolean): Promise<{
  ok: boolean;
  profile: ProfileRow | null;
  error: Error | null;
}> {
  // No necesitamos el perfil completo para persistir esta preferencia.
  const { data, error } = await updateMyProfile(
    { share_photos_with_world: next },
    { selectFullProfile: false },
  );
  if (error) return { ok: false, profile: null, error };
  cachedPref = next;
  cachedAt = Date.now();
  return { ok: true, profile: data, error: null };
}

