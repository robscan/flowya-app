/**
 * Persistencia: el usuario ocultó el panel lateral de **bienvenida Explorar** (web ≥1080, filtro Todos).
 *
 * - **Independiente del filtro de pins:** no se borra al cambiar Todos ↔ Por visitar ↔ Visitados.
 *   Al volver a Todos, el panel sigue oculto hasta que el usuario pulse «Explorar» en la pastilla.
 * - **No aplica** a la columna de **Países** (KPI): con Por visitar/Visitados el sheet de países es
 *   otro contexto; al volver a Todos solo se restaura lo guardado aquí (welcome), no el estado KPI.
 *
 * Web: lectura síncrona en primer paint; nativo: AsyncStorage en mount.
 */

import { getItemAsync, getItemSync, setItem } from "@/lib/storage/kv";

const STORAGE_KEY = "flowya_explore_welcome_sidebar_dismissed";

function parseDismissed(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed === true;
  } catch {
    return false;
  }
}

/** Lectura síncrona (web); en nativo devuelve false hasta `load…Async`. */
export function getWelcomeSidebarDismissedSync(): boolean {
  return parseDismissed(getItemSync(STORAGE_KEY));
}

export async function loadWelcomeSidebarDismissedAsync(): Promise<boolean> {
  const raw = await getItemAsync(STORAGE_KEY);
  return parseDismissed(raw);
}

export function setWelcomeSidebarDismissedPreference(dismissed: boolean): void {
  try {
    setItem(STORAGE_KEY, JSON.stringify(dismissed));
  } catch {
    // ignore
  }
}
