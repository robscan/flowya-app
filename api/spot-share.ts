import { createClient } from "@supabase/supabase-js";

import {
  buildSpotSharePreviewHtml,
  buildSpotSharePreviewNotFoundHtml,
  isSharePreviewBotUserAgent,
  type SpotSharePreviewSpot,
} from "@/lib/spot-share-preview";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

function resolveRequestOrigin(req: Request): string {
  const url = new URL(req.url);
  return url.origin.replace(/\/$/, "");
}

function htmlResponse(html: string, status: number = 200): Response {
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}

export async function GET(req: Request): Promise<Response> {
  const origin = resolveRequestOrigin(req);
  try {
    const url = new URL(req.url);
    const spotId = url.searchParams.get("id")?.trim() ?? "";
    if (!spotId) {
      return htmlResponse(buildSpotSharePreviewNotFoundHtml(origin), 400);
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error("Spot share preview API: missing Supabase config");
      return htmlResponse(buildSpotSharePreviewNotFoundHtml(origin), 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("spots")
      .select("id, title, description_short, description_long, address, cover_image_url")
      .eq("id", spotId)
      .eq("is_hidden", false)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error("Spot share preview query error:", error);
      }
      return htmlResponse(buildSpotSharePreviewNotFoundHtml(origin), 404);
    }

    const userAgent = req.headers.get("user-agent");
    const html = buildSpotSharePreviewHtml({
      spot: data as SpotSharePreviewSpot,
      origin,
      humanRedirect: !isSharePreviewBotUserAgent(userAgent),
    });

    return htmlResponse(html);
  } catch (error) {
    console.error("Spot share preview API error:", error);
    return htmlResponse(buildSpotSharePreviewNotFoundHtml(origin), 500);
  }
}
