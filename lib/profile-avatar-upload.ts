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

/**
 * Evita anexar `profiles.updated_at` a la URL del avatar: cualquier UPDATE en `profiles`
 * (p. ej. `last_activity_at` vía trigger `updated_at`) forzaría recargas constantes en `<Image />`.
 * Solo se añade query `v` cuando el cliente invalida explícitamente (subida / borrado / cambio de sesión).
 */
let profileAvatarDisplayBust = 0;
const profileAvatarDisplayBustListeners = new Set<() => void>();

export function subscribeProfileAvatarDisplayBust(onChange: () => void): () => void {
  profileAvatarDisplayBustListeners.add(onChange);
  return () => profileAvatarDisplayBustListeners.delete(onChange);
}

export function getProfileAvatarDisplayBustSnapshot(): number {
  return profileAvatarDisplayBust;
}

export function bumpProfileAvatarDisplayBust(): void {
  profileAvatarDisplayBust += 1;
  profileAvatarDisplayBustListeners.forEach((cb) => cb());
}

export function resetProfileAvatarDisplayBust(): void {
  profileAvatarDisplayBust = 0;
  profileAvatarDisplayBustListeners.forEach((cb) => cb());
}

export function buildProfileAvatarDisplayUrl(
  storagePath: string | null | undefined,
  bust: number,
): string | null {
  const base = getProfileAvatarPublicUrl(storagePath);
  if (!base) return null;
  if (bust <= 0) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${bust}`;
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
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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
      input.multiple = false;
      input.style.position = "fixed";
      input.style.left = "-9999px";
      let settled = false;
      let focusListenerActive = false;
      let fallbackTimer: number | null = null;
      /** `focus` suele dispararse antes que `change`; con 0 ms se resolvía cancelación y se perdía el archivo. */
      let focusCancelTimer: number | null = null;

      const clearFocusCancelTimer = () => {
        if (focusCancelTimer != null) {
          window.clearTimeout(focusCancelTimer);
          focusCancelTimer = null;
        }
      };

      const finalize = (blob: Blob | null) => {
        if (settled) return;
        settled = true;
        clearFocusCancelTimer();
        if (fallbackTimer != null) {
          window.clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
        if (focusListenerActive) {
          window.removeEventListener("focus", onWindowFocus);
          focusListenerActive = false;
        }
        input.removeEventListener("change", onChange);
        input.removeEventListener("cancel", onCancel);
        input.remove();
        resolve(blob);
      };

      const onChange = () => {
        clearFocusCancelTimer();
        const file = input.files?.[0];
        finalize(file instanceof Blob ? file : null);
      };

      const onCancel = () => {
        finalize(null);
      };

      const onWindowFocus = () => {
        clearFocusCancelTimer();
        focusCancelTimer = window.setTimeout(() => {
          focusCancelTimer = null;
          if (settled) return;
          if ((input.files?.length ?? 0) > 0) return;
          finalize(null);
        }, 500);
      };

      input.addEventListener("change", onChange);
      input.addEventListener("cancel", onCancel);
      document.body.appendChild(input);
      window.addEventListener("focus", onWindowFocus);
      focusListenerActive = true;
      input.click();
      // Último recurso (si el navegador no dispara focus/change por alguna razón).
      // Nota: no usar timeout corto; en móvil web el selector puede tardar.
      fallbackTimer = window.setTimeout(() => finalize(null), 60_000);
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
