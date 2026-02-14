# Bitácora 089 (2026/02) — Freeze V3, delete Radix

**Fecha:** 2026-02-13  
**Objetivo:** Documentar por qué `docs/bitacora/2026/02` termina en 082 y dónde están 083–088.

---

## Contexto

Intentamos Explore V3 con Radix/shadcn (SpotSheetV3Web, SearchOverlayV3Web, SpotPeekCardV3Web). No se logró paridad con el flujo legacy. Se decide **congelar y borrar** V3.

---

## Acción

- Entradas **083–088** se movieron a `docs/_archive/bitacora/2026/02/` (análisis Phase0, SpotSheet V3, layout, gestures, restauración 3 estados, explore-v3-spotsheet-canónico).
- Código V3 eliminado: rutas exploreV3, SpotSheetV3Web, SpotPeekCardV3Web, SearchOverlayV3Web, exploreV3-types.
- Ruta exploreV3 removida de `app/_layout.tsx`.

---

## Estado actual

Explore sigue usando **MapScreenVNext + SpotSheet legacy** (Reanimated + Gesture Handler, 3 estados peek/medium/expanded). Search usa SearchOverlayWeb (full-screen overlay, keyboard-safe con 100dvh/visualViewport).

---

## Decisión

- **Radix/shadcn fuera del sprint** — Gate C PAUSADO en templates ops.
- **Dependencia removida:** `@radix-ui/react-dialog` eliminada de `package.json` (solo V3 la usaba).

---

## Nota

Si existen referencias rotas a 083–088 en otros docs, queda como **riesgo a revisar después** (no se hizo en esta sesión).
