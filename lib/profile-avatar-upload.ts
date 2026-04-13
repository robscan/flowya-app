/**
 * Avatar de perfil en bucket `profile-avatars` — una imagen por usuario (`{userId}/avatar.jpg`).
 */

import { Platform } from "react-native";

import { optimizeSpotImage } from "@/lib/spot-image-optimize";
import { supabase } from "@/lib/supabase";

export const PROFILE_AVATARS_BUCKET = "profile-avatars";

export function getProfileAvatarPublicUrl(
  storagePath: string | null | undefined,
): string | null {
  const p = storagePath?.trim();
  if (!p) return null;
  const { data } = supabase.storage.from(PROFILE_AVATARS_BUCKET).getPublicUrl(p);
  return data?.publicUrl ?? null;
}

function profileAvatarObjectPath(userId: string): string {
  return `${userId}/avatar.jpg`;
}

/**
 * Sube imagen optimizada y devuelve ruta en Storage + URL pública.
 */
export async function uploadMyProfileAvatar(
  imageBlob: Blob,
): Promise<{ storagePath: string; publicUrl: string } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id || user.is_anonymous) return null;

  const optimized = await optimizeSpotImage(imageBlob);
  const toUpload = optimized.ok ? optimized.blob : optimized.fallbackBlob;
  if (!toUpload) return null;

  const path = profileAvatarObjectPath(user.id);
  const { data, error } = await supabase.storage.from(PROFILE_AVATARS_BUCKET).upload(path, toUpload, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error || !data?.path) return null;

  const publicUrl = getProfileAvatarPublicUrl(data.path);
  if (!publicUrl) return null;
  return { storagePath: data.path, publicUrl };
}

export async function deleteMyProfileAvatarObject(
  storagePath: string | null | undefined,
): Promise<boolean> {
  const p = storagePath?.trim();
  if (!p) return true;
  const { error } = await supabase.storage.from(PROFILE_AVATARS_BUCKET).remove([p]);
  return error == null;
}

/** Web: input file. Nativo: galería con recorte 1:1. */
export async function pickProfileImageBlob(): Promise<Blob | null> {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    return await new Promise<Blob | null>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.position = "fixed";
      input.style.left = "-9999px";
      let settled = false;
      const finalize = (blob: Blob | null) => {
        if (settled) return;
        settled = true;
        input.onchange = null;
        input.remove();
        resolve(blob);
      };
      input.onchange = () => {
        const file = input.files?.[0];
        finalize(file instanceof Blob ? file : null);
      };
      document.body.appendChild(input);
      input.click();
      window.setTimeout(() => finalize(null), 30000);
    });
  }

  const ImagePicker = await import("expo-image-picker");
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0] as (typeof result.assets)[number] & { file?: Blob };
  if (asset.file instanceof Blob) return asset.file;
  if (asset.uri) {
    const res = await fetch(asset.uri);
    if (!res.ok) return null;
    return await res.blob();
  }
  return null;
}
