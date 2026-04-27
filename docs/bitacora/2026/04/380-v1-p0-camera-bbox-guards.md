# 380 — V1 P0 cámara/bbox guards

Fecha: 2026-04-26

## Contexto

La introspección Supabase confirmó 116 spots con `mapbox_bbox`; 18 no contienen el punto real `latitude/longitude`. Esto explica saltos de cámara entre países/ciudades en casos como Gran Parque La Pancha/Mérida y vuelve P0 la consistencia entre coordenadas, bbox persistido, sheet y mapa.

## Cambios aplicados

- Se creó `lib/places/cameraBBox.ts` como helper puro para validar bbox finito, punto finito y relación bbox↔punto.
- Se creó `lib/places/resolveCameraFraming.ts` para intentar recuperar un bbox confiable por título + proximidad cuando el bbox falta o fue rechazado.
- `applyExploreCameraForPlace()` y `placeResultFromSpotForCamera()` ahora ignoran `bbox` que no contiene el punto real; si el bbox falla, gana el `flyTo` al punto.
- Para parques/atracciones/áreas POI sin bbox confiable, la cámara usa un fallback de zoom contextual más abierto que un POI puntual.
- Creación desde POI (`MapScreenVNext`) sanea `poi.bbox` o bbox recuperado por título + proximidad antes de persistir.
- Edit Spot web limpia `mapbox_bbox`/`mapbox_feature_type` al cambiar ubicación y solo vuelve a persistir bbox si pasa validación.
- Edit Spot web también repara al presionar Guardar sin cambiar coordenadas: si el bbox actual falta o no contiene el punto, intenta resolver un bbox cercano por título + proximidad; si no hay resultado confiable, limpia el bbox para evitar saltos de país.
- Se añadieron pruebas unitarias para bbox válido, bbox contaminado, bbox grande válido de país/región y bbox malformado.
- Se corrigió un bloqueo de `typecheck` no relacionado al mapa: `WebNoTextSelect` ya no se pasa a `Text` en chips de país/etiqueta.

## Decisiones

- Para V1 no se aplica límite máximo global de span: países/regiones válidos pueden tener bbox grande y seguir siendo correctos si contienen el punto.
- No se persisten bbox sintéticos. El fallback contextual de parque/atracción solo afecta cámara runtime cuando no existe geometría confiable.
- No se limpian filas remotas todavía. La limpieza de los 18 `mapbox_bbox` incoherentes debe ser backfill no destructivo, con SQL revisado y rollback/mitigación documentada.
- No se abre Fluir ni Recordar; este parche protege map-first y no cambia diseño visual de sheets.

## Validación

- `npm run test:regression`
- `npm run typecheck`
- `npm run lint` — sin errores; quedan 29 warnings preexistentes a resolver en hardening V1.

## Pendiente

- QA manual con Gran Parque La Pancha, spots de Mérida con bbox europeo y spots de Panamá/Chiquilá detectados en introspección.
- Definir migración/backfill para poner `mapbox_bbox = null` en filas incoherentes o recalcularlo si existe fuente confiable.
- Continuar `OL-V1-STABILITY-MAP-SHEETS-MEDIA-001`: handoff Edit→Explore, pins ausentes, picker POI/fotos y refresh inmediato de galería.
