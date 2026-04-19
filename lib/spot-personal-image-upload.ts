import { supabase } from "@/lib/supabase";

function extensionForMime(mime: string | null | undefined): "jpg" {
  return "jpg";
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function uploadSpotPersonalGalleryImage(
  spotId: string,
  blob: Blob,
): Promise<{ storagePath: string } | null> {
  const ext = extensionForMime((blob as { type?: string }).type);
  const name = `${randomId()}.${ext}`;
  const storagePath = `${spotId}/gallery/${name}`;

  const { error } = await supabase.storage
    .from("spot-personal")
    .upload(storagePath, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: (blob as { type?: string }).type || "image/jpeg",
    });

  if (error) return null;
  return { storagePath };
}

