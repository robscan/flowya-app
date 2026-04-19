import { Platform } from "react-native";
import { Colors } from "@/constants/theme";
import { computeTravelerPoints, resolveTravelerLevelByPoints } from "@/lib/traveler-levels";
import { resolveShareCardProfileForCurrentUser } from "@/lib/share-countries-card-profile";

type CountriesCardItem = {
  key: string;
  label: string;
  count: number;
};

export type ShareCountriesCardInput = {
  title: string;
  countriesCount: number;
  spotsCount: number;
  worldPercentage?: number;
  accentColor?: string;
  mapSnapshotDataUrl?: string | null;
  items: CountriesCardItem[];
  /** Pie de tarjeta: nombre (p. ej. display_name o email). */
  shareCardDisplayName?: string | null;
  /** Avatar en data URL para el canvas (evita CORS al pintar). */
  shareCardAvatarDataUrl?: string | null;
};

export type ShareCountriesCardResult = {
  shared: boolean;
  copied: boolean;
  downloaded: boolean;
};

/** Firma compatible con `useSystemStatus().show` para feedback post-compartir. */
export type ShareCountriesToastShow = (
  message: string,
  options?: { type?: "success" | "default" | "error"; replaceVisible?: boolean },
) => void;

/** Misma copia que usa `MapScreenVNext` tras `shareCountriesCard` (evita divergencias con Perfil). */
export function notifyShareCountriesCardOutcome(
  result: ShareCountriesCardResult,
  show: ShareCountriesToastShow,
  opts?: { suppress?: boolean },
): void {
  if (opts?.suppress) return;
  if (result.shared) return;
  if (result.downloaded) {
    show("Imagen guardada en tu computadora.", { type: "default", replaceVisible: true });
    return;
  }
  if (result.copied) {
    show("Resumen copiado al portapapeles.", { type: "default", replaceVisible: true });
    return;
  }
  show("No se pudo compartir en este dispositivo.", { type: "default", replaceVisible: true });
}

let shareCountriesInFlight = false;
let shareCountriesLastAt = 0;
let shareCountriesPromise: Promise<ShareCountriesCardResult> | null = null;
const SHARE_COOLDOWN_MS = 1200;

/**
 * Rectángulo del mapa en la composición «Países visitados» (`drawCard`, diseño 1600×2000, márgenes `side=52`).
 * La captura offscreen (`visited-countries-share/capture-map.web`) debe respetar **width/height** para que
 * `drawImageContain` rellene el mismo hueco que un snapshot generado en el preview del sheet.
 */
export const SHARE_COUNTRIES_VISITED_MAP_SLOT = { width: 1496, height: 830 } as const;

function drawRoundedClip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if (width <= 0 || height <= 0) return;
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const srcW = image.naturalWidth || image.width;
  const srcH = image.naturalHeight || image.height;
  if (!srcW || !srcH) return;
  // Allow upscaling to keep the map proportionally dominant in the share layout.
  const scale = Math.min(width / srcW, height / srcH);
  const drawW = Math.round(srcW * scale);
  const drawH = Math.round(srcH * scale);
  const dx = x + (width - drawW) / 2;
  const dy = y + (height - drawH) / 2;
  ctx.drawImage(image, dx, dy, drawW, drawH);
}

/** Rellena el círculo (recorte tipo `cover` / `resizeMode="cover"`). */
function drawImageInCircle(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cx: number,
  cy: number,
  r: number,
) {
  const srcW = image.naturalWidth || image.width;
  const srcH = image.naturalHeight || image.height;
  if (!srcW || !srcH) return;
  const box = r * 2;
  const scale = Math.max(box / srcW, box / srcH);
  const drawW = Math.round(srcW * scale);
  const drawH = Math.round(srcH * scale);
  const dx = cx - drawW / 2;
  const dy = cy - drawH / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, dx, dy, drawW, drawH);
  ctx.restore();
}

function fillTextTruncatedLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  let t = text;
  if (ctx.measureText(t).width <= maxWidth) {
    ctx.fillText(t, x, y);
    return;
  }
  const ellipsis = "…";
  while (t.length > 1 && ctx.measureText(`${t}${ellipsis}`).width > maxWidth) {
    t = t.slice(0, -1);
  }
  ctx.fillText(`${t}${ellipsis}`, x, y);
}

function truncateLabel(input: string, max = 26): string {
  const text = input.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

async function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement | null> {
  if (typeof window === "undefined" || !dataUrl) return null;
  try {
    const image = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    return image;
  } catch {
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
  mapImage: HTMLImageElement | null,
  profileAvatarImage: HTMLImageElement | null,
) {
  const DESIGN_WIDTH = 1600;
  const DESIGN_HEIGHT = 2000;
  const width = ctx.canvas.width;
  const scale = width / DESIGN_WIDTH;
  const logicalWidth = DESIGN_WIDTH;
  const logicalHeight = DESIGN_HEIGHT;
  const accent = input.accentColor ?? "#35D563";
  const isToVisit = /por visitar/i.test(input.title);
  const side = 52;
  const mapTop = 430;
  const mapWidth = SHARE_COUNTRIES_VISITED_MAP_SLOT.width;
  const mapHeight = SHARE_COUNTRIES_VISITED_MAP_SLOT.height;
  const mapRadius = 34;
  const kpiTop = 230;
  const kpiGap = 36;
  const kpiWidth = Math.floor((logicalWidth - side * 2 - kpiGap * 2) / 3);
  const topCountries = input.items.slice(0, 3);
  const normalizedWorldPercentage = Number.isFinite(input.worldPercentage)
    ? Math.max(0, Math.round(input.worldPercentage ?? 0))
    : 0;
  const travelerPoints = computeTravelerPoints(input.countriesCount, input.spotsCount);
  const currentTravelerLevel = resolveTravelerLevelByPoints(travelerPoints);
  const levelProgressLabel = `${currentTravelerLevel.level}/12`;
  const GAP_BLOCKS = 22;
  const progressTop = mapTop + mapHeight + GAP_BLOCKS;
  const progressWidth = mapWidth;
  const progressHeight = 20;
  const listTop = isToVisit ? mapTop + mapHeight + 64 : progressTop + 118;

  ctx.save();
  ctx.scale(scale, scale);

  const solidBackground = isToVisit
    ? Colors.dark.countriesPanelToVisitBackground
    : Colors.dark.countriesPanelVisitedBackground;
  ctx.fillStyle = solidBackground;
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "700 86px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(input.title, logicalWidth / 2, 154);

  const formattedFlows = new Intl.NumberFormat("es-MX").format(travelerPoints);
  const kpiLabels = ["países", "lugares", isToVisit ? "flows por obtener" : "flows"] as const;
  const kpiValues = [String(input.countriesCount), String(input.spotsCount), formattedFlows];
  ctx.textAlign = "center";
  for (let i = 0; i < 3; i += 1) {
    const x = side + i * (kpiWidth + kpiGap) + kpiWidth / 2;
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.font = "700 74px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(kpiValues[i], x, kpiTop + 68);

    ctx.fillStyle = "rgba(255,255,255,0.76)";
    ctx.font = "500 48px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(kpiLabels[i], x, kpiTop + 136);
  }

  const mapLeft = side;
  drawRoundedClip(ctx, mapLeft, mapTop, mapWidth, mapHeight, mapRadius);
  ctx.save();
  ctx.clip();
  if (mapImage) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    drawImageContain(ctx, mapImage, mapLeft, mapTop, mapWidth, mapHeight);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(mapLeft, mapTop, mapWidth, mapHeight);
  }
  ctx.restore();

  if (!isToVisit) {
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    drawRoundedClip(ctx, side, progressTop, progressWidth, progressHeight, 999);
    ctx.fill();
    ctx.fillStyle = accent;
    const progressFillWidth = (progressWidth * normalizedWorldPercentage) / 100;
    if (progressFillWidth > 0) {
      drawRoundedClip(ctx, side, progressTop, progressFillWidth, progressHeight, progressHeight / 2);
      ctx.fill();
    }
    const metaY = progressTop + 76;
    const leftX = side;
    const rightX = side + progressWidth;

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.font = "400 42px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText("Nivel:", leftX, metaY);

    const levelPrefixWidth = ctx.measureText("Nivel:").width;
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.font = "700 42px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(` ${currentTravelerLevel.label}`, leftX + levelPrefixWidth + 6, metaY);

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.font = "600 42px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(levelProgressLabel, rightX, metaY);
  }

  let listBottomY = listTop;
  if (topCountries.length > 0) {
    const listInsetX = 18;
    const listLeft = side + listInsetX;
    const listWidth = mapWidth - listInsetX * 2;
    const listHeaderHeight = 74;
    const rowHeight = 70;
    listBottomY = listTop + listHeaderHeight + topCountries.length * rowHeight;

    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = "700 46px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Top países", listLeft, listTop + 54);

    for (let i = 0; i < topCountries.length; i += 1) {
      const rowY = listTop + listHeaderHeight + i * rowHeight;
      const rank = `${i + 1}.`;
      const item = topCountries[i];

      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.font = "700 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText(rank, listLeft + 32, rowY + 50);

      ctx.fillStyle = "rgba(255,255,255,0.94)";
      ctx.font = "600 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText(truncateLabel(item.label), listLeft + 98, rowY + 50);

      ctx.fillStyle = `${accent}E6`;
      ctx.font = "700 30px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${item.count} spots`, listLeft + listWidth - 28, rowY + 50);
      ctx.textAlign = "left";
    }
  } else {
    listBottomY = listTop + 60;
  }

  const displayName = input.shareCardDisplayName?.trim() ?? "";
  const hasProfileFooter = Boolean(profileAvatarImage) || displayName.length > 0;

  if (hasProfileFooter) {
    const avatarR = 38;
    const rowCenterY = Math.min(logicalHeight - 52, listBottomY + 150);
    const avatarCx = side + avatarR + 4;
    const avatarCy = rowCenterY;
    const nameGap = 14;
    const flowyaReserve = 300;
    const nameStartX = profileAvatarImage ? avatarCx + avatarR + nameGap : side;
    const nameMaxW = Math.max(160, logicalWidth - side - flowyaReserve - nameStartX);

    if (profileAvatarImage) {
      drawImageInCircle(ctx, profileAvatarImage, avatarCx, avatarCy, avatarR);
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (displayName) {
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = "600 32px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      fillTextTruncatedLine(ctx, displayName, nameStartX, rowCenterY, nameMaxW);
      ctx.textBaseline = "alphabetic";
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.font = "700 52px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.90)";
    ctx.fillText("flowya.app", logicalWidth - side, rowCenterY);
    ctx.textBaseline = "alphabetic";
  } else {
    const brandY = Math.min(logicalHeight - 86, listBottomY + 176);
    ctx.textAlign = "center";
    ctx.font = "700 60px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.90)";
    ctx.fillText("flowya.app", logicalWidth / 2, brandY);
  }
  ctx.restore();
}

async function loadShareCountriesDrawAssets(input: ShareCountriesCardInput): Promise<{
  merged: ShareCountriesCardInput;
  mapImage: HTMLImageElement | null;
  profileAvatarImage: HTMLImageElement | null;
}> {
  const resolved = await resolveShareCardProfileForCurrentUser();
  const merged: ShareCountriesCardInput = {
    ...input,
    shareCardDisplayName: input.shareCardDisplayName ?? resolved.shareCardDisplayName,
    shareCardAvatarDataUrl: input.shareCardAvatarDataUrl ?? resolved.shareCardAvatarDataUrl,
  };
  const mapImage = merged.mapSnapshotDataUrl?.trim()
    ? await loadImageFromDataUrl(merged.mapSnapshotDataUrl)
    : null;
  const profileAvatarImage = merged.shareCardAvatarDataUrl?.trim()
    ? await loadImageFromDataUrl(merged.shareCardAvatarDataUrl)
    : null;
  return { merged, mapImage, profileAvatarImage };
}

async function downloadBlob(blob: Blob, filename: string): Promise<boolean> {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  try {
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    return true;
  } catch {
    return false;
  }
}

export async function shareCountriesCard(input: ShareCountriesCardInput): Promise<ShareCountriesCardResult> {
  if (shareCountriesPromise) return shareCountriesPromise;
  const now = Date.now();
  if (shareCountriesInFlight || now - shareCountriesLastAt < SHARE_COOLDOWN_MS) {
    return { shared: false, copied: false, downloaded: false };
  }
  shareCountriesInFlight = true;
  shareCountriesLastAt = now;

  const shareTitle = `${input.title} · Flowya`;
  const worldLine = Number.isFinite(input.worldPercentage)
    ? `\n${Math.max(0, Math.round(input.worldPercentage ?? 0))}% de 195`
    : "";
  const fallbackText = `${input.title}\n${input.countriesCount} países · ${input.spotsCount} spots${worldLine}`;

  const run = (async (): Promise<ShareCountriesCardResult> => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      const copied = await copyToClipboard(fallbackText);
      return { shared: false, copied, downloaded: false };
    }

    const canvas = document.createElement("canvas");
    canvas.width = 2400;
    canvas.height = 3000;
    const context = canvas.getContext("2d");
    if (!context) {
      const copied = await copyToClipboard(fallbackText);
      return { shared: false, copied, downloaded: false };
    }

    const { merged, mapImage, profileAvatarImage } = await loadShareCountriesDrawAssets(input);
    drawCard(context, merged, mapImage, profileAvatarImage);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((value) => resolve(value), "image/png"),
    );
    if (!blob) {
      const copied = await copyToClipboard(fallbackText);
      return { shared: false, copied, downloaded: false };
    }

    const file = new File([blob], "flowya-paises.png", { type: "image/png" });
    const canShareFile =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      (navigator.canShare?.({ files: [file] }) ?? false);

    if (canShareFile) {
      try {
        /**
         * Solo `files`: en iOS/WebKit, añadir `title` (o `text`) junto a `files` puede duplicar
         * entradas en el sheet («2 Images») en lugar de un único PNG.
         */
        await navigator.share({ files: [file] });
        return { shared: true, copied: false, downloaded: false };
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
        return { shared: true, copied: false, downloaded: false };
      } catch {
        // fallback below
      }
    }

    const downloaded = await downloadBlob(blob, "flowya-paises.png");
    if (downloaded) {
      return { shared: false, copied: false, downloaded: true };
    }

    const copied = await copyToClipboard(fallbackText);
    return { shared: false, copied, downloaded: false };
  })();

  shareCountriesPromise = run;
  try {
    return await run;
  } finally {
    setTimeout(() => {
      shareCountriesInFlight = false;
      shareCountriesPromise = null;
    }, SHARE_COOLDOWN_MS);
  }
}

const PREVIEW_DESIGN_W = 1600;
const PREVIEW_DESIGN_H = 2000;

/**
 * Genera un PNG en data URL con la misma composición que `shareCountriesCard` (vitrina DS / preview).
 * Solo web (`document` + canvas). Útil para mostrar la tarjeta sin disparar el flujo de compartir.
 */
export async function getShareCountriesCardPreviewDataUrl(
  input: ShareCountriesCardInput,
  options?: { width?: number },
): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const width = Math.min(Math.max(options?.width ?? 480, 200), 2400);
  const height = Math.round((width * PREVIEW_DESIGN_H) / PREVIEW_DESIGN_W);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const { merged, mapImage, profileAvatarImage } = await loadShareCountriesDrawAssets(input);
  drawCard(ctx, merged, mapImage, profileAvatarImage);
  return canvas.toDataURL("image/png");
}
