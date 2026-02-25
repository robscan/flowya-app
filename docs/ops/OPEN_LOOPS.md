# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-02-25 (post-merge main `8d1ccc6`)

> Este archivo define el alcance diario del chat.
> El objetivo es **vaciar esta lista** para dar por cerrada la sesión.
> Los loops cerrados NO permanecen aquí (se registran en bitácora).

**Actualización de sesión (cierre parcial 2026-02-25 noche):**
- Search V2 quedó funcional para landmark/geo con adapter externo simplificado (`/forward` + fallback) y guardrail 429.
- Regla UX aplicada: en filtros `Por visitar/Visitados` no se muestran recomendaciones externas ni CTA crear.
- Overlay web: tap en fondo ya no cierra búsqueda.
- Filtro superior del mapa: se mantiene en dropdown (`MapPinFilter`) por decisión de sesión.
- Nuevo pendiente detectado: fallback visual de maki en mapa (se ve punto blanco homogéneo).

**Ingreso QA (2026-02-25, pendiente de cierre):**
- Regresión visual: landmarks base valiosos dejaron de verse en mapa en escenarios donde deberían persistir.
- Regla anti-duplicados está bloqueando creación desde selección POI de planificación (no debe bloquear ese flujo).
- Selección POI no guardado: no entra siempre en modo encuadre de spot con sheet y permanece visible el control "Ver todo el mundo".
- `MapPinFilter` necesita estado "pendiente de lectura" con badge y animación contextual al cambiar saved/visited desde sheet.
- Filtros sin resultados deben mostrarse deshabilitados (sin contador) y el reencuadre debe ser contextual según visibilidad de resultados.
- Solicitud de simplificación: reducir reglas custom en Search V2 + mapa cuando Mapbox ya provee comportamiento canónico.

---

## Siguiente sprint (prioridad)

| Plan | Descripción |
|------|-------------|
| [PLAN_SYSTEM_STATUS_BAR.md](plans/PLAN_SYSTEM_STATUS_BAR.md) | System Status Bar: reemplazo de toast, cola 3 mensajes, tono asistente de viaje, textos canónicos. Definición en `docs/definitions/SYSTEM_STATUS_BAR.md`. |
| [PLAN_RECORDAR_MI_DIARIO.md](plans/PLAN_RECORDAR_MI_DIARIO.md) | Mi diario (Recordar): notas personales por spot, entry desde SpotSheet (saved/visited). EP-1 a EP-3. |

---

## Prioridades (orden fijo)
1) **Cerrar temas críticos de mapa (landmarks/encuadre/visibilidad/filtros)**  
2) **Cerrar temas críticos de buscador Search V2 (POI-first + UX filtros + simplificación Mapbox-first)**  
3) **Implementar System Status Bar (reemplazo de toast)**  
4) **Resolver Create Spot: siempre desde creador mínimo** *(pospuesto temporalmente)*  
5) **Rediseñar Edit Spot** *(pospuesto temporalmente)*

## Ejecución inmediata recomendada (ordenada por riesgo)
Checklist operativo único:
- `docs/ops/plans/CHECKLIST_EXECUTION_LINKING_SEARCH_V2.md`

1) **Plan maestro 1: `PLAN_SPOT_LINKING_VISIBILITY_SAFE_ROLLOUT`**
   - Fase C completada en `main` (`ff_hide_linked_unsaved` + `ff_flowya_pin_maki_icon` + fallback runtime).
   - Ejecutar cierre de Fase D: QA/no-go formal en zonas densas/sin POI + validación de performance.
   - Objetivo: cerrar `OL-P0-004` sin regresiones de tap/sheet/performance.
2) **Plan maestro 2: `PLAN_SEARCH_V2_POI_FIRST_SAFE_MIGRATION`**
   - Ejecutar Fase A-B-C: contrato + adapter externo + ranking mixto por secciones.
   - Ejecutar Fase D-E: integración create/linking + rollout por flags y métricas.
   - Objetivo: cerrar `OL-P1-004` con POI-first real sin romper chooser.
3) **Después de ambos planes: estabilización transversal**
   - `OL-P1-005` deep link (centrado en spot, no usuario).
   - `OL-P1-001` address post-create con retry/estado de sistema.
   - `OL-P1-003` migración System Status Bar y deprecación toast.

> Decisión vigente (2026-02-25): Explore usa solo estilo **FLOWYA** (Mapbox Studio).  
> La bifurcación/toggle Standard vs FLOWYA queda deprecada/removida.

---

## Loops activos (P0 → P2)

---

### OL-P0-002 — Create Spot: **siempre** desde creador mínimo (una sola ruta)

**Estado:** ACTIVO

**Problema:** hay entrypoints inconsistentes o frágiles. Queremos 1 flujo canónico: crear mínimo (ubicación + imagen opcional) → persistir → luego editar textos.

**DoD / AC**
- Cualquier “crear” (desde no-results, desde mapa, etc.) aterriza en el mismo flujo:
  - draft placing → confirmar → creador mínimo → persist → sheet → “Editar detalles”
- No existe “crear spot” alterno que salte al editor largo directamente.
- Si hay auth gate, se aplica antes de crear draft/inserción.
- Implementado (ya ejecutado en bitácora):
  - Pin de ubicación visible y consistente durante el flujo (preview/paso 0) antes de persistir.
  - Momento de carga de imagen ajustado dentro del flujo mínimo (sin romper persistencia ni UX de confirmación).
  - Paso inicial de nombre del spot al arrancar el flujo (Paso 0) como entrada canónica.
  - Comportamiento alineado al contrato `KEYBOARD_AND_TEXT_INPUTS` (campos de texto, teclado y CTA sticky/safe).
- Pendiente para cierre del loop:
  - Ejecutar y documentar smoke final E2E del flujo canónico.
  - Definir estado final del wizard legacy `/create-spot` (desconectar/deprecar o mantener solo compatibilidad explícita).

**Pruebas mínimas**
- Smoke: no-results → crear → persist → edit
- Smoke: mapa → crear → persist → edit
- Smoke: Paso 0 nombre → preview pin visible → carga imagen → crear → sheet del spot creado.
- Smoke keyboard/CTA: foco, dismiss, CTA visible y sin superposiciones en web/native.

**Referencias**
- `docs/contracts/CREATE_SPOT_PASO_0.md`
- `docs/contracts/KEYBOARD_AND_TEXT_INPUTS.md`
- `docs/bitacora/2026/02/094-ms-create-spot-paso-0-nombre.md`
- `docs/bitacora/2026/02/103-ms-b-pin-paso-0.md`
- `docs/bitacora/2026/02/112-preview-pin-sugerencia-busqueda-poi.md`
- `docs/bitacora/2026/02/099-map-overlays-search-entry-flowya-keyboard.md`

---

### OL-P0-003 — Create Spot se activa por error con pinch/zoom (dos dedos)

**Estado:** CERRADO (2026-02-14, bitácora 102)

**Problema:** al navegar con dos dedos / hacer zoom, se dispara “crear spot” accidentalmente.

**DoD / AC**
- Gestos de mapa (pan/zoom/pinch) **no** disparan create.
- Create solo se dispara por intent explícito (botón / long-press / chooser definido).
- Añadir guardrail: ignorar “press” cuando hubo multi-touch o gesture in-progress.

**Plan de ejecución:** `docs/ops/plans/PLAN_EXPLORE_AJUSTES_MAP_SEARCH.md` (MS-A).

**Pruebas mínimas**
- Smoke en móvil: 10 intentos de pinch/zoom sin activar create
- Unit (si aplica): detector multi-touch → cancela intent

---

### OL-P1-001 — Dirección postal no se genera en creación mínima

**Estado:** ACTIVO

**Problema:** al crear un spot con el creador mínimo, la dirección/postal no se completa.

**DoD / AC**
- Tras persistir spot mínimo, se ejecuta enriquecimiento (reverse geocode / Mapbox place) y se guarda address.
- UI refleja address cuando disponible (con loading si es async).
- Si falla, queda estado de error recuperable (retry) sin romper flujo.

**Pruebas mínimas**
- Smoke: crear spot mínimo en 2 ubicaciones distintas → address aparece
- Unit: efecto de enrichment maneja error/retry

---

### OL-P1-002 — Botón “cerrar buscador” en estado activo

**Estado:** ACTIVO

**Problema:** cuando Search está activo/abierto, el botón de cerrar no respeta estados (disabled/priority/click area).

**DoD / AC**
- Cerrar siempre disponible cuando status=open.
- No compite con focus del input ni rompe el layout.
- Hit area consistente.

**Pruebas mínimas**
- Smoke: abrir search → cerrar (sin pérdida de estado de Explore indebida)

---

### OL-P1-003 — System Status Bar no implementado (toast sigue activo)

**Estado:** ACTIVO

**Problema:** Existe definición + contrato + plan, pero la app sigue usando `ToastProvider` / `useToast` y no `SystemStatusBar` / `useSystemStatus`.

**DoD / AC**
- Crear `SystemStatusBar` y `useSystemStatus` según `docs/definitions/SYSTEM_STATUS_BAR.md` y `docs/contracts/SYSTEM_STATUS_BAR.md`.
- Reemplazar `ToastProvider` en `app/_layout.tsx`.
- Migrar call sites de `toast.show` a `useSystemStatus().show`.
- Marcar toast legacy como deprecated en guardrails.

**Pruebas mínimas**
- Smoke: mensajes success/error/default aparecen en la franja superior con auto-hide.
- Smoke: no quedan call sites activos de `useToast` en rutas principales.

**Referencias**
- `docs/ops/plans/PLAN_SYSTEM_STATUS_BAR.md`
- `docs/definitions/SYSTEM_STATUS_BAR.md`
- `docs/contracts/SYSTEM_STATUS_BAR.md`

---

### OL-P1-004 — Search no-results: MS-E POIs aún pendiente

**Estado:** ACTIVO (FUNCIONAL CERRADO PARCIAL; pendiente hardening visual final)

**Problema:** En sin-resultados, el flujo sigue dependiendo de Geocoding/paths actuales; el plan MS-E (POIs con Search Box/fallback) no está cerrado.

**DoD / AC**
- Implementar `searchPlacesPOI` (o equivalente) con fallback a Geocoding.
- Usar POIs en sin-resultados cuando estén disponibles.
- Documentar cierre con bitácora y actualizar contrato `SEARCH_NO_RESULTS_CREATE_CHOOSER`.

**Pruebas mínimas**
- Smoke: queries tipo “Fundació Joan Miró”, “Montjuïc” devuelven POIs relevantes.
- Smoke: sin regresión en create spot desde búsqueda.

**Referencias**
- `docs/ops/plans/PLAN_EXPLORE_AJUSTES_MAP_SEARCH.md` (MS-E)
- `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`
- `docs/bitacora/2026/02/134-search-v2-track-b-fase-a-b-flags-adapter-poi.md`
- `docs/bitacora/2026/02/135-search-v2-fase-c-secciones-mixtas-y-dedupe.md`
- `docs/bitacora/2026/02/136-search-v2-fase-c-ranking-intents-y-fase-d-alineacion-create-linking.md`
- `docs/bitacora/2026/02/137-search-v2-fase-e-rollout-metricas-runtime-y-nogo.md`
- `docs/bitacora/2026/02/138-search-v2-intents-precedence-landmark-geo-y-sync-docs.md`
- `docs/bitacora/2026/02/141-search-v2-simplificacion-forward-single-request-y-guardrail-429.md`

**Avance ejecutado (2026-02-25):**
- Ranking taxonómico aplicado en sugerencias externas (`poi_landmark > poi > place > address`) cuando `ff_search_mixed_ranking` está ON.
- Create-from-search alineado con linking: `linked_place_kind` se infiere por intent y `linked_place_id` solo se persiste cuando el id externo es estable (no sintético).
- Hardening Fase E parcial: métricas runtime expuestas en `globalThis.__flowyaSearchMetrics` para medir CTR útil, no-results, create-from-search y latencia/error de fetch externo.
- Rollout definido por etapas de flags: adapter -> dedupe -> ranking mixto.
- Precedencia de intents alineada a UX real: `landmark > geo > recommendation` (fix para queries de monumento como "Torre Eiffel").
- Adapter externo simplificado: Search Box `/forward` como request principal (single request) + fallback Geocoding y cooldown ante 429.
- Regla de filtros de usuario aplicada en Search UI:
  - `Todos`: puede mostrar recomendaciones externas + CTA crear.
  - `Por visitar/Visitados`: solo resultados del grupo; sin recomendaciones externas ni crear.
- Guardrail QA aplicado: al cambiar filtro en Search V2 con query activa, se fuerza refresh de resultados para evitar mezcla cross-filter (`Visitados` mostrando `Por visitar`).
- UI QA aplicado: badge de estado en cards usa fondo por estado (`stateToVisit/stateSuccess`) con icono blanco.
- Ajuste QA `Todos`: Search V2 prioriza `guardados/visitados` antes de `creados` y promueve stage (`viewport->expanded->global`) cuando una etapa trae solo creados para no ocultar guardados relevantes.
- Referencia: `docs/bitacora/2026/02/151-search-v2-todos-prioriza-guardados-antes-creados.md`.
- Ajuste QA adicional: en `Todos`, si existen visitados en pool y la etapa actual no devuelve ninguno, Search V2 promueve etapa para incluirlos; títulos por filtro fijados (`Visitados = Cerca de aquí`, `Por visitar = En esta zona`).
- Referencia: `docs/bitacora/2026/02/152-search-v2-todos-incluye-visitados-y-titulos-por-filtro.md`.
- Ajuste UX mapa/search: alternancia `saved <-> visited` fuerza reencuadre al conjunto destino (ciclo estable); se conserva reencuadre condicional cuando no hay pines visibles por filtro.
- Referencia: `docs/bitacora/2026/02/153-filtros-saved-visited-reencuadre-ciclico.md`.
- Ajuste UX Search filtros: resultados separados por secciones (`Spots cercanos` en viewport actual + `En todo el mapa` fuera de viewport) para `Por visitar/Visitados`.
- Referencia: `docs/bitacora/2026/02/154-search-filtros-secciones-cercanos-vs-mapa.md`.
- Ajuste copy Search: placeholder unificado a `Buscar spots` (web/native/default input).
- Referencia: `docs/bitacora/2026/02/155-search-placeholder-buscar-spots.md`.
- Hardening Search filtros: en `saved/visited` se consolida etapa global para habilitar secciones `Spots cercanos` y `En todo el mapa` de forma consistente.
- Referencia: `docs/bitacora/2026/02/156-search-filtros-consolidan-global-para-subdivision.md`.
- Simplificación UX aplicada: en filtros `Por visitar/Visitados` se ocultan títulos de resultados y se mantiene orden por distancia.
- Referencia: `docs/bitacora/2026/02/157-search-filtros-sin-titulos-de-resultados.md`.
- Ajuste de ranking por viewport: al navegar mapa (`moveend`) con búsqueda activa, se refrescan resultados según bbox actual; stage global ordena por centro de viewport vigente.
- Referencia: `docs/bitacora/2026/02/158-search-reorden-por-viewport-al-navegar-mapa.md`.
- Scope fix: reorden por viewport queda activo solo para filtros `Por visitar/Visitados`; en `Todos` se mantiene ranking previo.
- Referencia: `docs/bitacora/2026/02/159-search-viewport-reorder-solo-filtros-saved-visited.md`.
- Hardening de render Search: orden/segmentación se aplica sobre el arreglo final pintado (`resultsOverride`) para asegurar impacto visible en UI.
- Referencia: `docs/bitacora/2026/02/160-search-results-override-render-list-correcta.md`.
- Fix QA: empty state en filtros `Por visitar/Visitados` deja de entrar en loop (guard por `viewportNonce` para evitar refresh repetido).
- Referencia: `docs/bitacora/2026/02/162-search-empty-state-loop-filtros-fixed.md`.
- Fix render: reorden por viewport en filtros `Por visitar/Visitados` recalcula sobre `viewportNonce` en la capa de listado visible.
- Referencia: `docs/bitacora/2026/02/163-search-reorder-viewportnonce-render-fix.md`.
- Simplificación UX adicional: resultados de Search se muestran sin títulos de etapa/sección para evitar ambigüedad visual.
- Referencia: `docs/bitacora/2026/02/164-search-resultados-sin-titulos-global.md`.
- Paridad de ruta legacy: se remueve también `stageLabel` en `MapScreenV0` para evitar discrepancias entre objetos de render.
- Referencia: `docs/bitacora/2026/02/165-search-remove-titles-v0-parity.md`.
- Fix adicional por evidencia QA: en query vacía + filtros `Por visitar/Visitados` se oculta header `Spots cercanos`.
- Referencia: `docs/bitacora/2026/02/166-search-empty-query-hide-spots-cercanos-in-filters.md`.
- Revisión posterior acordada: ejecutar protocolo de diagnóstico de caché para validar discrepancias visuales antes de abrir bug runtime.
- Referencia: `docs/ops/analysis/SEARCH_UI_CACHE_POST_REVIEW.md`.

**Pendiente para cierre definitivo del loop:**
- Ajustar representación visual final de fallback maki (sin `+`, pero evitar punto blanco uniforme).

---

### OL-P1-008 — Fallback visual de iconos maki (sprites faltantes)

**Estado:** ACTIVO

**Problema:** cuando el sprite del estilo no contiene ciertos `maki` (ej. `beach-11`), el fallback runtime evita crash/error pero actualmente se percibe como punto blanco idéntico para muchos casos, degradando legibilidad y calidad visual.

**DoD / AC**
- Definir set visual canónico para fallback de íconos maki ausentes.
- Mantener cero errores funcionales por `styleimagemissing`.
- Evitar símbolo confuso/repetitivo en todos los pins.
- No romper rendimiento del mapa ni interacción pin->sheet.

**Pruebas mínimas**
- Smoke: zonas con múltiples categorías (`beach`, `museum`, `park`, etc.) sin warnings recurrentes críticos.
- Smoke visual: fallback distinguible y consistente sobre pines `to_visit/visited`.
- Smoke funcional: tap en pin sigue abriendo sheet correcto.

**Referencias**
- `lib/map-core/style-image-fallback.ts`
- `lib/map-core/spots-layer.ts`
- `docs/bitacora/2026/02/142-search-v2-cierre-parcial-filtros-y-pendiente-fallback-maki-visual.md`

---

### OL-P1-005 — Bug share deep link: spot correcto, mapa centrado en usuario

**Estado:** ACTIVO

**Problema:** Al abrir URL compartida (`spotId` + `sheet=medium`), se selecciona y muestra correctamente el spot compartido, pero el mapa queda centrado en la ubicación del usuario en lugar de encuadrar el spot del deep link.

**DoD / AC**
- En entrada por share deep link, el mapa debe encuadrar el spot compartido usando coordenadas frescas (DB) antes o junto con apertura de sheet.
- `sheet=medium` se respeta (no degradar a otro estado ni perder selección).
- No debe ejecutarse `tryCenterOnUser`/recentrado en usuario cuando existe `spotId` en URL.
- Mantener comportamiento correcto para post-edit (`sheet=extended`) sin regresiones.

**Pruebas mínimas**
- Smoke: abrir link compartido (`sheet=medium`) con sesión y sin sesión → mapa encuadra spot compartido.
- Smoke: post-edit (`sheet=extended`) sigue encuadrando spot editado (no usuario).
- Smoke: sin `spotId` en URL, flujo normal puede centrar en usuario.

**Avance 2026-02-25 (fix técnico aplicado):**
- Se agrega guard dinámico para `tryCenterOnUser` y lock de deep link para bloquear auto-center tardío al usuario.
- Intake de deep link (`spotId` y `created`) ahora encola/ejecuta foco explícito en coordenadas del spot compartido.
- Si `mapInstance` aún no está listo, el foco queda pendiente y se aplica al montar mapa.
- Referencia: `docs/bitacora/2026/02/161-deeplink-share-prioriza-encuadre-spot-vs-user-center.md`.

**Referencias**
- `docs/contracts/DEEP_LINK_SPOT.md`
- `docs/bitacora/2026/02/090-explore-deep-link-post-edit-share.md`
- `docs/bitacora/2026/02/118-zoom-canonico-y-post-edit-spot-location.md`

---

### OL-P1-006 — Integrar datos POI turístico en DB + migración Supabase (maki/categorías)

**Estado:** ACTIVO (PARCIAL: base de linking ya aplicada)

**Problema:** Actualmente no está cerrada la integración canónica de señales de POI turístico (incluyendo `maki` y categorías) en el modelo de datos; sin esto no hay base sólida para filtros/ranking turístico y trazabilidad.

**DoD / AC**
- Definir y aplicar migración Supabase con columnas de POI turístico en `spots` (retrocompatible).
- Persistir desde create-from-POI: source/source_id, `maki`, categorías y clase/flag turística cuando exista data.
- Actualizar tipos/mappers de app para los nuevos campos.
- Ejecutar/planificar backfill mínimo para spots existentes con señales suficientes.
- Actualizar contratos (`MAPBOX_PLACE_ENRICHMENT`, `DATA_MODEL_CURRENT`) y registrar bitácora.

**Pruebas mínimas**
- Smoke: crear spot desde POI y verificar persistencia de campos turísticos.
- Smoke: spot sin señales turísticas sigue creando sin error (fallback seguro).
- Validación de migración: sin regresión en lectura/escritura de spots actuales.

**Avance ejecutado (2026-02-25):**
- `spots.link_*` en producción (`link_status`, `linked_place_id`, `linked_place_kind`, `linked_maki`, `linked_at`, `link_version`, `link_score`).
- Create-from-POI/Search persiste `link_*` al insertar (nace `linked` cuando hay `placeId`).
- Edit Spot (con flag) reevalúa y persiste `link_*` al guardar ubicación.

**Referencias**
- `docs/ops/plans/PLAN_POI_TOURISM_DB_SUPABASE_MIGRATION.md`
- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- `docs/contracts/DATA_MODEL_CURRENT.md`

---

### OL-P1-007 — Ejecutar pipeline turístico sin Google (Wikimedia/Wikidata + textos IA)

**Estado:** ACTIVO (planificado, no ejecutar ahora)

**Problema:** Se requiere enriquecer POIs turísticos con foto real y textos útiles sin dependencia de Google; hoy no existe pipeline cerrado de selección turística + media/licencia + redacción con trazabilidad.

**DoD / AC**
- Implementar filtro turístico/no-privado (allowlist/denylist) antes de enriquecer.
- Integrar imagen real desde Wikimedia/Wikidata con licencia y atribución guardadas.
- Generar `description_short` y texto “por qué importa” desde facts (IA restringida por fuente factual).
- Definir fallback cuando no haya imagen/facts (sin romper UX).
- Actualizar contratos/documentación del pipeline y registrar bitácora.

**Pruebas mínimas**
- Smoke: POIs turísticos (ej. monumento/parque/museo) resuelven imagen + texto cuando hay data.
- Smoke: POI sin imagen en Wikimedia usa fallback controlado.
- Smoke: negocio privado queda fuera del pipeline turístico.

**Referencias**
- `docs/ops/plans/PLAN_POI_TOURISM_ENRICHMENT_NO_GOOGLE.md`
- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`

---

### OL-P0-004 — Visibilidad de spots según enlace POI/Landmark (linked/unlinked)

**Estado:** ACTIVO (Fase C completada; pendiente cierre QA/no-go de Fase D)

**Problema:** Con mayor cobertura de POIs/Landmarks, los spots sin estado (`saved=false`, `visited=false`) generan ruido visual cuando ya existe señal de basemap para ese lugar.

**Decisión de trabajo (en evaluación guiada):**
- Si un spot está **enlazado** a POI/Landmark y no está en `Por visitar` ni `Visitado`, ocultar pin FLOWYA y dejar visible señal base.
- Si un spot está **no enlazado** (zona sin POI), mantener visual FLOWYA aunque no tenga estado.
- Evitar borrado destructivo de spots existentes en esta fase.

**DoD / AC**
- Modelo de enlace definido (`linked`, `unlinked`, `uncertain`) con score y trazabilidad.
- Regla de render implementada detrás de feature flag, sin regresión en tap→sheet.
- Backfill no destructivo para spots existentes con reporte de calidad.
- Documentación actualizada: contrato de datos/mapa + bitácora de implementación.

**Riesgos clave a mitigar**
- Falsos positivos de enlace por densidad urbana/nombres repetidos.
- Dependencia de IDs/capas del estilo Mapbox (inestabilidad entre estilos).
- Riesgo de ocultar spots por clasificación ambigua (`uncertain` no debe ocultarse automáticamente).

**Referencias**
- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- `docs/contracts/DATA_MODEL_CURRENT.md`
- `docs/ops/plans/PLAN_POI_TOURISM_DB_SUPABASE_MIGRATION.md`
- `docs/bitacora/2026/02/121-poi-landmark-visual-state-and-retry-toasts.md`
- `docs/ops/plans/PLAN_SPOT_LINKING_VISIBILITY_SAFE_ROLLOUT.md`
- `docs/bitacora/2026/02/122-phase-a-spot-linking-schema-scaffold.md`

**Avance 2026-02-25 (Phase A iniciado):**
- Migración `spots.link_*` creada (`015_spots_linking_fields.sql`).
- Scaffolding de resolver + feature flags agregado (default OFF).
- Hook pasivo en Edit Spot web para persistir `link_*` solo con `ff_link_on_edit_save=true`.

**Avance 2026-02-25 (Phase B iniciado):**
- `resolveSpotLink` implementado con scoring real (nombre + distancia) y umbrales `linked/uncertain/unlinked`.
- Integración mantiene guardrail de flag (`ff_link_on_edit_save`), sin activar reglas visuales de hide en esta fase.
- Bitácora de fase B: `docs/bitacora/2026/02/124-phase-b-resolver-scoring-linking.md`.

**Avance 2026-02-25 (Phase C iniciado):**
- calibración de thresholds del resolver (más conservador para reducir falsos positivos).
- detección de ambigüedad top-1 vs top-2 para forzar `uncertain`.
- telemetría local de calidad de resolución (`linked/uncertain/unlinked`, errores, razón).
- Bitácora de fase C: `docs/bitacora/2026/02/125-phase-c-thresholds-metrics-calibration.md`.

**Avance 2026-02-25 (post-Phase C, merge a main):**
- Tap POI prioriza match por `linked_place_id`; fallback por proximidad solo para spots `linked`.
- Create-from-POI/Search persiste `link_*` en insert para que el tap linked funcione desde creación.
- Mitigación runtime para landmark labels/config y reducción de ruido de consola.
- Ocultamiento `linked+unsaved` y maki sprite con fallback (`marker-15`) activo detrás de flags.
- Guardrail anti-desaparición: no ocultar `linked+unsaved` si `linked_place_id` no está presente.
- Bitácoras: `126`, `127`, `128`, `129`, `130`, `131`, `132`, `133`.

**Avance 2026-02-25 (hardening QA landmarks visibilidad):**
- Se agrega guardrail adicional: ocultamiento `linked+unsaved` solo permitido cuando landmarks base están habilitados (`ff_map_landmark_labels` + `ff_hide_linked_unsaved`).
- `useMapCore` preserva `poi-label` cuando landmarks están activos y reaplica config en `styledata` para reducir drift visual de estilo.
- Referencia: `docs/bitacora/2026/02/143-guardrail-landmarks-visibilidad-linked-unsaved.md`.

**Pendiente para cierre OL-P0-004:**
- QA formal de no-go (matriz completa): densidad urbana, zonas sin POI, zoom alto/medio/bajo, light/dark.
- Criterio cuantitativo: `uncertain <= 15%` en muestra QA.
- Evidencia de performance/tap->sheet sin regresión con flags ON.
- Landmarks base prioritarios visibles de forma consistente (sin perder puntos turísticos relevantes por estilo/capa).

---

### OL-P1-009 — Anti-duplicado no bloqueante en selección POI de planificación

**Estado:** ACTIVO (nuevo QA 2026-02-25)

**Problema:** En selección explícita de POI externo (search/preview), el usuario está en modo planificación y no percibe que esté "creando manualmente". El guardrail anti-duplicado actual bloquea inserción y rompe expectativa.

**DoD / AC**
- En flujos `create-from-POI`/`create-from-search` la validación de duplicado no bloquea inserción.
- No mostrar modal "spot muy parecido" en selección POI explícita.
- Guardrail anti-duplicado bloqueante se mantiene para creación manual/draft libre.
- Contratos alineados: `ANTI_DUPLICATE_SPOT_RULES` y chooser/search.

**Pruebas mínimas**
- Smoke: seleccionar POI externo con spots similares existentes -> crea spot sin bloqueo.
- Smoke: crear spot manual/draft similar -> mantiene bloqueo/modal anti-duplicado.

**Avance 2026-02-25 (implementación técnica):**
- `handleCreateSpotFromPoi` y `handleCreateSpotFromPoiAndShare` dejan de bloquear creación por `checkDuplicateSpot`.
- Se mantiene bloqueo anti-duplicado en creación manual/draft (`handleCreateSpotFromDraft`).
- Referencia: `docs/bitacora/2026/02/145-poi-create-sin-bloqueo-anti-duplicado.md`.

**Referencias**
- `docs/contracts/ANTI_DUPLICATE_SPOT_RULES.md`
- `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`
- `docs/contracts/SEARCH_V2.md`

---

### OL-P1-010 — Selección POI: encuadre con sheet y gobernanza del control "Ver todo el mundo"

**Estado:** ACTIVO (nuevo QA 2026-02-25)

**Problema:** Al seleccionar un POI no existente en Flowya, en algunos casos no se aplica el modo de encuadre de spot con sheet desplegada y continúa visible el control "Ver todo el mundo".

**DoD / AC**
- Selección POI (guardado o no guardado) activa encuadre de spot y sheet en estado canónico.
- Cuando hay spot/POI seleccionado con sheet activa, ocultar o despriorizar "Ver todo el mundo" según contrato de overlays.
- Sin regresión en selección de spot interno ni en deep-link.

**Pruebas mínimas**
- Smoke: POI nuevo desde search -> flyTo/encuadre + sheet medium + sin "Ver todo el mundo" competitivo.
- Smoke: spot interno existente -> comportamiento actual se mantiene.

**Avance 2026-02-25 (implementación técnica):**
- `MapControls` pasa a usar selección contextual (spot real o POI activo) para gobernar controles.
- Con `poiTapped` activo, se oculta "Ver todo el mundo" y se habilita encuadre contextual.
- Se agregan handlers de reencuadre para POI (simple y POI+usuario con `fitBounds`).
- Referencia: `docs/bitacora/2026/02/144-poi-selection-encuadre-contextual-y-control-world.md`.

**Referencias**
- `docs/contracts/SPOT_SELECTION_SHEET_SIZING.md`
- `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`
- `docs/contracts/MAP_PINS_CONTRACT.md`

---

### OL-P1-011 — MapPinFilter: badge de pendiente + animación contextual + vacíos de filtro

**Estado:** ACTIVO (nuevo QA 2026-02-25)

**Problema:** Falta semántica de estado para cambios de `Por visitar/Visitados` desde sheet y no está cerrada la UX de filtros vacíos/reencuadre.

**DoD / AC**
- Si usuario está en `Todos` y desde sheet cambia a `Por visitar/Visitados`, mostrar badge pequeño "pendiente de lectura" en el dropdown.
- El badge migra al filtro destino al abrir dropdown y se limpia al seleccionar ese filtro.
- Si usuario ya está en el mismo filtro (`Por visitar` o `Visitados`) y repite acción desde sheet: animación de confirmación, sin badge.
- Opciones de filtro sin resultados se muestran deshabilitadas y sin contador.
- Si el filtro activo queda sin resultados visibles en viewport, reencuadrar a resultados del filtro en el mundo.
- Si el filtro activo sí tiene resultados visibles, mantener cámara actual (sin jump).

**Pruebas mínimas**
- Smoke: mutaciones desde sheet en `Todos` -> badge aparece/migra/limpia.
- Smoke: mutaciones desde sheet dentro del mismo filtro -> solo animación confirmatoria.
- Smoke: filtro sin resultados -> deshabilitado, sin número.
- Smoke: cambio de filtro con 0 visibles en viewport -> reencuadre; con visibles -> sin reencuadre.

**Avance 2026-02-25 (implementación técnica):**
- `MapPinFilter` agrega `pendingValue` (punto rojo) y `pulseNonce` (animación contextual sin cambio de valor).
- Filtros `Por visitar/Visitados` se deshabilitan cuando count=0 y no muestran número en cero.
- `MapScreenVNext` implementa reencuadre condicional por viewport al cambiar filtro.
- Referencia: `docs/bitacora/2026/02/146-mappinfilter-badge-vacios-y-reencuadre-contextual.md`.

**Referencias**
- `docs/contracts/SEARCH_V2.md`
- `docs/contracts/MAP_PINS_CONTRACT.md`
- `docs/ops/plans/PLAN_EXPLORE_AJUSTES_MAP_SEARCH.md`

---

### OL-P1-012 — Simplificación Search V2 + mapa con enfoque Mapbox-first

**Estado:** ACTIVO (nuevo QA 2026-02-25)

**Problema:** Hay señales de sobre-regulación en reglas custom de Search/Map que compiten con comportamientos nativos de Mapbox y elevan riesgo de inconsistencias.

Hallazgo QA adicional (2026-02-25):
- La zona de resultados de búsqueda quedó con estilos "en duro" (cards oscuras) y no respeta modo Light en web.

**DoD / AC**
- Auditoría de reglas custom vigentes vs capacidades nativas de Mapbox usadas actualmente.
- Identificar reglas redundantes y proponer eliminación o degradación por flag.
- Definir baseline simplificado con menor branching y sin perder guardrails críticos.
- Registrar matriz `mantener / simplificar / eliminar` con impacto y riesgo.

**Pruebas mínimas**
- Comparativa A/B: baseline actual vs baseline simplificado en casos QA críticos.
- Sin regresión en ranking landmark, create-from-search, tap->sheet, y performance percibida.
- Smoke tema: Search results en `light` y `dark` usan tokens DS (sin hardcode oscuro en light).

**Avance 2026-02-25 (consultoría técnica inicial):**
- Se crea matriz inicial `mantener / simplificar / eliminar` para Search+Map con enfoque QA-first.
- Documento base: `docs/ops/analysis/SEARCH_MAPBOX_SIMPLIFICATION_MATRIX.md`.
- Siguiente paso: ejecutar simplificaciones de bajo riesgo una por una con smoke A/B.
- Se agrega hallazgo QA de theming: resultados de búsqueda hardcoded oscuros no adaptan a Light.
- Bitácora: `docs/bitacora/2026/02/147-search-results-theme-hardcoded-no-light.md`.
- Ajuste implementado: `SearchListCard` migra a tokens DS por tema (light/dark), eliminando hardcode oscuro.
- Bitácora: `docs/bitacora/2026/02/148-search-results-theme-light-tokens-ds.md`.
- Ajuste implementado: badge flotante de estado en resultados internos (`to_visit` / `visited`) usando iconos y color DS.
- Bitácora: `docs/bitacora/2026/02/149-search-results-status-badge-saved-visited.md`.

**Referencias**
- `docs/ops/plans/PLAN_SEARCH_V2_POI_FIRST_SAFE_MIGRATION.md`
- `docs/ops/plans/PLAN_SPOT_LINKING_VISIBILITY_SAFE_ROLLOUT.md`
- `docs/contracts/SEARCH_V2.md`

---

### OL-P2-001 — Filtros “Todos / Guardados / Visitados” en buscador (layout)

**Estado:** ACTIVO

**Problema:** necesidad de UI de filtros (como Explore v1) sin activar Gate C.

**DoD / AC**
- Primera línea: filtros + cerrar buscador
- Segunda línea: input de búsqueda ancho completo
- No se introduce Radix/shadcn (Gate C pausado): usar componentes existentes/estables.

**Pruebas mínimas**
- Smoke: cambiar filtro afecta resultados/pins según contrato de Search/Explore

---

### OL-P2-002 — En buscador: teclado desaparece al hacer scroll o interactuar

**Estado:** ACTIVO

**DoD / AC**
- Scroll/tap fuera del input cierra teclado (sin cerrar Search).
- No rompe overlay/sheet ni causa jumps.

**Pruebas mínimas**
- Smoke: abrir search + teclado → scroll results → teclado se oculta

---

### OL-P2-003 — Color de pines cuando filtro “Guardados” está activo

**Estado:** ACTIVO

**Problema:** si selecciono filtro “Guardados”, los pines visitados se ven con color “visitados” y confunde.

**DoD / AC**
- Si filtro = Guardados: todos los pines visibles usan color “guardados”.
- Si filtro = Visitados: todos los pines visibles usan color “visitados”.
- Si filtro = Todos: color por estado real (guardado/visitado/etc.).

**Pruebas mínimas**
- Smoke: alternar filtros y validar consistencia visual

---

### OL-P2-004 — KEYBOARD_AND_TEXT_INPUTS Fase 9 (autoFocus) pendiente de verificación

**Estado:** ACTIVO

**Problema:** El plan de keyboard/CTA reporta fases implementadas, pero la verificación final de autoFocus quedó pendiente.

**DoD / AC**
- Verificar y documentar autoFocus en flows acordados (web/native) sin romper keyboard-safe.
- Actualizar plan/bitácora con resultado (OK o ajustes requeridos).

**Pruebas mínimas**
- Smoke: abrir flujos con input inicial esperado y confirmar foco correcto.
- Smoke: sin regresiones en CTA sticky / dismiss keyboard.

**Referencia**
- `docs/ops/plans/PLAN_KEYBOARD_CTA_CONTRACT.md`

---

### OL-P2-005 — Inventario DS canónico de Explore no cerrado

**Estado:** ACTIVO

**Problema:** `DESIGN_SYSTEM_USAGE` declara explícitamente que falta un inventario canónico cerrado de componentes DS para Explore.

**DoD / AC**
- Definir inventario mínimo canónico (componentes + variantes permitidas).
- Publicar fuente de verdad en ops/definitions y referenciarla desde contratos.
- Cerrar el OPEN LOOP del contrato.

**Pruebas mínimas**
- Checklist de componentes en uso vs inventario definido.
- Cero creación de variantes duplicadas fuera del inventario.

**Referencia**
- `docs/contracts/DESIGN_SYSTEM_USAGE.md`

---

### OL-P2-006 — Optimización integral de pantalla Explorar (análisis + reestructura)

**Estado:** ACTIVO (solo definición de actividad; no ejecutar implementación aún)

**Objetivo:** Analizar la pantalla Explorar actual (features + comportamientos) y emitir recomendaciones accionables para optimizar arquitectura, extraer core reutilizable, limpiar deprecated, y alinear Design System.

**Alcance de la actividad (como lo pediste)**
- Analizar flujo actual end-to-end de Explorar: mapa, search, selección de spot, create spot mínimo, sheets, overlays, teclado/CTA.
- Identificar qué lógica está embebida en UI y debe extraerse a core reutilizable (state/intents/effects).
- Detectar código/pantallas/componentes deprecated para marcar y mover a _archive según guardrails.
- Detectar componentes no canónicos/no existentes en Design System y proponer actualización del inventario DS.

**Entregable esperado**
- Documento de análisis con diagnóstico por áreas (estado actual, deuda, riesgos, impacto).
- Recomendaciones priorizadas (P0/P1/P2) con propuesta de extracción/reestructura por fases.
- Matriz de deprecación (qué marcar, desconectar, eliminar).
- Matriz DS (componente actual vs canónico vs acción: crear/migrar/deprecar).
- Plan de ejecución en micro-scopes (1 PR por scope) con DoD y smoke tests.

**Subdivisión en loops (si se ejecuta después)**
- `OL-P2-006A` — Diagnóstico técnico-funcional de Explorar actual.
- `OL-P2-006B` — Propuesta de extracción de core (UI-adapter vs core module boundaries).
- `OL-P2-006C` — Deprecación controlada (pantallas/componentes/código) + archivo histórico.
- `OL-P2-006D` — Normalización Design System (inventario canónico + gaps + migración).

**Criterios de aceptación (actividad)**
- Hay trazabilidad explícita código ↔ contrato ↔ recomendación.
- No se ejecutan cambios de implementación en esta actividad (solo análisis y plan).
- Queda lista una ruta de ejecución incremental sin bloquear operación actual.

**Referencias base**
- `docs/ops/CURRENT_STATE.md`
- `docs/ops/governance/GUARDRAILS_DEPRECACION.md`
- `docs/ops/plans/PLAN_EXPLORE_V1_STRANGLER.md`
- `docs/contracts/explore/EXPLORE_STATE.md`
- `docs/contracts/explore/EXPLORE_INTENTS.md`
- `docs/contracts/explore/EXPLORE_EFFECTS.md`
- `docs/contracts/DESIGN_SYSTEM_USAGE.md`
- `docs/contracts/KEYBOARD_AND_TEXT_INPUTS.md`

---

### OL-DEPREC-001 — Limpieza de código deprecated

**Estado:** DOCUMENTADO (no prioritario)

**Problema:** Hay pantallas/flujos marcados como deprecated que siguen en el código.

**DoD / AC**
- Seguir `docs/ops/governance/GUARDRAILS_DEPRECACION.md` (3 fases: Marcar → Desconectar → Eliminar).
- Revisar tabla de elementos deprecated; identificar cuáles están listos para Fase 3.
- Bitácora por cada eliminación.

**Referencias**
- `docs/ops/governance/GUARDRAILS_DEPRECACION.md`
- Elementos: `/mapaV0`, `onOpenDetail` (SpotSheet), `getPinsForSpotsLegacy`, flujo wizard largo create-spot

---

### OL-MAPBOX-001 — Alertas Mapbox en consola (featureset, image variables)

**Estado:** DOCUMENTADO (revisar al actualizar mapbox-gl)

**Problema:** Avisos en consola al cargar el mapa: `featureNamespace place-A of featureset place-labels's selector...`, `Ignoring unknown image variable "background"`, `"background-stroke"`, `"icon"`.

**Acción:** Al actualizar mapbox-gl o el estilo del mapa, verificar si desaparecen o requieren ajustes.

**Bitácora:**
- `docs/bitacora/2026/02/106-consola-warnings-fix-mapbox-doc.md`
- `docs/bitacora/2026/02/120-mapbox-warning-place-labels-persistente.md`

---

## Futuro (no prioritario — retomar después)

> Ideas documentadas para no perder. No bloquean cierre de sesión.

### OL-FUT-001 — Galería de imágenes por spot

**Estado:** DOCUMENTADO (no implementar aún)

Plan: `docs/ops/plans/PLAN_SPOT_GALLERY_MI_DIARIO.md` (Feature 1).
Múltiples imágenes públicas por spot: grid 2-3 celdas en hero, tap abre galería estilo Apple Maps.

### OL-FUT-002 — Mi diario (Recordar)

**Estado:** DOCUMENTADO (no implementar aún)

Plan completo: `docs/ops/plans/PLAN_RECORDAR_MI_DIARIO.md`.
Contrato entry point (estado actual: DRAFT): `docs/contracts/RECORDAR_ENTRY_SPOT_SHEET.md`.
Notas personales por spot; entry desde SpotSheet cuando saved/visited; dos botones en fila responsiva.

---

### OL-PLAN-EXPLORE — Ajustes Mapa + Búsqueda

**Estado:** PLAN DOCUMENTADO (ejecutar después de P0)

**Plan:** `docs/ops/plans/PLAN_EXPLORE_AJUSTES_MAP_SEARCH.md`

| MS | Título |
|----|--------|
| MS-A | Long-press solo un dedo (OL-P0-003) |
| MS-B | Pin visible en Paso 0 |
| MS-C | POIs/landmarks en mapa |
| MS-D | Colores agua y zonas verdes |
| MS-E | Búsqueda POIs en sin-resultados |

Un MS por PR; revisión tras cada uno.

**Nota (2026-02-22):** Preview pin al seleccionar sugerencia de búsqueda (POI) implementado como extensión del flujo search→create. Bitácora 112.

---

### Plan Explore Anti-duplicados y UX

**Estado:** CERRADO (2026-02-22, bitácora 114)

| MS | Título |
|----|--------|
| MS-1 | 3D default en código (sin .env) |
| MS-2 | Contrato ANTI_DUPLICATE_SPOT_RULES |
| MS-3 | Match POI-spot con lista completa |
| MS-4 | checkDuplicateSpot en flujos POI y Draft |
| MS-4b | DuplicateSpotModal 2 pasos (Ver / Crear otro / Cerrar) |
| MS-5 | Pin visible en pasos draft |
| MS-6 | Altura sheet draft (anchor adaptativo) |

Contrato: `docs/contracts/ANTI_DUPLICATE_SPOT_RULES.md`.
