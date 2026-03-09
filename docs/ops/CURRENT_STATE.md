# CURRENT_STATE — Flowya (operativo)

> Snapshot operativo vigente.
> Esta fuente se sincroniza con `OPEN_LOOPS.md` y bitácora del día.

**Fecha de actualización:** 2026-03-08

---

## Estado general

- Gate Fase 1: **CERRADO**.
- Gate Fase 2: **CERRADO** (bitácora `213`).
- Fase 3 base: **COMPLETADA** (`OL-WOW-F3-001/002/003` cerrados).
- `OL-P2-006`: **CERRADO**.
- `OL-P1-003`: **CERRADO**.
- Loop activo real: **`OL-SEARCHV2-EMPTY-FLOWYA-POPULAR-001`** (Lugares populares en Flowya implementado; pendiente migración + bitácora).
- Gate de activación inmediato: **`OL-SPOTSHEET-EXPANDED-AUTH-GATE-001`** (evitar auth prematuro al pasar `medium -> expanded`).

---

## Estado funcional actual (producto)

### Explore + Countries

- CountriesSheet operativo en medium/expanded.
- Interacción de mapa mundial activa para drilldown.
- No-ensamble de sheets (regla de colisión activa).
- Share card web con fallback de descarga local cuando no hay share nativo.
- Geolocalización por intención explícita: no se solicita permiso en carga; `Mi ubicación` dispara request on-demand con guía en `denied` persistente.
- Auth modal con copy actualizado: foco en guardar/marcar spots + claridad de acceso por enlace seguro al correo (sin contraseña).
- Buscador con copy explícito de alcance: `Busca: países, regiones o lugares` (entrada coherente con capacidades geográficas/lugares en filtro `all`).
- Search cold-start global activo: en primer arranque sin interacción (y sin ubicación) muestra `Paises populares` y `Lugares populares`; al primer gesto/intención vuelve al flujo local/contextual normal.
- Search empty-state: cuando pocos resultados locales (all + query vacía), sección "Lugares populares en Flowya" con spots más visitados (RPC get_most_visited_spots). Pendiente migración 016 en Supabase.
- Selección de país/región desde búsqueda: encuadre completo del territorio con `fitBounds` cuando hay `bbox` (fallback a zoom geográfico amplio si no hay `bbox`).
- Branding de entrada en Explore: slogan final `SIGUE LO QUE` / `TE MUEVE` aparece temporalmente con fade y se posiciona debajo del filtro superior sin bloquear interacción.
- Fix de `Mi ubicación` en Explore: estado programático del mapa solo se activa cuando hay movimiento real de cámara.
- Política UX vigente para activación: lectura libre de mapa/sheet sin auth inicial; auth modal solo en mutaciones (`guardar`, `visitar`, `editar`, `crear`).
- Entrada de Explore con motion de cámara en globo: arranque en `GLOBE_ZOOM_INITIAL` + `flyTo` a vista world, con guardrails para no interferir deep links ni interacción manual temprana.

### Gamificación (V1)

- Score activo en runtime:
  - países (`+120`) + spots (`+8`).
- Terminología de usuario: **flows**.
- Barra de nivel en `visitados` con referencia `X/12`.
- Modal de niveles disponible desde `X/12`.
- Chip de flows sobre perfil con mensaje de incentivo por tap.
- En `por visitar`: KPI muestra `flows por obtener` y no se dibuja barra de nivel.
- Orden canónico KPI sincronizado en sheet/share: `países -> spots -> flows`.
- Mapa `Todos`: default vinculados a POI ocultos; default Flowya sin link visibles.
- Estilo pin default Flowya sin link refinado (`+` centrado + ajuste final de label).

### Documentación de gamificación

- Contrato canónico actualizado: `docs/contracts/GAMIFICATION_TRAVELER_LEVELS.md`.
- V2 (telemetría + calibración + distancia por tramos): documentada, no implementada.

---

## Riesgos vigentes

1. **Riesgo de desalineación entre alcance Recordar-lite y scope expandido de diario**.
- Mitigación: mantener `OL-CONTENT-001` en nota breve + persistencia, sin abrir timeline/feed ni editor complejo.

2. **Confusión de alcance V1/V2 de gamificación**.
- Mitigación: contrato con separación explícita (V1 activa vs V2 diferida).

3. **Regresión de UX map-first por integración de entrada de notas en SpotSheet**.
- Mitigación: validar no-apilamiento de overlays y estabilidad de transición de sheet (`peek/medium/expanded`).

4. **Deriva documental diaria**.
- Mitigación: actualizar bitácora + `OPEN_LOOPS` + `CURRENT_STATE` en cada cierre de bloque.

5. **Fricción de activación por auth prematuro en SpotSheet expanded**.
- Mitigación: cerrar `OL-SPOTSHEET-EXPANDED-AUTH-GATE-001` y validar que `medium -> expanded` no dispare auth si no hay mutación explícita.

---

## Referencias activas

- `docs/ops/OPEN_LOOPS.md`
- `docs/contracts/GAMIFICATION_TRAVELER_LEVELS.md`
- `docs/contracts/INDEX.md`
- `docs/bitacora/2026/03/259-ol-p3-002-b-web-hardening-bloqueo-zoom-mini-mapa-paises.md`
- `docs/bitacora/2026/03/260-ol-p3-002-b-share-card-guardrails-snapshot-y-reintentos.md`
- `docs/bitacora/2026/03/261-ol-p3-002-b-share-card-estilo-sheet-tiers-y-descarga-web.md`
- `docs/bitacora/2026/03/262-gamification-traveler-levels-v2-modal-y-referencia-x-de-12.md`
- `docs/bitacora/2026/03/263-gamification-levels-v3-estilo-barra-modal-lista-y-copys-flowya.md`
- `docs/bitacora/2026/03/264-gamification-v2-docs-analytics-y-ajuste-inset-horizontal-mapa.md`
- `docs/bitacora/2026/03/265-gamification-flows-v1-consolidacion-sheet-modal-share-y-overlay-mapa.md`
- `docs/bitacora/2026/03/266-gamification-kpi-order-countriessheet-share-y-toast-flows.md`
- `docs/bitacora/2026/03/267-qa-fix-toast-flows-safari-imagepicker-target-nota-y-share-map-border.md`
- `docs/bitacora/2026/03/268-map-default-pins-hide-linked-poi-and-blue-unlinked-flowya.md`
- `docs/bitacora/2026/03/269-fix-keyboard-owner-paso-0-create-spot-sin-colision-quick-edit.md`
- `docs/bitacora/2026/03/270-map-pin-default-flowya-unlinked-style-plus-bluegray.md`
- `docs/bitacora/2026/03/271-map-pin-default-label-swap-fill-halo-final.md`
- `docs/bitacora/2026/03/272-map-pins-zoom-architecture-and-filter-badge-light-contrast.md`
- `docs/bitacora/2026/03/273-sticky-context-and-recent-mutation-visibility-for-core-spots.md`
- `docs/bitacora/2026/03/274-followup-core-default-labels-visible-in-filtered-contexts.md`
- `docs/bitacora/2026/03/285-search-empty-local-pois-y-ajustes-map-controls-world-fallback.md`
- `docs/bitacora/2026/03/286-geolocation-permissions-on-demand-and-denied-guidance.md`
- `docs/bitacora/2026/03/287-auth-copy-save-mark-magic-link-clarity.md`
- `docs/bitacora/2026/03/288-search-copy-paises-regiones-lugares.md`
- `docs/bitacora/2026/03/289-search-cold-start-world-trending-with-randomized-seeds.md`
- `docs/bitacora/2026/03/290-search-country-region-fit-bounds-selection.md`
- `docs/bitacora/2026/03/291-explore-slogan-intro-fade-under-filter.md`
- `docs/bitacora/2026/03/292-explore-slogan-typography-shadow-tuning.md`
- `docs/bitacora/2026/03/293-explore-slogan-copy-and-typography-final-tuning.md`
- `docs/bitacora/2026/03/294-fix-locate-programmatic-state-on-permission-failure.md`
- `docs/bitacora/2026/03/295-plan-gate-spotsheet-expanded-sin-auth-y-loader-neutral.md`
- `docs/bitacora/2026/03/296-explore-globe-entry-motion-flyto-world-safe-guardrails.md`

---

## Siguiente paso operativo

- Ejecutar migración 016 (RPC get_most_visited_spots) en Supabase; smoke empty-state; bitácora.
- Cerrar `OL-SPOTSHEET-EXPANDED-AUTH-GATE-001` como gate de activación antes de abrir features nuevas.
- Retomar `OL-CONTENT-001` tras cierre del gate.
- Mantener freeze de `OL-P3-002.B` salvo bug crítico.
