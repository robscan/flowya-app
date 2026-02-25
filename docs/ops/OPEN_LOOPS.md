# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-02-25

> Este archivo define el alcance diario del chat.
> El objetivo es **vaciar esta lista** para dar por cerrada la sesión.
> Los loops cerrados NO permanecen aquí (se registran en bitácora).

---

## Siguiente sprint (prioridad)

| Plan | Descripción |
|------|-------------|
| [PLAN_SYSTEM_STATUS_BAR.md](plans/PLAN_SYSTEM_STATUS_BAR.md) | System Status Bar: reemplazo de toast, cola 3 mensajes, tono asistente de viaje, textos canónicos. Definición en `docs/definitions/SYSTEM_STATUS_BAR.md`. |
| [PLAN_RECORDAR_MI_DIARIO.md](plans/PLAN_RECORDAR_MI_DIARIO.md) | Mi diario (Recordar): notas personales por spot, entry desde SpotSheet (saved/visited). EP-1 a EP-3. |

---

## Prioridades (orden fijo)
1) **Resolver Create Spot: siempre desde creador mínimo**  
2) **Rediseñar Edit Spot**  
3) **Implementar System Status Bar (reemplazo de toast)**  
4) **Completar Search MS-E (POIs en sin-resultados)**  
5) Resolver bugs restantes detectados en pruebas

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

**Estado:** ACTIVO

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

**Referencias**
- `docs/contracts/DEEP_LINK_SPOT.md`
- `docs/bitacora/2026/02/090-explore-deep-link-post-edit-share.md`
- `docs/bitacora/2026/02/118-zoom-canonico-y-post-edit-spot-location.md`

---

### OL-P1-006 — Integrar datos POI turístico en DB + migración Supabase (maki/categorías)

**Estado:** ACTIVO (planificado, no ejecutar ahora)

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

**Estado:** ACTIVO

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
