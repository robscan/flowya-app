# 239 — Plan bloque contenido + análisis de riesgo para integración de APIs

Fecha: 2026-03-01  
Tipo: planificación / governance / pre-implementación

## Contexto

Se definió el siguiente bloque de trabajo para continuar después de `OL-P3-002`:

- Mi diario por spot.
- Galería multi-foto por spot.
- Enriquecimiento turístico con stack externo (Mapbox, Overpass, Wikidata, Wikipedia/Wikimedia).
- Directions.

Se pidió priorizar análisis profundo de riesgos y no ejecutar código en esta etapa.

## Decisiones tomadas

1. Mantener orden secuencial `OL-CONTENT-001..006` para evitar scope bundling.
2. No abrir implementación de integración multi-API sin fase previa de research y contratos.
3. Tratar enrichment externo como proceso asíncrono, nunca como dependencia dura del runtime UX.

## Documentación creada/actualizada

- Actualizado `docs/ops/OPEN_LOOPS.md`:
  - se añade cola próxima `OL-CONTENT-001..006`;
  - se explicita relación con loops macro históricos (`OL-P1-006`, `OL-P1-007`).
- Actualizado `docs/ops/CURRENT_STATE.md`:
  - se incorpora foco real de la siguiente jornada;
  - se agregan riesgos vigentes de integración externa y mitigaciones.
- Nuevo plan operativo:
  - `docs/ops/plans/PLAN_CONTENT_STACK_ENRICHMENT_2026-03-01.md`
- Nuevo registro de riesgos:
  - `docs/ops/analysis/API_INTEGRATION_RISK_REGISTER_2026-03-01.md`

## Riesgos críticos formalizados

1. Matching incorrecto de entidad (Mapbox ↔ Wikidata).
2. Licencias/atribución incompletas en media y texto externos.
3. Costos y rate limits por integración multi-API.
4. Deriva de idioma y uso de strings no canónicos como llave de datos.
5. Acoplamiento del runtime a proveedores externos.

## Gate de ejecución acordado

- `OL-CONTENT-004` y `OL-CONTENT-005` no inician implementación sin:
  1) spec de matching con umbrales versionados;
  2) contrato de licencia/atribución aprobado;
  3) definición de observabilidad y rollback.

## Siguiente paso recomendado

Iniciar mañana por `OL-CONTENT-001` (Mi diario v1), mantener el resto del bloque en estado planificado hasta completar gates técnicos.
