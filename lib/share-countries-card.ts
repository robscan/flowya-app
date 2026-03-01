import { Platform } from "react-native";

type CountriesCardItem = {
  key: string;
  label: string;
  count: number;
};

export type ShareCountriesCardInput = {
  title: string;
  countriesCount: number;
  spotsCount: number;
  items: CountriesCardItem[];
};

export type ShareCountriesCardResult = {
  shared: boolean;
  copied: boolean;
};

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const FORWARD_URL = "https://api.mapbox.com/search/geocode/v6/forward";
const centerCache = new Map<string, { lat: number; lng: number } | null>();

function projectEquirectangular(
  lng: number,
  lat: number,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  const x = left + ((lng + 180) / 360) * width;
  const y = top + ((90 - lat) / 180) * height;
  return { x, y };
}

function drawWorldBase(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  ctx.fillStyle = "rgba(95,102,132,0.23)";
  const blobs = [
    [0.19, 0.33, 0.26, 0.2],
    [0.35, 0.53, 0.11, 0.16],
    [0.52, 0.34, 0.22, 0.18],
    [0.76, 0.44, 0.27, 0.2],
    [0.85, 0.73, 0.1, 0.08],
  ] as const;
  for (const [cx, cy, w, h] of blobs) {
    ctx.beginPath();
    ctx.ellipse(
      left + cx * width,
      top + cy * height,
      (w * width) / 2,
      (h * height) / 2,
      -0.15,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

async function resolveCountryCenter(item: CountriesCardItem): Promise<{ lat: number; lng: number } | null> {
  const cacheKey = item.key || item.label;
  const cached = centerCache.get(cacheKey);
  if (cached !== undefined) return cached;
  if (!MAPBOX_TOKEN) {
    centerCache.set(cacheKey, null);
    return null;
  }
  const isoMatch = item.key.match(/^iso:([A-Z]{2})$/);
  const query = isoMatch ? isoMatch[1] : item.label;
  const params = new URLSearchParams({
    q: query,
    access_token: MAPBOX_TOKEN,
    limit: "1",
    types: "country",
    language: "es",
  });
  try {
    const response = await fetch(`${FORWARD_URL}?${params.toString()}`);
    if (!response.ok) {
      centerCache.set(cacheKey, null);
      return null;
    }
    const data = (await response.json()) as {
      features?: { geometry?: { coordinates?: [number, number] } }[];
    };
    const coordinates = data.features?.[0]?.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) {
      centerCache.set(cacheKey, null);
      return null;
    }
    const [lng, lat] = coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      centerCache.set(cacheKey, null);
      return null;
    }
    const resolved = { lat, lng };
    centerCache.set(cacheKey, resolved);
    return resolved;
  } catch {
    centerCache.set(cacheKey, null);
    return null;
  }
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  input: ShareCountriesCardInput,
  centers: { lat: number; lng: number }[],
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#161B36");
  gradient.addColorStop(1, "#0E1224");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const mapLeft = 48;
  const mapTop = 72;
  const mapWidth = width - mapLeft * 2;
  const mapHeight = Math.round(height * 0.5);
  drawWorldBase(ctx, mapLeft, mapTop, mapWidth, mapHeight);

  for (const center of centers) {
    const { x, y } = projectEquirectangular(center.lng, center.lat, mapLeft, mapTop, mapWidth, mapHeight);
    ctx.beginPath();
    ctx.fillStyle = "rgba(56,146,255,0.35)";
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "#2E8CFF";
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = "700 56px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(input.title, width / 2, Math.round(height * 0.64));

  const kpiYValue = Math.round(height * 0.79);
  const kpiYLabel = Math.round(height * 0.85);
  const k1x = Math.round(width * 0.34);
  const k2x = Math.round(width * 0.66);

  ctx.font = "700 72px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText(String(input.countriesCount), k1x, kpiYValue);
  ctx.fillText(String(input.spotsCount), k2x, kpiYValue);

  ctx.fillStyle = "rgba(255,255,255,0.74)";
  ctx.font = "500 42px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText("Países", k1x, kpiYLabel);
  ctx.fillText("Spots", k2x, kpiYLabel);

  ctx.textAlign = "left";
  ctx.font = "700 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText("FLOWYA", 48, height - 38);
}

export async function shareCountriesCard(input: ShareCountriesCardInput): Promise<ShareCountriesCardResult> {
  const shareTitle = `${input.title} · Flowya`;
  const fallbackText = `${input.title}\n${input.countriesCount} países · ${input.spotsCount} spots`;
  if (Platform.OS !== "web" || typeof document === "undefined") {
    const copied = await copyToClipboard(fallbackText);
    return { shared: false, copied };
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const context = canvas.getContext("2d");
  if (!context) {
    const copied = await copyToClipboard(fallbackText);
    return { shared: false, copied };
  }

  const centers = (
    await Promise.all(input.items.slice(0, 24).map((item) => resolveCountryCenter(item)))
  ).filter((item): item is { lat: number; lng: number } => item != null);

  drawCard(context, input, centers);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((value) => resolve(value), "image/png"),
  );
  if (!blob) {
    const copied = await copyToClipboard(fallbackText);
    return { shared: false, copied };
  }

  const file = new File([blob], "flowya-paises.png", { type: "image/png" });
  const canShareFile =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    (navigator.canShare?.({ files: [file], title: shareTitle, text: fallbackText }) ?? false);

  if (canShareFile) {
    try {
      await navigator.share({
        title: shareTitle,
        text: fallbackText,
        files: [file],
      });
      return { shared: true, copied: false };
    } catch {
      // user cancel/error, fallback below
    }
  }

  const canShareText =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    (navigator.canShare?.({ title: shareTitle, text: fallbackText }) ?? true);
  if (canShareText) {
    try {
      await navigator.share({ title: shareTitle, text: fallbackText });
      return { shared: true, copied: false };
    } catch {
      // fallback below
    }
  }

  const copied = await copyToClipboard(fallbackText);
  return { shared: false, copied };
}
