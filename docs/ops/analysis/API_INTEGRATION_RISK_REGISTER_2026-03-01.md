# Registro de riesgos — Integración APIs de contenido (2026-03-01)

**Estado:** ACTIVO (investigación previa a implementación).  
**Alcance:** Mapbox + Overpass + Wikidata + Wikipedia/Wikimedia + capa Flowya.

---

## 1) Decisión de arquitectura (base)

Decisión:

- Separar en dos planos:
  - **Plano Runtime UX:** mapa, búsqueda y acciones inmediatas.
  - **Plano Enrichment:** jobs asíncronos para enriquecer datos.

Por qué:

- Evita bloquear UI por fallas de proveedor externo.
- Permite control de costo/rate y retries fuera de interacción del usuario.
- Aísla cambios de proveedor sin reescribir pantallas core.

Patrón recomendado:

- `ProviderAdapter` por fuente (`MapboxAdapter`, `OverpassAdapter`, `WikidataAdapter`, `WikimediaAdapter`, `WikipediaAdapter`).
- `EnrichmentOrchestrator` con estado transaccional y pasos idempotentes.
- `SnapshotStore` en DB con versionado de enrichment.

---

## 2) Matriz de riesgos por proveedor

## 2.1 Mapbox

Riesgos:

- Dependencia alta para runtime y directions.
- Costos crecientes con uso de geocoding/routing.
- Inconsistencias de naming por idioma o contexto regional.

Impacto:

- Alto (si falla, afecta UX principal).

Mitigación:

- Mantener Mapbox en tiempo real solo para casos necesarios.
- Caching agresivo de resultados repetidos.
- Fallback de UI cuando directions/geocoding no responde.

Investigación requerida:

- Definir límites de llamadas por sesión y por feature.
- Establecer política de degradación (qué se apaga primero).

---

## 2.2 OSM Overpass

Riesgos:

- Latencia, timeouts y throttling en consultas complejas.
- Calidad desigual de tags por región.
- Cambios en datos comunitarios sin control de producto.

Impacto:

- Medio/alto (afecta cobertura de POIs externos).

Mitigación:

- No usar Overpass directo desde cliente.
- Ejecutar consultas por lote en backend/job.
- Mantener cache con TTL y fallback a último snapshot válido.

Investigación requerida:

- Definir set mínimo de tags turísticos con precisión aceptable.
- Medir cobertura real en 5 ciudades de referencia.

---

## 2.3 Wikidata

Riesgos:

- Matching ambiguo entre place externo y entidad.
- Multiplicidad de entidades similares por nombre.
- Modelo semántico complejo (propiedades heterogéneas).

Impacto:

- Alto (error de entidad contamina facts e imagen).

Mitigación:

- Resolver por score compuesto: nombre + proximidad + tipo + país.
- Requerir umbral de confianza para enlace automático.
- Guardar `resolution_confidence` y `resolution_reason`.

Investigación requerida:

- Diseñar benchmark de matching con set manual etiquetado.
- Definir política para `uncertain` y `unresolved`.

---

## 2.4 Wikipedia + Wikimedia Commons

Riesgos:

- Requisitos de licencia/atribución no homogéneos.
- Contenido faltante o inconsistente por idioma.
- Texto extenso/no apto para UI sin transformación.

Impacto:

- Alto en legal/compliance y calidad percibida.

Mitigación:

- Persistir siempre: licencia, autor, URL fuente, fecha de extracción.
- No mostrar imagen externa sin metadata de atribución completa.
- Resumir texto desde facts validados, no copiar bruto.

Investigación requerida:

- Definir plantilla de atribución por tipo de asset.
- Definir política de idioma con fallback (es->en o sistema configurable).

---

## 2.5 Capa Flowya (UGC propio)

Riesgos:

- Mezcla de fuente externa con edición del usuario sin trazabilidad.
- Conflicto entre verdad del usuario y datos externos actualizados.
- Escalado de storage por galería multi-foto.

Impacto:

- Alto en experiencia y mantenimiento.

Mitigación:

- Separar campos `user_authored` de campos `externally_enriched`.
- “Última palabra” del usuario en datos visibles/editables.
- Política de quotas y optimización para imágenes propias.

Investigación requerida:

- Definir reglas de precedencia de campos en render.
- Definir lifecycle de assets de galería (retención, borrado, reemplazo).

---

## 3) Riesgos transversales de alto impacto

## 3.1 Matching y verdad de entidad

Problema:

- Un mismo nombre puede referirse a lugares distintos; un mal match genera información incorrecta.

Recomendación:

- Introducir “estado de enlace” explícito:
  - `linked` (alto score),
  - `uncertain` (requiere revisión),
  - `unresolved` (sin enlace).

No-go:

- Prohibido auto-enriquecer en `uncertain` o `unresolved`.

---

## 3.2 Licencias y atribución

Problema:

- Riesgo legal si se muestra media/texto sin atribución correcta.

Recomendación:

- Contrato de metadata obligatoria para cada asset externo:
  - `provider`, `source_url`, `license`, `author`, `attribution_text`.

No-go:

- Si falta `license` o `source_url`, el asset no se publica.

---

## 3.3 Performance/costo

Problema:

- APIs externas en runtime degradan experiencia y aumentan costo.

Recomendación:

- Runtime solo consulta fuentes críticas.
- Enrichment completo se ejecuta asíncrono con colas y cache.

No-go:

- Prohibido encadenar Mapbox+Overpass+Wikidata+Wikipedia en interacción síncrona de usuario.

---

## 3.4 Localización y consistencia

Problema:

- Nombres por idioma generan búsquedas y matching inestables.

Recomendación:

- Persistir IDs canónicos y códigos (no texto traducido como llave).
- Resolver idioma de visualización vía `locale-config`.

No-go:

- Prohibido usar strings traducidos como clave de enlace de entidad.

---

## 4) Spikes de investigación (antes de ejecutar código)

1. **Spike-R1 Matching**
- Objetivo: validar algoritmo de resolución entidad con dataset manual.
- Salida: precisión inicial + matriz de errores.

2. **Spike-R2 Licencias**
- Objetivo: definir checklist legal-operativo para Wikipedia/Wikimedia.
- Salida: contrato de atribución aplicable por asset.

3. **Spike-R3 Tags turismo Overpass**
- Objetivo: definir allowlist/denylist realista de tags.
- Salida: catálogo v1 de tags y cobertura por ciudad.

4. **Spike-R4 Cost envelope**
- Objetivo: definir presupuesto y límites por feature externa.
- Salida: umbrales de rate/costo y estrategia de degradación.

5. **Spike-R5 Observabilidad**
- Objetivo: definir eventos y dashboards del pipeline enrichment.
- Salida: esquema de métricas y alertas mínimas.

---

## 5) Gates de paso (obligatorios)

Gate A (antes de `OL-CONTENT-004`):

- Matching spec versionada + dataset validación + umbrales acordados.

Gate B (antes de `OL-CONTENT-005`):

- Contrato de licencias aprobado + fallback legal definido.

Gate C (antes de rollout):

- Métricas operativas disponibles y política de rollback lista.

---

## 6) Recomendación ejecutiva

Orden de entrega correcto:

1. Mi diario.
2. Galería.
3. Schema turismo.
4. Matching entidad.
5. Enrichment pipeline.
6. Directions.

Razón:

- Entrega valor temprano sin dependencia externa.
- Reduce riesgo acumulado antes de tocar integración multi-API.

---

## 7) Referencias internas

- `docs/ops/plans/PLAN_CONTENT_STACK_ENRICHMENT_2026-03-01.md`
- `docs/ops/plans/PLAN_POI_TOURISM_ENRICHMENT_NO_GOOGLE.md`
- `docs/ops/plans/PLAN_POI_TOURISM_DB_SUPABASE_MIGRATION.md`
- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- `docs/definitions/LOCALE_CONFIG.md`
