# FLOWYA + ExploreMapStatusRow — Visibilidad en Explorar

**Última actualización:** 2026-04-11  
**Estado:** ACTIVE  
**Fuente de verdad del layout:** `lib/explore-map-chrome-layout.ts` → `computeExploreMapChromeLayout` → `isFlowyaFeedbackVisible`  
**Consumidor UI:** `components/design-system/explore-map-status-row.tsx` (offset inferior vía `flowyaBottomOffset`)

## Reglas vigentes

`isFlowyaFeedbackVisible` exige **todas** las condiciones siguientes:

1. **Sin overlay que bloquee el shell:** `!isShellBlockedByOverlay` (create nombre de spot o búsqueda fullscreen abierta).
2. **CountriesSheet:** si está abierto, solo FLOWYA en **`countriesSheetState === "peek"`** (en medium/expanded la fila se oculta). Misma lógica que welcome.
3. **Spot / POI:** si hay SpotSheet visible, solo FLOWYA en **`sheetState === "peek"`** (en medium/expanded la fila se oculta).
4. **Welcome (Todos):** si el sheet de bienvenida está visible, solo FLOWYA en **`welcomeSheetState === "peek"`** (en medium/expanded no se muestra).

**Offset vertical** respecto al borde superior del sheet inferior: **`FLOWYA_ABOVE_WELCOME_SHEET_GAP`** (22) tanto para **ExploreWelcomeSheet** como para **CountriesSheet** en peek (paridad KPI Por visitar / Visitados).

## Efecto en producto

| Filtro / contexto | Sheet inferior | Nivel | FLOWYA + pastilla |
|-------------------|----------------|-------|-------------------|
| Todos | Welcome | peek | Visible |
| Todos | Welcome | medium / expanded | Oculta |
| Por visitar / Visitados | Countries | peek | Visible |
| Por visitar / Visitados | Countries | medium / expanded | Oculta |
| Spot / POI | SpotSheet | peek | Visible |
| Spot / POI | SpotSheet | medium / expanded | Oculta |

## Cambios futuros

Cualquier ajuste de visibilidad u offsets debe pasar por **`computeExploreMapChromeLayout`** (y documentarse aquí + bitácora). Paridad “FLOWYA visible también en medium de welcome” implicaría decisión de layout (subir fila, menos solape con mapa); **no** asumir en v1 sin diseño.

## Referencias

- [EXPLORE_CHROME_SHELL.md](../EXPLORE_CHROME_SHELL.md) — host inferior unificado  
- [FILTER_RUNTIME_RULES.md](FILTER_RUNTIME_RULES.md) — filtros KPI  
