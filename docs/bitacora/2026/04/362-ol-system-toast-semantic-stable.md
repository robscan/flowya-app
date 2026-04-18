# 362 — OL-SYSTEM-TOAST-SEMANTIC-STABLE-001: toast semántico y ancla estable

**Fecha:** 2026-04-18  
**Rama:** `feat/ol-system-toast-semantic-stable`

## Objetivo

Cumplir QA / OL: toasts de **éxito** (verde) y **error** (rojo) usando tokens del tema; reducir percepción de «salto» del toast al estabilizar actualizaciones de ancla; documentar contrato y vitrina DS.

## Cambios

- [`components/ui/system-status-bar.tsx`](../../../../components/ui/system-status-bar.tsx):
  - `success` / `error`: fondos `Colors[state].stateSuccess` y `stateError`, texto blanco, iconos `CheckCircle2` / `AlertCircle` (decorativos, `accessibilityElementsHidden`).
  - `default`: mantiene paleta neutra invertida (`resolveToastNeutralPalette`).
  - Varios mensajes: una **fila** por mensaje con su paleta.
  - `accessibilityLiveRegion`: `assertive` si hay algún mensaje `error`, si no `polite`.
  - `setAnchor`: coalescencia vía `requestAnimationFrame` + `cancelAnimationFrame` al desmontar.
- [`docs/contracts/SYSTEM_STATUS_TOAST.md`](../../../contracts/SYSTEM_STATUS_TOAST.md): §1.1 semántica, §2.3 coalescencia, checklist §3.
- [`app/design-system.web.tsx`](../../../../app/design-system.web.tsx): sección **ds-comp-toast** (copy, botón success con `stateSuccess`).
- [`docs/ops/OPEN_LOOPS.md`](../../../ops/OPEN_LOOPS.md): ítems 1–2 cola marcados cerrados; siguiente cola = `OL-EXPLORE-FILTERS-ENTRY-LAYOUT-001`; inventario.

## Verificación

- `npm run typecheck`
