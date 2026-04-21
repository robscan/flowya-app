/**
 * Tags personales por usuario (OL-EXPLORE-TAGS-001).
 * Normalización de slug en cliente; unicidad en BD (user_id, slug).
 */

import { supabase } from '@/lib/supabase';

export type UserTagRow = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: string;
};

const userTagsRevisionListeners = new Set<() => void>();
let userTagsRevision = 0;

function emitUserTagsRevision(): void {
  userTagsRevision += 1;
  for (const listener of userTagsRevisionListeners) listener();
}

export function subscribeUserTagsRevision(listener: () => void): () => void {
  userTagsRevisionListeners.add(listener);
  return () => {
    userTagsRevisionListeners.delete(listener);
  };
}

export function getUserTagsRevisionSnapshot(): number {
  return userTagsRevision;
}

/** Normaliza texto para slug: minúsculas, sin acentos, alfanumérico + guiones. */
export function normalizeTagSlug(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return '';
  const nfd = trimmed.normalize('NFD').replace(/\p{M}/gu, '');
  return nfd
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export async function listUserTags(): Promise<UserTagRow[]> {
  const { data, error } = await supabase
    .from('user_tags')
    .select('id, user_id, name, slug, created_at')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as UserTagRow[];
}

export async function searchUserTags(query: string): Promise<UserTagRow[]> {
  const q = query.trim();
  if (!q) return listUserTags();
  const { data, error } = await supabase
    .from('user_tags')
    .select('id, user_id, name, slug, created_at')
    .ilike('name', `%${q}%`)
    .order('name', { ascending: true })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as UserTagRow[];
}

export async function createOrGetUserTag(name: string): Promise<UserTagRow> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Tag vacío');
  const slug = normalizeTagSlug(trimmed);
  if (!slug) throw new Error('Tag inválido');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Sesión requerida para crear etiquetas');

  const { data: existing, error: selErr } = await supabase
    .from('user_tags')
    .select('id, user_id, name, slug, created_at')
    .eq('slug', slug)
    .eq('user_id', user.id)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing as UserTagRow;

  const { data: inserted, error: insErr } = await supabase
    .from('user_tags')
    .insert({ name: trimmed, slug, user_id: user.id })
    .select('id, user_id, name, slug, created_at')
    .single();
  if (!insErr) {
    emitUserTagsRevision();
    return inserted as UserTagRow;
  }
  if (insErr.code === '23505') {
    const { data: again, error: e2 } = await supabase
      .from('user_tags')
      .select('id, user_id, name, slug, created_at')
      .eq('slug', slug)
      .eq('user_id', user.id)
      .single();
    if (e2) throw e2;
    return again as UserTagRow;
  }
  throw insErr;
}

export async function renameUserTag(tagId: string, nextName: string): Promise<UserTagRow> {
  const trimmed = nextName.trim();
  if (!trimmed) throw new Error('Tag vacío');
  const slug = normalizeTagSlug(trimmed);
  if (!slug) throw new Error('Tag inválido');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error('Sesión requerida para editar etiquetas');

  const { data: duplicate, error: dupErr } = await supabase
    .from('user_tags')
    .select('id')
    .eq('user_id', user.id)
    .eq('slug', slug)
    .neq('id', tagId)
    .maybeSingle();
  if (dupErr) throw dupErr;
  if (duplicate) throw new Error('Ya existe una etiqueta con ese nombre');

  const { data, error } = await supabase
    .from('user_tags')
    .update({ name: trimmed, slug })
    .eq('id', tagId)
    .select('id, user_id, name, slug, created_at')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Ya existe una etiqueta con ese nombre');
    throw error;
  }
  emitUserTagsRevision();
  return data as UserTagRow;
}

export async function attachTagToSpot(spotId: string, tagId: string): Promise<void> {
  const { error } = await supabase.from('pin_tags').insert({ spot_id: spotId, tag_id: tagId });
  if (error) throw error;
  emitUserTagsRevision();
}

export async function detachTagFromSpot(spotId: string, tagId: string): Promise<void> {
  const { error } = await supabase.from('pin_tags').delete().eq('spot_id', spotId).eq('tag_id', tagId);
  if (error) throw error;
  emitUserTagsRevision();
}

export async function attachTagToSpots(spotIds: readonly string[], tagId: string): Promise<void> {
  const deduped = [...new Set(spotIds)].filter((id) => id.trim().length > 0);
  if (deduped.length === 0) return;
  const rows = deduped.map((spotId) => ({ spot_id: spotId, tag_id: tagId }));
  const { error } = await supabase.from('pin_tags').insert(rows);
  if (error) throw error;
  emitUserTagsRevision();
}

export async function detachTagFromSpots(spotIds: readonly string[], tagId: string): Promise<void> {
  const deduped = [...new Set(spotIds)].filter((id) => id.trim().length > 0);
  if (deduped.length === 0) return;
  const { error } = await supabase.from('pin_tags').delete().in('spot_id', deduped).eq('tag_id', tagId);
  if (error) throw error;
  emitUserTagsRevision();
}

/** Elimina la etiqueta del inventario (y todas las asociaciones pin_tags por CASCADE). */
export async function deleteUserTag(tagId: string): Promise<void> {
  const { error } = await supabase.from('user_tags').delete().eq('id', tagId);
  if (error) throw error;
  emitUserTagsRevision();
}

/** spot_id -> tag_id[] para el usuario actual (sesión). */
export async function fetchPinTagsIndexForSession(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase.from('pin_tags').select('spot_id, tag_id');
  if (error) throw error;
  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const sid = (row as { spot_id: string }).spot_id;
    const tid = (row as { tag_id: string }).tag_id;
    if (!map[sid]) map[sid] = [];
    map[sid].push(tid);
  }
  return map;
}

export type TagCount = { tag: UserTagRow; count: number };

export type CountTagsInSpotIdsOptions = {
  /**
   * Si es true, incluye todas las etiquetas con recuento 0 en el pool.
   * Útil en el buscador por filtro (p. ej. visitados) para que la fila de chips
   * siga visible aunque ningún spot del pool tenga aún esa etiqueta.
   */
  includeZeroCounts?: boolean;
};

/** Cuenta cuántos spots (en el pool dado) tienen cada tag. */
export function countTagsInSpotIds(
  tags: UserTagRow[],
  spotIds: Set<string>,
  pinIndex: Record<string, string[]>,
  options?: CountTagsInSpotIdsOptions,
): TagCount[] {
  const includeZero = options?.includeZeroCounts === true;
  const out: TagCount[] = [];
  for (const tag of tags) {
    let count = 0;
    for (const sid of spotIds) {
      const tids = pinIndex[sid];
      if (tids?.includes(tag.id)) count += 1;
    }
    if (count > 0 || includeZero) out.push({ tag, count });
  }
  out.sort((a, b) => b.count - a.count || a.tag.name.localeCompare(b.tag.name));
  return out;
}

export function countTagUsageById(pinIndex: Record<string, string[]>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tagIds of Object.values(pinIndex)) {
    const uniqueForSpot = new Set(tagIds);
    for (const tagId of uniqueForSpot) {
      counts[tagId] = (counts[tagId] ?? 0) + 1;
    }
  }
  return counts;
}
