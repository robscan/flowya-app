# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-03-21

> Fuente operativa diaria del alcance activo.
> Este archivo contiene solo loops activos y dependencias inmediatas.
>
> **Estado del producto:** no existe `CURRENT_STATE.md`. El contexto operativo se deduce de **este archivo** + `docs/bitacora/*` (evidencia). Retiro de snapshot paralelo: bitácora `309`.

---

## Loop activo único (regla operativa)

- **Loop ejecutivo activo (único):** **dormido** — ningún OL en ejecución hasta declaración explícita. Al abrir trabajo, elegir **uno** de la cola y mover el resto a **en espera** (sin paralelismo).
- **En espera (cola — próximo a activar uno solo):**
  1. **Auth** — social login (investigación / activación).
  2. **OL-CONTENT-002** — galería / contenido spot (plan en `plans/`).
  3. **OL-PRIVACY-001** — política de privacidad ([PLAN_OL_PRIVACY_001_2026-03-10.md](plans/PLAN_OL_PRIVACY_001_2026-03-10.md)).
  4. **`OL-EXPLORE-WEB-ZOOM-GUARD-001`** — retry (diagnosticar deploy/cache/viewport).
  5. **OL-SEARCHV2-002** — fase investigación postergada (bitácora `301`).
- **Seguimiento (abiertos pero no “en cola” de ejecución inmediata):** `OL-SEARCHV2-EMPTY-K-ANONYMITY-001` (comportamiento aceptado con pocos usuarios); ítems búsqueda **OL-URGENT-MAKI-001** / **OL-URGENT-CLUSTER-001** marcados **abordados** en bitácora.
- **Cierre de código reciente (2026-03-11):** PR #98 — lightbox en SpotSheet, ajuste de solapamiento de pin con filtro activo, plan [PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md](plans/PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md). Trazabilidad: bitácora `307`.
- **Integración reciente:** contrato SpotSheet + seguridad Supabase spots (PRs #101, #99, #100). Bitácora `308`. **Migraciones** `018_spots_block_client_hard_delete.sql` y `018_spots_owner_write_guardrails.sql`: aplicar en cada entorno remoto (`supabase db push` / pipeline del proyecto) si aún no están aplicadas.

---

## Estado general (contexto)

- Gates Fase 1 / Fase 2 / Fase 3 base y `OL-P2-006` / `OL-P1-003`: **cerrados** (histórico; bitácora `213` y anteriores).
- Trazabilidad reciente: bitácoras `307`, `308`, `309`.

---

## Riesgos macro vigentes

1. **Desalineación Recordar-lite vs diario expandido** — Mitigación: `OL-CONTENT-001` en nota breve + persistencia; sin timeline/feed complejo.
2. **Confusión gamificación V1 vs V2** — Mitigación: [docs/contracts/GAMIFICATION_TRAVELER_LEVELS.md](../contracts/GAMIFICATION_TRAVELER_LEVELS.md) (V1 runtime; V2 solo docs).
3. **UX map-first vs notas en SpotSheet** — Mitigación: validar overlays y transiciones de sheet (`peek/medium/expanded`).
4. **Deriva documental** — Mitigación: bitácora + `OPEN_LOOPS` en cada cierre de bloque (sin segundo snapshot).

---

## Proyecto: Experiencia de búsqueda (máxima prioridad estratégica)

- **OL-URGENT-MAKI-001** — Iconos Maki en listas: ResultRow y SearchResultCard usan `place.maki` / `spot.linked_maki` para mostrar icono de categoría. **Abordado** — bitácoras 302, 304. Allowlist Maki en spots-layer (mitigación DoS); revisión de seguridad PR #92 OK.
- **OL-URGENT-CLUSTER-001** — Clustering eliminado. Pins individuales únicos. Bitácora 303, 306.
- **OL-SEARCHV2-EMPTY-K-ANONYMITY-001** — Umbral k-anonymity `HAVING COUNT(*) >= 3` ya en 016; 017 redundante. Con pocos usuarios el empty-state puede no mostrar spots Flowya; comportamiento aceptado.
- **OL-SEARCHV2-002** — optimización API/costo: fase investigación **postergada** (inventario + instrumentación listos en bitácora `301`). Retomar sesiones + informe cuando sea prioritario.
- **Mejoras buscador (futuro):** lista de sugeridos, direcciones país/región/estado (geometría territorial para fit), base de datos curada (países/regiones/spots relevantes).

---

## Proyecto: Auth

- **Social login** — investigación y revisión para acelerar activación.

---

## Proyecto: Detalle de spot

- **Contenido:** descripción, fotos, galería (OL-CONTENT-002).
- **Diario y nota personal (OL-CONTENT-001)** — postergado; retomar tras cerrar experiencia de búsqueda y auth.
- **Otros ajustes** — según prioridad operativa.

---

## Cierres y postergados

- **OL-SPOTSHEET-EXPANDED-AUTH-GATE-001:** proyecto eliminado por completo. Tendencia: todo dentro de auth; por ahora anon permitido para testing. Política vigente: auth en mutaciones.
- **OL-EXPLORE-GLOBE-ENTRY-MOTION-001:** cerrado con QA en prod.
- **OL-EXPLORE-WEB-ZOOM-GUARD-001:** fallo en implementación (solución aplicada ayer no se reflejó en sitio). Agenda retry cuando sea prudente; diagnosticar deploy/cache/viewport.
- **OL-CONTENT-001:** postergado estratégicamente.
- **OL-SEARCHV2-001:** cerrado; abordado con ajustes recientes (landmarks visibles + fallback).
- **OL-SEARCHV2-EMPTY-VIEWPORT-001:** postergado (sustituido por OL-SEARCHV2-EMPTY-FLOWYA-POPULAR-001). Plan viewport/zoom descartado: preferir datos Flowya propios vs viewport sin intención de búsqueda.

---

## Loops activos / contexto

- Gamificación V1 activa en runtime: score por países + spots, niveles `X/12`, chip de flows en perfil, modal de niveles.
- V2 de gamificación: solo documentación (telemetría + calibración), sin implementación.

---

## Reglas

- 1 loop activo por vez.
- Máxima prioridad estratégica: experiencia de búsqueda.
- No abrir `OL-CONTENT-004/005` sin cerrar contratos y research previo.
- No bloquear UX principal por dependencias externas.

---

## Proyecto: Política de privacidad / consentimiento

- **OL-PRIVACY-001** — Crear política de privacidad con disclaimers necesarios: uso de geolocalización (solo cliente, sin persistencia ni envío a servidores), cookies, datos de sesión, analytics si aplica. Abordar tras búsqueda y auth. Plan: [docs/ops/plans/PLAN_OL_PRIVACY_001_2026-03-10.md](plans/PLAN_OL_PRIVACY_001_2026-03-10.md).

---

## Postergados estratégicos (no ejecutar ahora)

- `OL-METRICS-001` — Proyecto métricas y telemetría. Plan: [OL_METRICS_001_PROYECTO_METRICAS_TELEMETRIA.md](plans/OL_METRICS_001_PROYECTO_METRICAS_TELEMETRIA.md). No urgente.
- `OL-P0-002` — Create Spot canónico.
- `OL-P1-006` — Migración POI DB (maki/categorías).
- `OL-P1-007` — Pipeline turístico sin Google.
- `OL-P3-001` — Web sheets `max-width: 720px` + alineación derecha.
- `OL-EXPLORE-SEARCH-BATCH-001`, `OL-EXPLORE-TAGS-001`, `OL-I18N-UI-001` — tras cerrar búsqueda y auth.

---

## Cierres recientes (trazabilidad)

- `OL-EXPLORE-LOCALE-CONSISTENCY-001` cerrado y mergeado (PR #86). Bitácora `298`.
- `OL-SEARCHV2-EMPTY-FLOWYA-POPULAR-001` cerrado: migración 016 ejecutada, smoke OK. Bitácora `299`.
- `OL-SEARCHV2-001` cerrado: abordado con ajustes recientes (landmarks visibles + fallback). Plan OL-SEARCHV2-002 investigation-first: bitácora `300`.
- OL-SEARCHV2-002 investigación fase 1: inventario API Mapbox + instrumentación (`lib/mapbox-api-metrics.ts`): bitácora `301`.
- OL-URGENT-MAKI-001 (iconos Maki en listas ResultRow/SearchResultCard): bitácora `302`. Allowlist Maki + revisión de seguridad PR #92: bitácora `304`.
- OL-URGENT-CLUSTER-001 (clustering Mapbox pins + densidad): bitácora `303`.
- Pins por visitar/visitados: iconos Pin/CheckCircle (Lucide), tipografía clusters/chips: bitácora `305`.
- Feedback UX (distancia sin ubicación, etiqueta resultados), eliminación clustering, geoloc persiste entre sesiones: bitácora `306`. PR #97.
- SpotSheet lightbox imágenes; mitigación solapamiento pin con filtro activo; plan galería OL-CONTENT-002 guardado: bitácora `307`, PR #98.
- Contrato SpotSheet (POI/lightbox); seguridad Supabase spots (migraciones `018` — hard delete, owner writes, `hide_spot`): bitácora `308`, PRs #101, #99, #100.
- Retiro `CURRENT_STATE.md`; fuente única OPEN_LOOPS + bitácora: bitácora `309`.
- `OL-P3-002.B` cerrado y congelado; fixes `273` + `274` cerrados (Sticky Context + visibilidad labels core default en filtros activos).
- `OL-P3-002.B` hardening mini-mapa web (bloqueo zoom): bitácora `259`.
- `OL-P3-002.B` guardrails de share (snapshot/reintentos): bitácora `260`.
- `OL-P3-002.B` rediseño share card + descarga web: bitácora `261`.
- Gamificación niveles v2 (`X/12` + modal): bitácora `262`.
- Gamificación v3 (estilo barra/modal + copys): bitácora `263`.
- V2 documentada + ajuste inset horizontal mapa: bitácora `264`.
- Consolidación flows V1 (sheet/modal/share/overlay): bitácora `265`.
- Orden canónico KPI (`países -> spots -> flows`) en sheet/share + toast flows con guía mapa/buscador: bitácora `266`.
- QA fixes: toast flows simplificado + selector imagen Safari web + target nota breve ampliado + eliminación de borde mapa en share: bitácora `267`.
- Regla mapa en `Todos`: ocultar default vinculados a POI y dejar default Flowya no vinculados en azul: bitácora `268`.
- Fix de arquitectura teclado/foco en Paso 0 (owner único, blur solo en apertura): bitácora `269`.
- Ajuste visual pin default Flowya sin link (`+` y paleta base): bitácora `270`.
- Ajuste final de label default (swap relleno/sombra): bitácora `271`.
- Refactor arquitectura de capas para default no enlazado (zoom canónico sin artefactos) + contraste de contadores de filtro en light: bitácora `272`.
- Cierre definitivo de visibilidad spots core + política Sticky Context en transiciones de filtro (sin autoswitch): bitácora `273`.
- Follow-up visibilidad de labels para spots core `default` en filtros `saved/visited` (sin apagado al seleccionar): bitácora `274`.
- Search empty local sin fallback API + ajustes de Map Controls (`reframe`/world) + fallback inicial Torre Eiffel: bitácora `285`.
- Fix transversal permisos geoloc on-demand (sin prompt en carga) + guía en `denied` persistente: bitácora `286`.
- Fix transversal copy auth (guardar/marcar + enlace seguro sin contraseña): bitácora `287`.
- Fix transversal copy buscador (placeholder/entry): `países, regiones o lugares`: bitácora `288`.
- Fix runtime de búsqueda en cold-start global: tendencias de `paises/lugares` con desactivación por primera interacción: bitácora `289`.
- Fix UX de selección geográfica en búsqueda: `country/region` ahora encuadra territorio completo (`fitBounds` + fallback seguro): bitácora `290`.
- Ajuste UX/branding en Explore: slogan de entrada `SIGUE LO QUE TE MUEVE...` con fade temporal y posicionamiento bajo filtros: bitácora `291`.
- Follow-up visual de slogan en Explore: ajuste de tipografía/sombra para legibilidad sobre fondo oscuro: bitácora `292`.
- Cierre visual/copy de slogan en Explore: versión final en dos líneas `SIGUE LO QUE` / `TE MUEVE`: bitácora `293`.
- Fix técnico de `Mi ubicación` en Explore: estado programático solo cuando existe movimiento real de cámara: bitácora `294`.
- Plan de gate de activación SpotSheet (`expanded` sin auth + loader neutral): bitácora `295`.
- Avance P0 entrada globo con motion de cámara (`flyTo` world con guardrails anti-regresión): bitácora `296`.
- OL-EXPLORE-LOCALE-CONSISTENCY-001 (unificar idioma mapa/buscador/dirección): bitácora `297`.

---

## Avance de `OL-P3-002`

- `P3-002.A` completado (MVP base + locale/drilldown + reconstrucción canónica): bitácoras `236`, `237`, `238`.
- `P3-002.B` cerrado (QA/fixes consolidados; freeze de UI aplicado).

---

## Arranque activo (2026-03-21)

1. **Ops sincronizada:** reconciliación calendario vs repo (bitácora `307`); integración 2026-03-21 PRs #101 / #99 / #100 (contrato + RLS spots). Bitácora `308`. Retiro snapshot `CURRENT_STATE.md` (bitácora `309`).
2. **Loop activo:** **dormido** — elegir un solo próximo loop entre candidatos antes de implementar (ver sección superior).
3. **Smoke 306 cerrado:** validación post-merge (mapa sin clusters, distancia sin ubicación, etiqueta N resultados, geoloc persist).
4. **OL-SEARCHV2-002** — postergado; retomar sesiones + informe cuando prioritario.
5. Retry `OL-EXPLORE-WEB-ZOOM-GUARD-001` cuando sea prudente (diagnosticar fallo de despliegue/cache).
6. Mantener freeze de `OL-P3-002.B` salvo bug crítico.
7. Perfil/actividad: revisar si mejorar para registro de actividad y países/regiones/lugares más visitados — fase exploratoria.
8. Auth (social login), OL-CONTENT-002, OL-PRIVACY-001 — según prioridad estratégica (declarar uno como loop activo al abrir).
