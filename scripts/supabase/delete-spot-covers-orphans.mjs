#!/usr/bin/env node

/**
 * Delete orphan candidates from the public `spot-covers` bucket via Supabase Storage API.
 *
 * Safety defaults:
 * - dry-run unless `--execute` is passed;
 * - requires `SUPABASE_SERVICE_ROLE_KEY` only for live deletion;
 * - rechecks current DB references before deleting candidates backed up by migration 038;
 * - never writes secrets to disk.
 *
 * Required env:
 * - EXPO_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (temporary; required for dry-run and execute because the backup table has RLS)
 */

const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const json = args.has("--json");
const bucket = "spot-covers";

function die(message) {
  console.error(message);
  process.exit(1);
}

function normalizeBaseUrl(value) {
  return (value ?? "").trim().replace(/\/+$/, "");
}

function storagePathFromPublicUrl(url) {
  if (typeof url !== "string" || url.trim().length === 0) return null;
  const clean = url.split("?")[0];
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = clean.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(clean.slice(idx + marker.length));
}

async function requestJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return text.length > 0 ? JSON.parse(text) : null;
}

const supabaseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL);
const apiKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

if (!supabaseUrl) die("Missing EXPO_PUBLIC_SUPABASE_URL.");
if (!apiKey) die("Missing temporary SUPABASE_SERVICE_ROLE_KEY in the process env.");

const headers = {
  apikey: apiKey,
  Authorization: `Bearer ${apiKey}`,
};

const restBase = `${supabaseUrl}/rest/v1`;

const candidates = await requestJson(
  `${restBase}/spot_covers_orphan_delete_038_backup?select=name&order=name.asc`,
  { headers },
);

const [imageRows, spotRows] = await Promise.all([
  requestJson(
    `${restBase}/spot_images?select=storage_bucket,storage_path,url&or=(storage_bucket.eq.${bucket},url.ilike.*%2Fstorage%2Fv1%2Fobject%2Fpublic%2F${bucket}%2F*)`,
    { headers },
  ),
  requestJson(
    `${restBase}/spots?select=cover_image_url&cover_image_url=ilike.*%2Fstorage%2Fv1%2Fobject%2Fpublic%2F${bucket}%2F*`,
    { headers },
  ),
]);

const referenced = new Set();
for (const row of imageRows ?? []) {
  if (row.storage_bucket === bucket && typeof row.storage_path === "string" && row.storage_path.trim()) {
    referenced.add(row.storage_path.trim());
  }
  const fromUrl = storagePathFromPublicUrl(row.url);
  if (fromUrl) referenced.add(fromUrl);
}
for (const row of spotRows ?? []) {
  const fromUrl = storagePathFromPublicUrl(row.cover_image_url);
  if (fromUrl) referenced.add(fromUrl);
}

const safeCandidates = (candidates ?? [])
  .map((row) => String(row.name ?? "").trim())
  .filter((name) => name.length > 0 && !referenced.has(name));

if (!execute) {
  const payload = {
    mode: "dry-run",
    bucket,
    backedUpCandidates: candidates?.length ?? 0,
    currentlyReferenced: referenced.size,
    deleteCount: safeCandidates.length,
    paths: safeCandidates,
  };
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`DRY RUN: would delete ${safeCandidates.length} object(s) from ${bucket}.`);
    for (const path of safeCandidates) console.log(path);
  }
  process.exit(0);
}

if (safeCandidates.length === 0) {
  console.log(JSON.stringify({ mode: "execute", bucket, deleted: 0, paths: [] }, null, 2));
  process.exit(0);
}

const result = await requestJson(`${supabaseUrl}/storage/v1/object/${bucket}`, {
  method: "DELETE",
  headers: {
    ...headers,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prefixes: safeCandidates }),
});

console.log(
  JSON.stringify(
    {
      mode: "execute",
      bucket,
      requested: safeCandidates.length,
      deleted: Array.isArray(result) ? result.length : safeCandidates.length,
      paths: safeCandidates,
    },
    null,
    2,
  ),
);
