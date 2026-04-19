import { fetchMyProfile } from "@/lib/profile";
import {
  buildProfileAvatarDisplayUrl,
  getProfileAvatarDisplayBustSnapshot,
} from "@/lib/profile-avatar-upload";
import { supabase } from "@/lib/supabase";

export type ShareCardResolvedProfile = {
  shareCardDisplayName: string | null;
  shareCardAvatarDataUrl: string | null;
};

/**
 * Nombre + avatar en data URL para el pie de `shareCountriesCard` (solo cuando hay sesión).
 */
export async function resolveShareCardProfileForCurrentUser(): Promise<ShareCardResolvedProfile> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user?.id || user.is_anonymous) {
      return { shareCardDisplayName: null, shareCardAvatarDataUrl: null };
    }

    const { data: profile } = await fetchMyProfile();
    const displayName =
      profile?.display_name?.trim() ||
      profile?.email?.trim() ||
      user.email?.trim() ||
      null;

    let shareCardAvatarDataUrl: string | null = null;
    const path = profile?.avatar_storage_path?.trim();
    if (path) {
      const url = buildProfileAvatarDisplayUrl(path, getProfileAvatarDisplayBustSnapshot());
      if (url) {
        try {
          const res = await fetch(url, { mode: "cors" });
          if (res.ok) {
            const blob = await res.blob();
            shareCardAvatarDataUrl = await new Promise<string | null>((resolve) => {
              const fr = new FileReader();
              fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : null);
              fr.onerror = () => resolve(null);
              fr.readAsDataURL(blob);
            });
          }
        } catch {
          /* bucket CORS o red */
        }
      }
    }

    return { shareCardDisplayName: displayName, shareCardAvatarDataUrl };
  } catch {
    return { shareCardDisplayName: null, shareCardAvatarDataUrl: null };
  }
}
