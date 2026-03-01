# Plan operativo — Bloque contenido y enrichment (2026-03-01)

**Estado:** PLANIFICADO (no ejecutar código en esta fase).  
**Objetivo:** Definir ejecución secuencial de contenido enriquecido sin degradar UX core de Explore.

---

## 1) Alcance acordado

Stack objetivo:

1. Mapbox: mapa 3D wow + geocoding básico + directions.
2. OSM Overpass: POIs turísticos/culturales por tags y área.
3. Wikidata: clasificación semántica, IDs estables y enlaces.
4. Wikipedia + Wikimedia Commons: texto e imagen con atribución.
5. Capa Flowya: spots usuario + fotos propias + notas + estados + colecciones.

Principio rector:

- **Flowya manda en runtime UX.**  
  Proveedores externos enriquecen en segundo plano, con trazabilidad y fallback.

---

## 2) Orden de ejecución (secuencial, 1 loop activo)

## OL-CONTENT-001 — Mi diario v1

Scope:

- Retomar plan y contrato existentes para notas por spot.
- Garantizar persistencia segura (`pins.notes`, `notes_updated_at`) y entry en SpotSheet.

No-negociables:

- Sin dependencia de APIs externas.
- Sin bloquear flujo de guardar/visitar.

DoD:

- Notas persistidas y visibles por usuario autenticado.
- Entry “Mi diario/Notas” visible solo en `saved || visited`.

---

## OL-CONTENT-002 — Galería v1 (multi-foto por spot)

Scope:

- Extender modelo de una portada a colección de imágenes (`spot_images`).
- Upload ordenado, grid y fullscreen con paginación.

No-negociables:

- Mantener `cover_image_url` como fallback para compatibilidad.
- Reglas de tamaño/peso por imagen para costo/control de performance.

DoD:

- CRUD mínimo de imágenes por spot (crear/eliminar/reordenar).
- Vista de galería en SpotSheet/SpotDetail sin romper fallback actual.

---

## OL-CONTENT-003 — Tourism schema v1 (DB)

Scope:

- Migración de columnas turísticas y señales proveedor.
- Taxonomía mínima y campos de trazabilidad técnica.

No-negociables:

- Nuevos campos opcionales; no romper create/edit actuales.
- Índices mínimos para consultas por turismo/clase/fuente.

DoD:

- Migración y tipos TS alineados.
- Create-from-POI persiste señales cuando existan.

---

## OL-CONTENT-004 — Entity resolution v1 (Mapbox ↔ Wikidata)

Scope:

- Diseñar y validar algoritmo de matching con score.
- Definir umbrales `linked / uncertain / unresolved`.

No-negociables:

- Si score bajo, no enlazar automático.
- Log de decisión de matching para auditoría.

DoD:

- Contrato de matching versionado.
- Set de casos prueba con métricas de precisión inicial.

---

## OL-CONTENT-005 — Enrichment pipeline v1 (Wikidata/Wikipedia/Wikimedia)

Scope:

- Pipeline asíncrono de facts + imagen + texto corto.
- Persistencia con licencia/autor/fuente y timestamp de snapshot.

No-negociables:

- No publicar assets sin metadatos de atribución válidos.
- UX nunca depende de que enrichment termine.

DoD:

- Job de enrichment con estados claros (`pending/success/failed/skipped`).
- Fallback definido cuando no hay imagen/facts.

---

## OL-CONTENT-006 — Directions v1

Scope:

- Diseñar UX de “Cómo llegar” con control de costo.
- Arranque recomendado: handoff a app de mapas externa.

No-negociables:

- No introducir navegación in-app compleja sin validar costo/riesgo.
- No bloquear spot sheet si directions falla.

DoD:

- Flujo estable de directions desde spot.
- Métrica básica de uso y tasa de error.

---

## 3) Riesgos críticos y mitigación (resumen ejecutivo)

1. Matching entidad incorrecto.
- Mitigación: score + thresholds + fallback `unresolved`.

2. Licencias/atribución mal gestionadas.
- Mitigación: contrato estricto de metadata por asset.

3. Costos/rate limits por APIs.
- Mitigación: cache, batch jobs, retries controlados, no llamar todo en runtime.

4. Deriva de idioma y naming.
- Mitigación: persistir IDs y códigos canónicos; traducir en vista, no en storage.

5. Degradación UX por dependencias externas.
- Mitigación: enrichment asíncrono y no bloqueante.

---

## 4) Investigación obligatoria antes de implementar `OL-CONTENT-004/005`

1. Matriz de entidades ambiguas por país/idioma.
2. Política de licencia y atribución para Wikimedia/Wikipedia.
3. Estrategia de cache por proveedor y TTL por tipo de dato.
4. Política de retries y circuit breaker por API.
5. Definición de eventos de observabilidad del pipeline.

Resultado esperado:

- Documento de riesgo aprobado y contrato técnico listo antes del primer commit de implementación.

---

## 5) Referencias

- `docs/ops/plans/PLAN_SPOT_GALLERY_MI_DIARIO.md`
- `docs/ops/plans/PLAN_RECORDAR_MI_DIARIO.md`
- `docs/ops/plans/PLAN_POI_TOURISM_ENRICHMENT_NO_GOOGLE.md`
- `docs/ops/plans/PLAN_POI_TOURISM_DB_SUPABASE_MIGRATION.md`
- `docs/contracts/RECORDAR_ENTRY_SPOT_SHEET.md`
- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- `docs/definitions/LOCALE_CONFIG.md`
