# CURRENT_STATE — Flowya (operativo)

> Snapshot operativo vigente.
> Esta fuente no reemplaza el cierre diario: `OPEN_LOOPS.md` + bitácora del día.

**Fecha de actualización:** 2026-03-01

---

## Estado actual

- Gate Fase 1: **CERRADO**.
- Gate Fase 2: **CERRADO** (bitácora `213`).
- Fase 3 ciclo actual: **COMPLETADO**.
- `OL-WOW-F3-001`: CERRADO (bitácora `216`).
- `OL-WOW-F3-002`: CERRADO (bitácora `218`).
- `OL-WOW-F3-003`: CERRADO (bitácora `220`).
- `OL-P2-006`: CERRADO (bitácora `232`).
- `OL-P1-003`: CERRADO (bitácoras `233` y `234`).
- `OL-P3-002`: ACTIVO (fase `P3-002.A` con MVP base implementado, bitácora `236`).
- Hardening UX teclado/foco aplicado en Explore (owner único entre Paso 0/Search/quick edit, bitácora `240`).
- Foco activo actual: países interactivo con estrategia de entrega por fases.
- Cola definida para siguiente jornada: `OL-CONTENT-001..006` (Mi diario, galería, esquema turismo, resolución de entidad, enrichment pipeline, directions).

---

## Foco inmediato real (P0 -> P2)

1. **P0 único:** cerrar `OL-P3-002` en su bloque shareable (calidad visual + estabilidad + QA manual final).
2. **P1:** arrancar `OL-CONTENT-001` (Mi diario v1), sin mezclar con integraciones externas.
3. **P2:** fase de research/gobernanza para `OL-CONTENT-004/005` antes de implementar APIs nuevas.

---

## Riesgos vigentes

1. **Reingreso a ejecución sin P0 explícito**.
   - Mitigación: no iniciar código nuevo hasta fijar loop único en `OPEN_LOOPS`.

2. **Regresión por mezclar dominios en un mismo cambio**.
   - Mitigación: 1 PR por micro-scope, sin scope bundling.

3. **Deriva documental tras múltiples cierres en el día**.
   - Mitigación: sincronía estricta entre `OPEN_LOOPS` + bitácora + planes.

4. **Acoplamiento temprano a APIs externas (Mapbox/Overpass/Wikidata/Wikipedia) sin contrato de resiliencia**.
   - Mitigación: arquitectura asíncrona de enrichment, adapter por proveedor, límites de costo/rate y fallback sin bloqueo de UX.

5. **Riesgo legal/licencias en media y texto externo (Wikimedia/Wikipedia)**.
   - Mitigación: persistir licencia/autor/fuente/URL de atribución por asset; no publicar contenido sin metadatos de atribución válidos.

6. **Riesgo de matching incorrecto de entidad (Mapbox vs Wikidata) y contenido equivocado por spot**.
   - Mitigación: score de confianza + umbral duro + estado `unresolved`; si no hay certeza, no enriquecer automáticamente.

---

## Referencias activas

- `docs/ops/OPEN_LOOPS.md`
- `docs/ops/plans/PLAN_EXPLORE_V1_STRANGLER.md`
- `docs/bitacora/2026/03/235-ol-p3-002-arranque-operativo-y-scope-fase-a.md`
- `docs/bitacora/2026/03/236-ol-p3-002-a-mvp-paises-interactivo-panel-y-busqueda.md`
- `docs/bitacora/2026/03/237-ol-p3-002-a-locale-canonicoy-drilldown-paises.md`
- `docs/bitacora/2026/03/233-ol-p1-003-system-status-bar-implementation.md`
- `docs/bitacora/2026/03/234-ol-p1-003-hardening-runtime-ux-overlays.md`
- `docs/bitacora/2026/03/240-hardening-keyboard-owner-y-quick-edit-description-search.md`
- `docs/bitacora/2026/03/241-design-system-search-cards-colores-tipografia-y-layout-canonico.md`
- `docs/bitacora/2026/03/242-filtro-dropdown-y-retardo-hasta-settle-de-camara.md`
- `docs/bitacora/2026/03/243-consolidacion-integral-ajustes-explore-search-ds-del-dia.md`
- `docs/ops/plans/PLAN_CONTENT_STACK_ENRICHMENT_2026-03-01.md`
- `docs/ops/analysis/API_INTEGRATION_RISK_REGISTER_2026-03-01.md`

## Referencias históricas (cerradas)

- `docs/ops/plans/PLAN_OL_P2_006_OPTIMIZACION_EXPLORE_2026-02-28.md`
- `docs/bitacora/2026/02/232-cierre-ol-p2-006-optimizacion-explore.md`
