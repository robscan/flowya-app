# 195 — Map text modification guidelines + runtime alignment

Fecha: 2026-02-27
Tipo: contratos / alineación runtime

## Contexto
Se solicitó documentar consideraciones para modificar textos en mapa y evitar regresiones visuales de tipografía, gap pin-texto y conflicto de labels durante selección.

## Actualización de contratos
1. `MAP_PINS_CONTRACT`
- Se actualizaron tamaños vigentes de pin.
- Se eliminó referencia legacy a `previewPinKind`.
- Se agregó guía canónica de modificación de labels:
  - fuente de verdad,
  - tipografía por estado,
  - offset dinámico según selección,
  - halo/sombra suave,
  - checklist de validación y actualización en capa existente.

2. `MAP_RUNTIME_RULES`
- Se reemplazó regla antigua de reencuadre automático por filtro.
- Nueva regla: no mover cámara automáticamente en cambio manual de filtro (`saved/visited`).
- Se añadió regla de resolución POI->spot persistido y guardrail de no duplicidad textual en selección POI.

3. `SELECTION_DOMINANCE_RULES`
- Se refinó label policy para selección POI.
- Se actualizó smoke mínimo para validar selección `default` sin duplicidad de texto y match correcto POI->spot existente.

## Resultado
- Queda definido cómo tocar textos del mapa sin romper integración visual ni comportamiento runtime.
- Contratos y comportamiento implementado quedan alineados en una misma fuente de verdad.
