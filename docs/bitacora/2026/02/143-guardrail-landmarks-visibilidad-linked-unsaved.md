# 143 — Guardrail de landmarks para visibilidad `linked+unsaved`

Fecha: 2026-02-25

## Contexto

QA reportó regresión: al ocultar spots `linked+unsaved` se perdían landmarks base en algunos escenarios, dejando sensación de "desaparición" de lugares.

## Cambio aplicado

Se implementó guardrail defensivo para `OL-P0-004`:

1. Nuevo flag `EXPO_PUBLIC_FF_MAP_LANDMARK_LABELS` (default ON) en `lib/feature-flags.ts`.
2. `MapScreenVNext` solo permite ocultar `linked+unsaved` si:
   - `ff_hide_linked_unsaved` está ON, y
   - `ff_map_landmark_labels` está ON.
3. `useMapCore` ahora:
   - habilita landmarks con `enableLandmarkLabels` por flag,
   - no remueve el tileset de landmarks cuando landmarks están habilitados (evita apagado involuntario),
   - re-aplica landmarks en `styledata`,
   - preserva `poi-label` cuando landmarks están activos (`hideNoiseLayers(..., { preservePoiLabels: true })`).
4. `hideNoiseLayers` acepta opción `preservePoiLabels` para no apagar la señal base cuando el producto exige landmarks visibles.

## Resultado esperado

- Evitar escenarios donde se ocultan pins FLOWYA sin señal base visible.
- Mantener rollback inmediato por flags si se detecta ruido visual o warnings no aceptables.

## Estado

- Implementación técnica: completada.
- Cierre de loop: pendiente (falta QA no-go de `OL-P0-004` en matriz definida).
