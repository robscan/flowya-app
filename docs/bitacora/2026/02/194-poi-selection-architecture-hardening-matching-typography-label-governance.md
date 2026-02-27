# 194 — POI selection architecture hardening (matching + typography + label governance)

Fecha: 2026-02-27
Tipo: runtime/ux hardening (mapa/POI/pins)

## Contexto
Persistían defectos visuales y de estado en selección POI:
- Traslape visual de pin/label en `default`.
- Inconsistencia de tipografía entre labels de selección y labels base del mapa.
- Casos donde un POI existente se trataba como POI nuevo, abriendo sheet con estado no esperado (`Por visitar` vs `Visitado`).

## Cambios estructurales
1. **Matching POI -> Spot existente (canónico)**
- Se agregó resolución de match con prioridades:
  - `linked_place_id` exacto,
  - `linked` por proximidad,
  - fallback semántico (nombre normalizado + cercanía acotada).
- Se aplica en tap de mapa y selección desde sugerencias de búsqueda.

2. **Gobernanza de labels durante selección POI**
- Con `poiTapped` activo, labels de spots Flowya se ocultan temporalmente para evitar competencia visual.
- Se preserva el contexto base del mapa y se restaura al salir de selección.

3. **Ajuste tipográfico del pin de selección**
- `MapPinSpot` alinea tamaño/color base de label con estilo Mapbox label y elimina sombra fuerte.
- Objetivo: evitar look “parchado/deprecado” y mejorar integración visual.

4. **Integración espacial del pin de preview**
- Se aplica offset vertical cuando el preview no tiene label para minimizar empalme con etiqueta del POI.

5. **Estabilidad de cámara por filtro**
- Se mantiene regla sin zoom-out automático al cambiar filtro `saved/visited` cuando no hay elementos visibles.

## Resultado esperado
- Selección POI más coherente en los 3 estados (`default/to_visit/visited`).
- Menos conflictos de jerarquía visual de texto en mapa.
- Menos falsos positivos de flujo POI nuevo cuando el spot ya existe.

## Riesgo residual
- El fallback semántico (nombre + cercanía) en zonas muy densas puede requerir afinación adicional.

## Siguiente paso
- Mini QA dirigido:
  1. POI existente en `Visitados` abre spot correcto.
  2. POI nuevo mantiene sheet POI y estado correcto.
  3. Validar integración visual de pin/label por estado y zoom.
