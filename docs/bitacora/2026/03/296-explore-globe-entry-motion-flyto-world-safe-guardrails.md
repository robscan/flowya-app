# 296 — Explore: entrada animada del globo con flyTo a vista world (guardrails anti-regresión)

Fecha: 2026-03-06
Tipo: Implementación P0 UX/cámara (sin abrir paralelo)

## Contexto

La entrada de Explore se percibía estática en la vista inicial del globo. Se pidió introducir una animación de cámara de entrada, manteniendo estabilidad de contratos existentes de mapa/sheets/deep links.

## Cambios aplicados

- Se ajustó la cámara inicial para entrada normal de app a `GLOBE_ZOOM_INITIAL`.
- Se añadió animación de entrada programática con una sola intención de cámara:
  - `flyTo` hacia `GLOBE_ZOOM_WORLD`.
- Se agregaron guardrails para evitar regresiones:
  - no ejecutar motion si hay intención de deep link (`spotId`/`created`),
  - cancelar programación de motion en primera interacción manual de mapa,
  - no encadenar `flyTo + fitBounds` en el mismo evento de entrada.

## Evidencia (archivo)

- `components/explorar/MapScreenVNext.tsx`

## Validación mínima

- `npm run lint -- --no-cache components/explorar/MapScreenVNext.tsx`
- Resultado: OK (sin errores en este entorno).

## Riesgo residual

- Se requiere QA manual visual en web/mobile para confirmar percepción de fluidez y ausencia de conflicto con overlays (`slogan`, filtros, controles).

## Rollback

- Revertir cambios de cámara inicial y efecto de entry motion en `MapScreenVNext.tsx`.
