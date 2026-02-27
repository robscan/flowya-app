# 199 — F1-002 implementación de estados DS v1

Fecha: 2026-02-27  
Tipo: implementación UI / design system

## Objetivo
Aplicar la matriz de estados interactivos v1 (`OL-WOW-F1-002`) en componentes críticos del Design System.

## Cambios
- `constants/theme.ts`
  - Nuevos tokens de estado cross-platform:
    - `tintPressed`
    - `stateFocusRing`
    - `stateSurfaceHover`
    - `stateSurfacePressed`

- `components/design-system/icon-button.tsx`
  - Se incorpora `loading`.
  - Se unifica feedback visual `hover` (web) y `pressed` (web/mobile) bajo mismo lenguaje.
  - Se agrega `focus-visible` en web con ring tokenizado.
  - Se mantiene `selected` persistente con lenguaje visual de acción.

- `components/design-system/buttons.tsx`
  - `ButtonPrimary` y `ButtonSecondary` con soporte de `loading`.
  - Estados `hover/pressed/focus-visible/disabled` tokenizados.
  - Se evita hardcode nuevo de color para interacción.

- `components/design-system/search-list-card.tsx`
  - Estados `hover/pressed/focus-visible/selected/disabled`.
  - `selected` se refleja con borde/acento canónico.

- `docs/contracts/DESIGN_SYSTEM_USAGE.md`
  - Se anota estado de implementación v1 por componente.

- `docs/ops/OPEN_LOOPS.md`
  - Se agrega avance explícito de implementación para `OL-WOW-F1-002`.

## Verificación
- `npm run lint` => OK.

## Resultado
- `F1-002` pasa de matriz documental a comportamiento real en componentes críticos.
- Queda pendiente validación visual web/mobile contra checklist para cierre formal del loop.
