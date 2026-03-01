# PLAN_OL_P2_006_OPTIMIZACION_EXPLORE_2026-02-28

**Fecha:** 2026-02-28  
**OL:** `OL-P2-006`  
**Objetivo:** reducir riesgo de regresión en Explore mediante optimización estructural incremental, sin cambios UX no planeados.

---

## 1) Diagnóstico operativo actual

### Superficie crítica observada

- `MapScreenVNext` concentra demasiada orquestación (`~3054` líneas).
- `SpotSheet` mantiene alta complejidad de variantes (`~1674` líneas).
- `SearchSurface` ya unificó web/native, pero aún comparte decisiones de negocio desde contenedor (`~434` líneas).
- `useMapCore` conserva responsabilidades de mapa y control, parcialmente acopladas al contenedor (`~553` líneas).

### Riesgos top

1. **Acoplamiento excesivo en contenedor principal**
- Impacto: alto.
- Probabilidad: alta.
- Evidencia: `components/explorar/MapScreenVNext.tsx`.

2. **Regresión por cambios cruzados mapa/search/sheet en un solo PR**
- Impacto: alto.
- Probabilidad: media-alta.
- Evidencia: flujos se conectan por efectos y callbacks en el mismo archivo.

3. **Deuda de mantenimiento en SpotSheet por lógica mezclada (estado + rendering + acciones)**
- Impacto: medio-alto.
- Probabilidad: media.
- Evidencia: `components/explorar/SpotSheet.tsx`.

---

## 2) Guardrails de ejecución

- 1 PR = 1 micro-scope funcional (sin mezclar dominios).
- No introducir features nuevas durante P2-006.
- No tocar F3 cerrado (001/002/003) salvo fixes de compatibilidad.
- Todo micro-scope cierra con:
  - bitácora,
  - actualización de `OPEN_LOOPS`,
  - smoke mínimo mapa/search/sheet.

Referencias:
- `docs/ops/governance/GUARDRAILS_DEPRECACION.md`
- `docs/ops/plans/PLAN_EXPLORE_V1_STRANGLER.md`
- `docs/contracts/explore/EXPLORE_STATE.md`
- `docs/contracts/explore/EXPLORE_INTENTS.md`
- `docs/contracts/explore/EXPLORE_EFFECTS.md`

---

## 3) Micro-scopes propuestos (P0 -> P2)

## P0 — Reducir riesgo en `MapScreenVNext` (orquestación)

### Alcance
- Extraer bloques puros de orquestación a módulos locales/runtime sin cambiar UX:
  - selección/contexto,
  - flujos de no-results/search,
  - handlers de transición sheet/filter.

### DoD
- Disminuye complejidad del contenedor (lectura y responsabilidades más claras).
- Sin cambio de comportamiento funcional observable.
- Instrumentación F3-003 sigue operativa.

### Smoke mínimo
1. abrir/cerrar search,
2. seleccionar spot/poi,
3. cambiar filtros,
4. abrir/cerrar sheet,
5. create spot básico desde search no-results.

---

## P1 — Segmentar `SpotSheet` por responsabilidades

### Alcance
- Dividir en subcomponentes internos (header/actions/body states) sin alterar contrato externo.
- Mantener props y estados actuales (`peek/medium/expanded`).

### DoD
- `SpotSheet` conserva comportamiento actual.
- Mejor trazabilidad de acciones (`save/share/directions/edit`).
- Menor riesgo de side effects al modificar copy/CTA.

### Smoke mínimo
1. spot seleccionado -> medium/expanded,
2. CTA pin status,
3. compartir y directions,
4. cierre de sheet y restauración de contexto.

---

## P2 — Alineación documentación + deprecación activa

### Alcance
- Revisar tabla de deprecated y limpiar entradas que ya estén eliminadas o cerradas.
- Alinear contratos y referencias con arquitectura runtime actual.

### DoD
- `GUARDRAILS_DEPRECACION` actualizado.
- Contratos sin referencias obsoletas críticas.
- `OPEN_LOOPS` sin contradicciones.

### Smoke mínimo
- Verificación documental cruzada (`OPEN_LOOPS`, `CURRENT_STATE`, contratos activos).

---

## 4) Orden recomendado de ejecución

1. P0 (MapScreenVNext orquestación)
2. P1 (SpotSheet segmentación)
3. P2 (higiene documental/deprecación)

Regla de corte:
- Si P0 introduce regresión smoke, se revierte scope y se replantea antes de P1.

---

## 5) Criterio de cierre de OL-P2-006

- P0/P1/P2 ejecutados con smoke OK por micro-scope.
- Evidencia en bitácora por cada scope.
- Riesgo de regresión percibido menor que baseline actual.

Estado de cumplimiento (2026-02-28):
- Cumplido y cerrado operativamente en bitácora `232`.
