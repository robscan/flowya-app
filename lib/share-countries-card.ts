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
  worldPercentage?: number;
  accentColor?: string;
  mapSnapshotDataUrl?: string | null;
  items: CountriesCardItem[];
};

export type ShareCountriesCardResult = {
  shared: boolean;
  copied: boolean;
};

let shareCountriesInFlight = false;
let shareCountriesLastAt = 0;
let shareCountriesPromise: Promise<ShareCountriesCardResult> | null = null;

function drawRoundedClip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
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
  const scale = Math.min(width / srcW, height / srcH, 1);
  const drawW = Math.round(srcW * scale);
  const drawH = Math.round(srcH * scale);
  const dx = x + (width - drawW) / 2;
  const dy = y + (height - drawH) / 2;
  ctx.drawImage(image, dx, dy, drawW, drawH);
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
) {
  const DESIGN_WIDTH = 1600;
  const DESIGN_HEIGHT = 2000;
  const width = ctx.canvas.width;
  const scale = width / DESIGN_WIDTH;
  const logicalWidth = DESIGN_WIDTH;
  const logicalHeight = DESIGN_HEIGHT;
  const accent = input.accentColor ?? "#35D563";
  const side = 92;
  const mapTop = 242;
  const mapWidth = logicalWidth - side * 2;
  const mapHeight = 520;
  const mapRadius = 30;
  const kpiTop = mapTop + mapHeight + 150;
  const kpiCardGap = 26;
  const kpiCardWidth = Math.floor((logicalWidth - side * 2 - kpiCardGap * 2) / 3);
  const kpiCardHeight = 236;
  const topCountries = input.items.slice(0, 6);

  ctx.save();
  ctx.scale(scale, scale);

  const gradient = ctx.createLinearGradient(0, 0, 0, logicalHeight * 1.05);
  gradient.addColorStop(0, "#171D3D");
  gradient.addColorStop(0.56, "#0E1536");
  gradient.addColorStop(1, "#0A0F2A");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Subtle ambient glow to avoid a flat background while preserving contrast.
  const glow = ctx.createRadialGradient(
    logicalWidth * 0.5,
    logicalHeight * 0.45,
    40,
    logicalWidth * 0.5,
    logicalHeight * 0.45,
    logicalHeight * 0.58,
  );
  glow.addColorStop(0, "rgba(63, 86, 180, 0.20)");
  glow.addColorStop(1, "rgba(12, 18, 44, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = "700 84px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(input.title, logicalWidth / 2, 156);

  const mapLeft = side;
  drawRoundedClip(ctx, mapLeft, mapTop, mapWidth, mapHeight, mapRadius);
  ctx.save();
  ctx.clip();
  if (mapImage) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#191F3A";
    ctx.fillRect(mapLeft, mapTop, mapWidth, mapHeight);
    drawImageContain(ctx, mapImage, mapLeft, mapTop, mapWidth, mapHeight);
  } else {
    // Fallback neutro, sin generar visual alternativo confuso.
    ctx.fillStyle = "#191F3A";
    ctx.fillRect(mapLeft, mapTop, mapWidth, mapHeight);
  }
  ctx.restore();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  drawRoundedClip(ctx, mapLeft, mapTop, mapWidth, mapHeight, mapRadius);
  ctx.stroke();

  const kpiLabels = ["Del mundo", "Países", "Spots"] as const;
  const percentageValue = Number.isFinite(input.worldPercentage)
    ? `${Math.max(0, Math.round(input.worldPercentage ?? 0))}%`
    : "—";
  const kpiValues = [percentageValue, String(input.countriesCount), String(input.spotsCount)];
  for (let i = 0; i < 3; i += 1) {
    const x = side + i * (kpiCardWidth + kpiCardGap);
    drawRoundedClip(ctx, x, kpiTop, kpiCardWidth, kpiCardHeight, 26);
    ctx.fillStyle = "rgba(24, 31, 60, 0.68)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = i === 2 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.12)";
    ctx.stroke();

    if (i === 2) {
      ctx.save();
      ctx.strokeStyle = `${accent}66`;
      ctx.lineWidth = 2;
      drawRoundedClip(ctx, x, kpiTop, kpiCardWidth, kpiCardHeight, 26);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.font = "700 80px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(kpiValues[i], x + kpiCardWidth / 2, kpiTop + 106);

    ctx.fillStyle = "rgba(255,255,255,0.76)";
    ctx.font = "500 50px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(kpiLabels[i], x + kpiCardWidth / 2, kpiTop + 186);
  }

  if (topCountries.length > 0) {
    const listTop = kpiTop + kpiCardHeight + 78;
    const listLeft = side;
    const listWidth = mapWidth;
    const listHeaderHeight = 76;
    const rowHeight = 70;
    const listHeight = listHeaderHeight + topCountries.length * rowHeight + 20;

    drawRoundedClip(ctx, listLeft, listTop, listWidth, listHeight, 26);
    ctx.fillStyle = "rgba(24, 31, 60, 0.68)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = "700 46px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Top países", listLeft + 36, listTop + 52);

    for (let i = 0; i < topCountries.length; i += 1) {
      const rowY = listTop + listHeaderHeight + i * rowHeight;
      const rank = `${i + 1}.`;
      const item = topCountries[i];

      if (i > 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(listLeft + 36, rowY);
        ctx.lineTo(listLeft + listWidth - 36, rowY);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.font = "700 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText(rank, listLeft + 36, rowY + 46);

      ctx.fillStyle = "rgba(255,255,255,0.94)";
      ctx.font = "600 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText(truncateLabel(item.label), listLeft + 104, rowY + 46);

      ctx.fillStyle = `${accent}E6`;
      ctx.font = "700 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(item.count), listLeft + listWidth - 36, rowY + 46);
      ctx.textAlign = "left";
    }
  }

  ctx.textAlign = "center";
  ctx.font = "700 60px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText("FLOWYA", logicalWidth / 2, logicalHeight - 120);
  ctx.restore();
}

export async function shareCountriesCard(input: ShareCountriesCardInput): Promise<ShareCountriesCardResult> {
  if (shareCountriesPromise) return shareCountriesPromise;
  const now = Date.now();
  if (shareCountriesInFlight || now - shareCountriesLastAt < 6000) {
    return { shared: false, copied: false };
  }
  shareCountriesInFlight = true;
  shareCountriesLastAt = now;

  const shareTitle = `${input.title} · Flowya`;
  const worldLine = Number.isFinite(input.worldPercentage)
    ? `\n${Math.max(0, Math.round(input.worldPercentage ?? 0))}% del mundo`
    : "";
  const fallbackText = `${input.title}\n${input.countriesCount} países · ${input.spotsCount} spots${worldLine}`;

  const run = (async (): Promise<ShareCountriesCardResult> => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      const copied = await copyToClipboard(fallbackText);
      return { shared: false, copied };
    }

    const canvas = document.createElement("canvas");
    canvas.width = 2400;
    canvas.height = 3000;
    const context = canvas.getContext("2d");
    if (!context) {
      const copied = await copyToClipboard(fallbackText);
      return { shared: false, copied };
    }

    const mapImage = input.mapSnapshotDataUrl
      ? await loadImageFromDataUrl(input.mapSnapshotDataUrl)
      : null;

    drawCard(context, input, mapImage);

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
      (navigator.canShare?.({ files: [file] }) ?? false);

    if (canShareFile) {
      try {
        await navigator.share({
          title: shareTitle,
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
  })();

  shareCountriesPromise = run;
  try {
    return await run;
  } finally {
    setTimeout(() => {
      shareCountriesInFlight = false;
      shareCountriesPromise = null;
    }, 6000);
  }
}
