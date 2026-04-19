type ExploreOpenCountriesIntent = {
  kind: "open_countries_sheet";
  filter: "visited" | "saved";
  view?: "summary" | "all_places";
};

const KEY = "flowya_explore_entry_intent_v1";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function markExploreOpenCountriesSheetOnce(intent: Omit<ExploreOpenCountriesIntent, "kind">) {
  if (!canUseSessionStorage()) return;
  try {
    const payload: ExploreOpenCountriesIntent = { kind: "open_countries_sheet", ...intent };
    window.sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function consumeExploreEntryIntentOnce(): ExploreOpenCountriesIntent | null {
  if (!canUseSessionStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as ExploreOpenCountriesIntent;
    if (!parsed || parsed.kind !== "open_countries_sheet") return null;
    if (parsed.filter !== "visited" && parsed.filter !== "saved") return null;
    return parsed;
  } catch {
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {}
    return null;
  }
}

