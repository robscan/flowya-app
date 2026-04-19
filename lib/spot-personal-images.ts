import { supabase } from "@/lib/supabase";

export const MAX_SPOT_PERSONAL_IMAGES = 12;

export type SpotPersonalImageRow = {
  id: string;
  spot_id: string;
  user_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
};

function rowFromDb(r: Record<string, unknown>): SpotPersonalImageRow {
  return {
    id: String(r.id),
    spot_id: String(r.spot_id),
    user_id: String(r.user_id),
    storage_path: String(r.storage_path),
    sort_order: Number(r.sort_order),
    created_at: String(r.created_at),
  };
}

export async function listSpotPersonalImages(spotId: string): Promise<SpotPersonalImageRow[]> {
  const { data, error } = await supabase
    .from("spot_personal_images")
    .select("id, spot_id, user_id, storage_path, sort_order, created_at")
    .eq("spot_id", spotId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((x) => rowFromDb(x as Record<string, unknown>));
}

export async function countSpotPersonalImages(spotId: string): Promise<number> {
  const { count, error } = await supabase
    .from("spot_personal_images")
    .select("*", { count: "exact", head: true })
    .eq("spot_id", spotId);
  if (error) return 0;
  return count ?? 0;
}

export async function addSpotPersonalImageRow(args: {
  spotId: string;
  userId: string;
  storagePath: string;
}): Promise<{ row: SpotPersonalImageRow | null; error: "limit" | "db" | null }> {
  const n = await countSpotPersonalImages(args.spotId);
  if (n >= MAX_SPOT_PERSONAL_IMAGES) return { row: null, error: "limit" };

  const { data: maxRow } = await supabase
    .from("spot_personal_images")
    .select("sort_order")
    .eq("spot_id", args.spotId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder =
    maxRow && typeof (maxRow as { sort_order?: number }).sort_order === "number"
      ? (maxRow as { sort_order: number }).sort_order + 1
      : 0;

  const { data, error } = await supabase
    .from("spot_personal_images")
    .insert({
      spot_id: args.spotId,
      user_id: args.userId,
      storage_path: args.storagePath,
      sort_order: nextOrder,
    })
    .select("id, spot_id, user_id, storage_path, sort_order, created_at")
    .single();

  if (error || !data) return { row: null, error: "db" };
  return { row: rowFromDb(data as Record<string, unknown>), error: null };
}

export async function removeSpotPersonalImage(imageId: string): Promise<boolean> {
  const { data: row, error: fetchErr } = await supabase
    .from("spot_personal_images")
    .select("id, storage_path")
    .eq("id", imageId)
    .maybeSingle();
  if (fetchErr || !row) return false;

  const storagePath = String((row as { storage_path: string }).storage_path);
  const { error } = await supabase.from("spot_personal_images").delete().eq("id", imageId);
  if (error) return false;

  if (storagePath) {
    void supabase.storage.from("spot-personal").remove([storagePath]);
  }
  return true;
}

export async function createSpotPersonalImageSignedUrl(
  storagePath: string,
  expiresInSeconds: number = 60 * 10,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("spot-personal")
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

