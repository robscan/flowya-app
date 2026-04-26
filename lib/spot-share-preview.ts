import { getMapSpotShareUrl } from "./explore-deeplink.ts";
import { getSpotSharePreviewUrl } from "./share-spot.ts";

export type SpotSharePreviewSpot = {
  id: string;
  title: string;
  description_short: string | null;
  description_long: string | null;
  address: string | null;
  cover_image_url: string | null;
};

const SHARE_PREVIEW_BOT_RE =
  /bot|crawl|slurp|spider|facebookexternalhit|twitterbot|slackbot|whatsapp|telegrambot|linkedinbot|discordbot/i;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isSharePreviewBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return SHARE_PREVIEW_BOT_RE.test(userAgent);
}

export function resolveSpotSharePreviewDescription(spot: SpotSharePreviewSpot): string {
  const candidates = [
    spot.description_short,
    spot.description_long,
    spot.address,
    `Descubre ${spot.title} en FLOWYA.`,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeWhitespace(candidate);
    if (!normalized) continue;
    return truncateText(normalized, 180);
  }
  return "Descubre este lugar en FLOWYA.";
}

export function buildSpotSharePreviewHtml(input: {
  spot: SpotSharePreviewSpot;
  origin: string;
  humanRedirect: boolean;
}): string {
  const { spot, origin, humanRedirect } = input;
  const shareUrl = getSpotSharePreviewUrl(spot.id, origin);
  const redirectUrl = getMapSpotShareUrl(spot.id, origin);
  const pageTitle = `${normalizeWhitespace(spot.title) || "Lugar"} · FLOWYA`;
  const description = resolveSpotSharePreviewDescription(spot);
  const imageUrl = spot.cover_image_url ? normalizeWhitespace(spot.cover_image_url) : "";
  const escapedTitle = escapeHtml(pageTitle);
  const escapedDescription = escapeHtml(description);
  const escapedShareUrl = escapeHtml(shareUrl);
  const escapedRedirectUrl = escapeHtml(redirectUrl);
  const escapedHeading = escapeHtml(normalizeWhitespace(spot.title) || "Lugar");
  const escapedImageUrl = imageUrl ? escapeHtml(imageUrl) : "";
  const twitterCard = imageUrl ? "summary_large_image" : "summary";

  const imageMeta = imageUrl
    ? `
    <meta property="og:image" content="${escapedImageUrl}" />
    <meta name="twitter:image" content="${escapedImageUrl}" />`
    : "";

  const redirectScript = humanRedirect
    ? `
    <script>
      window.location.replace(${JSON.stringify(redirectUrl)});
    </script>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapedTitle}</title>
    <link rel="canonical" href="${escapedShareUrl}" />
    <meta name="description" content="${escapedDescription}" />
    <meta name="robots" content="noindex,follow" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="FLOWYA" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDescription}" />
    <meta property="og:url" content="${escapedShareUrl}" />${imageMeta}
    <meta name="twitter:card" content="${twitterCard}" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDescription}" />
    <style>
      :root {
        color-scheme: light dark;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #0f1720;
        color: #f5f7fb;
      }
      main {
        width: min(560px, calc(100vw - 32px));
        border-radius: 24px;
        padding: 28px;
        background: rgba(15, 23, 32, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 28px;
        line-height: 1.1;
      }
      p {
        margin: 0 0 18px;
        line-height: 1.5;
        color: rgba(245, 247, 251, 0.82);
      }
      a {
        color: #7dd3fc;
      }
    </style>${redirectScript}
  </head>
  <body>
    <main>
      <h1>${escapedHeading}</h1>
      <p>${escapedDescription}</p>
      <p>
        ${humanRedirect ? "Abriendo este lugar en FLOWYA…" : "Vista previa pública de FLOWYA."}
      </p>
      <a href="${escapedRedirectUrl}">Abrir en FLOWYA</a>
    </main>
  </body>
</html>`;
}

export function buildSpotSharePreviewNotFoundHtml(origin: string): string {
  const homeUrl = escapeHtml(origin.replace(/\/$/, "") || "/");
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lugar no encontrado · FLOWYA</title>
    <meta name="robots" content="noindex,nofollow" />
  </head>
  <body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:Inter,system-ui,sans-serif;background:#0f1720;color:#f5f7fb;">
    <main style="width:min(520px,calc(100vw - 32px));padding:28px;border-radius:24px;background:rgba(15,23,32,0.92);border:1px solid rgba(255,255,255,0.08);">
      <h1 style="margin:0 0 12px;">Lugar no encontrado</h1>
      <p style="margin:0 0 18px;line-height:1.5;color:rgba(245,247,251,0.82);">
        Este enlace ya no está disponible o el lugar fue retirado.
      </p>
      <a href="${homeUrl}" style="color:#7dd3fc;">Volver a FLOWYA</a>
    </main>
  </body>
</html>`;
}
