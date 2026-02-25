# Plan: Search V2 → POI-first (migración segura, sin romper contratos)

**Estado:** Propuesto para discusión previa (no ejecutar aún).  
**Prioridad:** Alta (afecta descubrimiento, creación, linking, mapa).  
**Última actualización:** 2026-02-25

> Objetivo: evolucionar Search V2 desde "spots-first + places solo en no-results" a un modelo híbrido POI-first controlado, preservando todos los comportamientos críticos existentes.

---

## 1) Auditoría de comportamientos vigentes (must-preserve)

Fuente auditada: `docs/definitions/search/SEARCH_V2.md`, `docs/contracts/SEARCH_V2.md`, `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`, `docs/definitions/search/SEARCH_INTENTS_RANKING.md`, `docs/ops/OPEN_LOOPS.md`, bitácoras Search MS0..MS9.

### A. Core controller

- Debounce único (300ms), threshold 3 chars.
- Progressive search por etapas: `viewport -> expanded -> global`.
- `fetchMore` solo pagina en el mismo stage (no avanza etapa).
- Cache TTL + guardrail de carreras.

### B. UX de overlay/search sheet

- Web keyboard-safe (100dvh/visualViewport + lock body scroll).
- Un solo scroller por estado.
- Estados canónicos: empty / pre-search / search / no-results.
- Filtros de pin visibles en Search map mode.

### C. No-results chooser

- No auto-crear desde texto.
- Lista de lugares con selección explícita.
- CTA "Crear spot aquí" UGC.
- Sugerencias ES/EN deprecadas (no activas).

### D. Flujos de create/mapa

- Selección de lugar en search no-results -> flyTo + preview pin + sheet POI.
- Create spot requiere auth gate.
- No romper contrato deep-link/share/post-edit.

---

## 2) Diagnóstico de gap actual

1. `mode="spots"` solo consulta spots internos; no descubre POIs salvo en `no-results`.
2. `searchPlaces` usa Geocoding v6 forward; eso favorece `place/address/street`, no POI turístico de alta intención.
3. Ranking de intents en docs ya pide externos (`poi_landmark`, `poi`, `place`, `address`) pero implementación no está alineada end-to-end.

---

## 3) Decisión técnica recomendada

Migrar a **modelo híbrido de resultados** en Search map:

1. Sección 1: Spots internos (como hoy, con stages).
2. Sección 2: Places externos POI-first (Search Box API + retrieve).
3. Sección 3: Place/address fallback.

No sustituir de golpe: introducir por flags y comparación controlada.

---

## 4) Qué no vamos a hacer (rechazos explícitos)

1. No haremos blacklist por marcas ("no OXXO") como estrategia principal.
   - Es frágil e incompleta.
   - Se usará allowlist de categorías turísticas y downgrade de comerciales.
2. No romperemos el contrato de "selección explícita" para crear spot.
3. No activaremos dedupe destructivo ni ocultamiento agresivo sin `link_status` persistente.

---

## 5) Arquitectura objetivo (Search V2.1)

### 5.1 Motor externo

- `searchPlacesPOI` (nuevo) con Search Box API:
  - suggest -> retrieve para coords y metadatos.
  - captura `maki`, `feature_type`, categorías, place id.
- Fallback a Geocoding v6 si falla Search Box.

### 5.2 Agregador de ranking

Nuevo ranker de resultados mixtos:

1. `spot_saved/visited/recent/match`
2. `poi_landmark` (turístico/no comercial priorizado)
3. `poi` general
4. `place`
5. `address/street`

Reglas:

- Streets nunca por encima de POI/landmark si hay candidatos.
- Dedupe interno/externo por `linked_place_id` o proximidad+nombre.

### 5.3 Integración con creación y linking

- Al crear desde externo: persistir snapshot mínimo (`mapbox_place_id`, `name`, `lat/lng`, `maki`, contexto básico).
- Este dato alimenta linking posterior y visibilidad condicional.

---

## 6) Impacto esperado (mapa + datos + UX)

### 6.1 Lo que sí cambia

- Search mostrará POIs útiles antes en map mode.
- Se reduce dependencia del estado "no-results" para descubrir lugares reales.
- Mejora input para create/linking (place id + maki + tipo).

### 6.2 Lo que NO debe cambiar

- Progressive stages de spots internos.
- Contrato chooser (nunca auto-crear por texto).
- Comportamiento de sheet/deeplink/post-edit/share.
- Reglas keyboard-safe/search overlay.

---

## 7) Riesgos y mitigación

1. Coste/cupo/API behavior de Search Box.
   - Mitigar con session token, límites, fallback a Geocoding.
2. Riesgo legal/ToS sobre almacenamiento de datos externos.
   - Mitigar con snapshot mínimo y revisión explícita antes de persistencia ampliada.
3. Duplicados de resultados (spot interno + place externo).
   - Mitigar con dedupe robusto y prioridad de interno.
4. Regresión de performance en búsqueda.
   - Mitigar con throttling, cancelación y límites de resultados por sección.

---

## 8) Plan de ejecución por fases (seguro)

### Fase A — Contrato y banderas

- Definir contrato `Search V2.1` (mixto) sin tocar UI principal.
- Flags:
  - `ff_search_external_poi_results`
  - `ff_search_mixed_ranking`
  - `ff_search_external_dedupe`

### Fase B — Adapter externo

- Implementar `searchPlacesPOI` (Search Box + fallback Geocoding).
- Mapear a tipo común (`PlaceResultV2`).

### Fase C — Ranking y render por secciones

- Agregar secciones mixtas manteniendo `spots` como bloque principal.
- Aplicar ranking taxonómico de intents.

### Fase D — Integración create/linking

- Selección externa -> create con snapshot mínimo de place.
- Preparar camino para `link_status` en spots.

### Fase E — Hardening y rollout

- A/B por flag.
- Métricas de calidad:
  - % clicks en resultado útil (POI/spot),
  - % "no-results",
  - % create exitoso desde search,
  - regresiones de rendimiento.

---

## 9) Criterios de No-Go

- Aumento neto de `no-results`.
- Streets/direcciones dominan top resultados cuando existen POIs.
- Caída de éxito en create-from-search.
- Regresión visible en overlay/keyboard-safe o scroll lock web.

---

## 10) DoD / AC

- [ ] Contrato de Search V2.1 aprobado y documentado.
- [ ] Adapter Search Box con fallback funcional.
- [ ] Ranking mixto implementado y validado con casos reales.
- [ ] Dedupe interno/externo estable.
- [ ] Sin regresiones en chooser, create, deep-link, spot sheet, keyboard-safe.
- [ ] Bitácora de cierre y update de OPEN_LOOPS.

---

## 11) Documentos a actualizar al ejecutar

- `docs/definitions/search/SEARCH_V2.md`
- `docs/definitions/search/SEARCH_INTENTS_RANKING.md`
- `docs/contracts/SEARCH_V2.md`
- `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`
- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- `docs/ops/OPEN_LOOPS.md`
- `docs/bitacora/2026/02/NNN-*.md`

