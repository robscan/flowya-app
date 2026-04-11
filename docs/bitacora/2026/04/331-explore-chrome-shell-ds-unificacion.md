# 331 — Explore: chrome shell DS, layout centralizado y contrato

**Fecha:** 2026-04-11  
**Tipo:** Arquitectura / Design System / contratos (OL-WEB-RESPONSIVE-001 alineado)

## Resumen

- **Contrato:** [`docs/contracts/EXPLORE_CHROME_SHELL.md`](../../contracts/EXPLORE_CHROME_SHELL.md) — host único `ExploreChromeShell`, modos welcome vs KPI, flag `EXPO_PUBLIC_FF_EXPLORE_CHROME_UNIFIED`.
- **Código:** `components/design-system/explore-welcome-sheet.tsx` (movido desde `explorar/`), `components/design-system/explore-chrome-shell.tsx`, re-export deprecado en `components/explorar/ExploreWelcomeSheet.tsx`.
- **Layout:** `lib/explore-map-chrome-layout.ts` (`computeExploreMapChromeLayout`, constantes `EXPLORE_MAP_LAYOUT`) para flags y offsets compartidos con `MapScreenVNext`.
- **Feature flag:** `featureFlags.exploreChromeUnified` (default `true`; `EXPO_PUBLIC_FF_EXPLORE_CHROME_UNIFIED=false` restaura dos bloques legacy en JSX).

## Verificación

- `npm run typecheck`
- `npm run lint`

## Referencias

- [`docs/contracts/INDEX.md`](../../contracts/INDEX.md), [`DESIGN_SYSTEM_USAGE.md`](../../contracts/DESIGN_SYSTEM_USAGE.md), [`FILTER_RUNTIME_RULES.md`](../../contracts/explore/FILTER_RUNTIME_RULES.md), inventario DS, `OPEN_LOOPS.md`.
