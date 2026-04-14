# PLAN — OL-EXPLORE-SHEETS-CANON-001 — Canon de sheets Explore (shell + excepciones)

**Fecha:** 2026-04-14  
**Estado:** PLAN (ejecución por fases; no big-bang)  
**Ámbito:** Explore — `ExploreWelcomeSheet`, `CountriesSheet`, `SpotSheet`, Search (`SearchFloatingNative` / `SearchOverlayWeb`), layout en `lib/explore-map-chrome-layout.ts`.

## 1. Principios aceptados (no negociables)

1. **No un componente monolítico** para todo el contenido: se apunta a un **shell canónico** (gestos, snap, medición, motion, `onSheetHeightChange`, z-index) con **slots** (`header` / `body` / chrome). Cada superficie conserva su dominio.
2. **Search es excepción explícita** al modelo `peek | medium | expanded`: modelo `closed → open_full` en nativo (fullscreen equivalente en UX) y overlay full-viewport en web. Se alinean **tokens** (duración, easing, capas) con [`docs/contracts/MOTION_SHEET.md`](../../contracts/MOTION_SHEET.md) donde aplique.
3. **Web desktop sidebar (≥1080)** es presentación **panel lateral**, no bottom sheet mecánico: cualquier shell debe soportar `presentation: bottomSheet | desktopSidebarPanel` (o equivalente) sin hacks.
4. **“Flash” de Welcome en nativo** se trata como **splash intencional** durante hidratación de `pinFilter` / settle de cámara: **no eliminar** la animación; documentar criterios (reduced motion, estado estable final). Contrato previsto: [`docs/contracts/explore/NATIVE_WELCOME_SPLASH.md`](../../contracts/explore/NATIVE_WELCOME_SPLASH.md) (crear en fase doc).
5. **Contrato existente** [`docs/contracts/CANONICAL_BOTTOM_SHEET.md`](../../contracts/CANONICAL_BOTTOM_SHEET.md) sigue siendo la semántica de los tres niveles para las sheets que la implementen.

## 2. Contexto

- Matriz operativa: [`docs/contracts/EXPLORE_SHEETS_BEHAVIOR_MATRIX.md`](../../contracts/EXPLORE_SHEETS_BEHAVIOR_MATRIX.md).
- Chrome shell: [`docs/contracts/EXPLORE_CHROME_SHELL.md`](../../contracts/EXPLORE_CHROME_SHELL.md).
- Filtros / restore: [`docs/contracts/explore/FILTER_RUNTIME_RULES.md`](../../contracts/explore/FILTER_RUNTIME_RULES.md).

## 3. Fases de ejecución (orden blindado)

### Fase A — Documentación (bajo riesgo)

1. Añadir `docs/contracts/explore/NATIVE_WELCOME_SPLASH.md` y enlazarlo desde la matriz y/o `EXPLORE_CHROME_SHELL.md`.
2. En [`docs/contracts/EXPLORE_SHEET.md`](../../contracts/EXPLORE_SHEET.md) y/o [`docs/contracts/explore/SEARCH_RUNTIME_RULES.md`](../../contracts/explore/SEARCH_RUNTIME_RULES.md): párrafo explícito de **Search como excepción** (modelo de estados distinto; fullscreen equivalente nativo).

### Fase B — Spike de implementación (sin cambiar comportamiento observable)

1. Extraer utilidades compartidas (easing, duración, patrones de `GestureDetector` + snap) si reduce duplicación sin tocar anchors por superficie.
2. Diseñar API del shell tentativo `ExploreBottomSheetShell` (nombre final acordable) con slots y `presentation`.

### Fase C — Migración incremental (una sheet por PR o paso con QA)

1. `ExploreWelcomeSheet` primero (menor acoplamiento a POI/draft).
2. `CountriesSheet`.
3. `SpotSheet` al final (máxima complejidad).

### Fase D — Regression gate (definición de hecho)

- Drag solo handle/header; scroll del body no roto.
- Map pan/zoom → colapso a `peek` según contrato vigente.
- Search abre/cierra; restore de Countries/Spot según `FILTER_RUNTIME_RULES` §1c.
- Web WR-01 / sidebar sin anchos mágicos fuera de `lib/web-layout.ts`.
- Capas: solo tokens de `EXPLORE_LAYER_Z`.

## 4. Trazabilidad

- Bitácora de entrega parcial (pickers, tags, matriz): `docs/bitacora/2026/04/357-web-pickers-tags-y-matriz-sheets-followup-canon.md`.
- Loop operativo: entrada en [`docs/ops/OPEN_LOOPS.md`](../OPEN_LOOPS.md) (cola / seguimiento).
