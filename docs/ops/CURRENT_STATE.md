# CURRENT_STATE — Flowya (operativo)

> Snapshot operativo vigente.
> Esta fuente se sincroniza con `OPEN_LOOPS.md` y bitácora del día.

**Fecha de actualización:** 2026-03-03

---

## Estado general

- Gate Fase 1: **CERRADO**.
- Gate Fase 2: **CERRADO** (bitácora `213`).
- Fase 3 base: **COMPLETADA** (`OL-WOW-F3-001/002/003` cerrados).
- `OL-P2-006`: **CERRADO**.
- `OL-P1-003`: **CERRADO**.
- Loop activo real: **`OL-CONTENT-001`** (Mi diario v1: notas por spot + persistencia).

---

## Estado funcional actual (producto)

### Explore + Countries

- CountriesSheet operativo en medium/expanded.
- Interacción de mapa mundial activa para drilldown.
- No-ensamble de sheets (regla de colisión activa).
- Share card web con fallback de descarga local cuando no hay share nativo.

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

---

## Siguiente paso operativo

- Ejecutar `OL-CONTENT-001` como único loop activo.
- Mantener freeze de `OL-P3-002.B` salvo bug crítico.
