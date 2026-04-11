# EXPLORE_CHROME_SHELL — Chrome inferior unificado (Explorar)

**Última actualización:** 2026-04-11  
**Estado:** ACTIVE  
**Owner:** Explore vNext (`MapScreenVNext`), Design System  
**Relacionado:** [EXPLORE_SHEET.md](EXPLORE_SHEET.md), [CANONICAL_BOTTOM_SHEET.md](CANONICAL_BOTTOM_SHEET.md), [DESIGN_SYSTEM_USAGE.md](DESIGN_SYSTEM_USAGE.md)

## 1. Objetivo

Definir un **único host inferior** para el **chrome de Explorar** (entrada a búsqueda, perfil, acciones de cuenta) y, cuando aplique, el **cuerpo** tipo sheet (lista de bienvenida / recomendados). Sustituye el patrón histórico de **dos hosts mutuamente excluyentes** (banda flotante `ExploreSearchActionRow` vs `ExploreWelcomeSheet` con el mismo row embebido).

## 2. Componente canónico

- **`ExploreChromeShell`** (`components/design-system/explore-chrome-shell.tsx`): contenedor que garantiza:
  - **Zona chrome** fija al borde inferior del host (misma semántica que `ExploreSearchActionRow`).
  - **Zona cuerpo** opcional encima del chrome cuando el modo lo requiere (lista cold-start / RPC en filtro **Todos** sin selección).

- **`ExploreWelcomeSheet`** (design-system): implementación del cuerpo + gestos peek / medium / expanded + lista; puede componerse **dentro** del shell o exponerse como bloque reutilizable según el ensamblado en pantalla.

## 3. Modos de presentación

| Modo | Condición (runtime) | Chrome | Cuerpo sheet |
|------|---------------------|--------|----------------|
| **welcome** | `pinFilter === "all"`, sin spot/POI/países sheet, sin búsqueda abierta, sin overlay create | Visible | Visible (peek / medium / expanded) |
| **kpi-band** | `pinFilter === "saved" \| "visited"`, mismas exclusiones | Visible (`fullWidth` según WR-01) | No (solo fila; sin lista welcome) |

Reglas de exclusión con otras superficies: alinear con [EXPLORE_SHEET.md](EXPLORE_SHEET.md) §1.2 (Search, CountriesSheet, SpotSheet no se apilan como sheets de contexto adicional sin reglas explícitas).

## 4. Estados del cuerpo (welcome)

- `peek` | `medium` | `expanded` — misma semántica que [CANONICAL_BOTTOM_SHEET.md](CANONICAL_BOTTOM_SHEET.md) (awareness / decisión / detalle).
- Snap y gestos: `components/explorar/spot-sheet/sheet-logic.ts` (`resolveNextSheetStateFromGesture`), drag en handle/header.

## 5. Persistencia al cambiar filtros

- Al **salir** de modo welcome (p. ej. Todos → Por visitar / Visitados): guardar el último `welcomeSheetState` en una ref de pantalla.
- Al **volver** a modo welcome: restaurar el estado guardado **solo** si el usuario no abrió otra superficie que invalide el contexto (búsqueda fullscreen, Countries abierto, spot seleccionado). Si hay duda, preferir `medium` sobre `expanded` para no tapar el mapa.

## 6. Paridad web (WR-01)

- Viewport ≥ `tabletMin` (768px): host con ancho máximo `WEB_SHEET_MAX_WIDTH` (`lib/web-layout.ts`), centrado; `webSearchUsesConstrainedPanelWidth`.

## 7. Feature flag (transición)

- `EXPO_PUBLIC_FF_EXPLORE_CHROME_UNIFIED`: activa el ensamblado unificado en `MapScreenVNext`. Default recomendado en rollout: `false` hasta QA; luego `true` y retirada del camino legacy.

## 8. Mapa de implementación

| Archivo | Rol |
|---------|-----|
| `components/design-system/explore-chrome-shell.tsx` | Host unificado (cuando flag ON) |
| `components/design-system/explore-welcome-sheet.tsx` | Sheet lista bienvenida |
| `components/design-system/explore-search-action-row.tsx` | Chrome mínimo |
| `components/explorar/MapScreenVNext.tsx` | Orquestación, flags, offsets |
| `lib/explore-map-chrome-layout.ts` o `hooks/useExploreMapChromeLayout.ts` | Cálculo de offsets (altura sheet, controles, filtros) |
