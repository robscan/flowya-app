# 368 — Explore: fitBounds país anti-océano (heurística bbox)

## Contexto / síntoma

En el panel de países (Por visitar / Visitados), al seleccionar un país desde el listado se hace `map.fitBounds(...)` para encuadrar el país.  
En algunos países el encuadre era correcto; en otros (ej. **Costa Rica**) el viewport se iba al **océano**, mostrando un encuadre demasiado grande.

La causa típica es que algunos spots tienen `mapbox_bbox` poco fiable o “demasiado grande” (p. ej. entidades territoriales amplias, geometrías que incluyen mar, o drift de la fuente), y al unir bboxes el resultado domina el envelope.

## Decisión

Cambiar el cálculo de bounds del país para que:

- **Baseline estable**: el envelope se construye **siempre** desde los puntos (`lat/lng`) de los spots del país (con buffer).
- **BBoxes opcionales**: solo se incorporan `mapbox_bbox` si pasan una heurística anti-deriva:
  - span no absurdo (límite absoluto en grados),
  - no más grande que un múltiplo del envelope por puntos,
  - y debe “tocar” el envelope por puntos con holgura (evita bboxes no relacionadas).

Esto mantiene “país completo” cuando el bbox aporta valor, y evita casos donde un bbox “envenenado” domina el resultado.

## Implementación

- `components/explorar/MapScreenVNext.tsx`
  - `computeLngLatBoundsFromSpots(...)`: envelope por puntos + filtros para `mapbox_bbox`.

## Notas

- Si algún país queda demasiado “cerrado”, ajustar el factor máximo o el buffer de puntos antes de volver a permitir bboxes más agresivos.

