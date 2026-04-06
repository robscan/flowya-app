# 329 — Explore: sheet bienvenida, cold-start, países, toasts; DS e inventario

**Fecha:** 2026-04-05  
**Tipo:** Cierre de bloque — producto + documentación operativa

## Resumen ejecutivo

Entrega alineada de **runtime Explore** (`MapScreenVNext`, `ExploreWelcomeSheet`, `CountriesSheet`) con **Design System** (barrel, vitrina web, inventario 2026-04) y trazabilidad en **OL** / **contratos**.

## Producto (runtime)

- **Sheet inicial (`ExploreWelcomeSheet`)**: visible en **Todos / Por visitar / Visitados** cuando no hay spot/POI ni buscador; se conserva `welcomeSheetState` (peek | medium | expanded) al cambiar filtro — mismo criterio de capa que el sheet de países entre modos. Listado: Todos → cold-start + RPC/IDs; Por visitar/Visitados → spots del mapa ordenados por distancia. Título de sección parametrizable (`browseSectionTitle`).
- **Cold-start global** (`lib/search/coldStartWorldRecommendations.ts`, `useExploreColdStartFallback`): buscador vacío + fallback de bienvenida; sin anclar listas al centro por defecto del mapa hasta carga de spots; no vaciar `flowyaPopularSpots` al pausar fetch; si RPC vacío, seeds en bienvenida.
- **CountriesSheet**: persistencia por filtro (saved/visited) de apertura y tamaño; tipos compartidos `components/design-system/countries-sheet-types.ts`.
- **Toasts (actualizado 2026-04):** con sheet en `expanded` los toasts de filtro/pin **sí** se muestran; ancla al borde inferior del viewport (`SYSTEM_STATUS_TOAST.md` §2.2–2.3). Retirada la supresión por expanded (`filterChangeToastSuppressedRef`). Sigue vigente `toastMessage: ""` solo al abrir países visitados desde pastilla (evitar duplicar con el sheet) y `suppressToastRef` puntual.
- **Datos**: `lib/search/exploreWelcomeFallbackSpotIds.ts` (IDs manuales vacíos por defecto); `flowyaPopularSpots` / RPC documentados en código.

## Design System

- **Barrel** `components/design-system/index.ts`: países (KPI, lista, map preview, template, share card, traveler levels), TOC (`ds-toc-nav`), tokens (`ds-token-swatches`), showcases (SearchSurface, IconButton, ClearIconCircle, imágenes), `ExploreMapStatusRow`, `ExploreCountriesFlowsPill`, etc.
- **Vitrina web** `app/design-system.web.tsx`: taxonomía Intro → Primitivos → Componentes → Templates; anclas y demos alineadas al inventario.
- **Inventario** `docs/ops/analysis/DS_CANON_INVENTORY_2026-04.md`: matriz archivo ↔ barrel ↔ vitrina ↔ runtime; excepciones documentadas (chips en `CountriesSheet` detalle vs `TagChip`).

## Contratos y OL

- **OL-EXPLORE-COLD-START-RETIRE-001** (seguimiento): retirada futura de listas fallback cuando haya densidad UGC; criterios de salida por definir.
- **OL-WEB-RESPONSIVE-001**: loop ejecutivo vigente; avance en bitácoras 319–328 referenciadas en inventario.

## Verificación

- `npm run typecheck`
- `npm run lint` (Expo)

## Archivos de referencia

- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/ExploreWelcomeSheet.tsx`
- `components/explorar/CountriesSheet.tsx`
- `lib/search/coldStartWorldRecommendations.ts`
- `docs/ops/OPEN_LOOPS.md`
- `docs/ops/analysis/DS_CANON_INVENTORY_2026-04.md`
