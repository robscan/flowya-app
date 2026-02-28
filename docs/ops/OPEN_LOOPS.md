# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-02-28

> Este archivo define el alcance diario del chat.
> El objetivo es **vaciar esta lista** para dar por cerrada la sesión.
> Los loops cerrados no deben permanecer aquí (ver bitácoras).

---

## Foco inmediato (P2/P3)

**Orden sugerido (siguiente ciclo)**
1. `OL-WOW-F2-003` (filtros como intención)
4. `OL-WOW-F2-005` (cámara/foco mini QA secuencial)

### OL-P2-001 — Filtros “Todos / Guardados / Visitados” en buscador (layout)

**Estado:** CERRADO

**DoD / AC**
- Primera línea: filtros + cerrar buscador.
- Segunda línea: input de búsqueda ancho completo.
- No introducir Radix/shadcn (Gate C pausado): usar componentes existentes.

**Pruebas mínimas**
- Smoke: cambiar filtro afecta resultados/pins según contrato Search/Explore.

**Referencia**
- Bitácora `205`.

---

### OL-P2-002 — En buscador: teclado desaparece al hacer scroll o interactuar

**Estado:** CERRADO

**DoD / AC**
- Scroll/tap fuera del input cierra teclado (sin cerrar Search).
- No rompe overlay/sheet ni causa jumps.

**Pruebas mínimas**
- Smoke: abrir search + teclado → scroll results → teclado se oculta.

---

### OL-P2-003 — Color de pines cuando filtro “Guardados” está activo

**Estado:** CERRADO

**Problema**
- Con filtro Guardados, pines visitados conservan color de visitados y confunden.

**DoD / AC**
- Si filtro = Guardados: todos los pines visibles usan color Guardados.
- Si filtro = Visitados: todos los pines visibles usan color Visitados.
- Si filtro = Todos: color por estado real.

**Pruebas mínimas**
- Smoke: alternar filtros y validar consistencia visual.

**Referencia**
- Bitácora `205`.

---

### OL-P2-004 — KEYBOARD_AND_TEXT_INPUTS Fase 9 (autoFocus) pendiente de verificación

**Estado:** CERRADO

**DoD / AC**
- Verificar y documentar autoFocus en flows acordados (web/native) sin romper keyboard-safe.
- Actualizar plan/bitácora con resultado.

**Pruebas mínimas**
- Smoke: foco inicial correcto en flujos acordados.
- Smoke: sin regresiones en CTA sticky y dismiss keyboard.

**Referencia**
- `docs/ops/plans/PLAN_KEYBOARD_CTA_CONTRACT.md`

---

### OL-P2-005 — Inventario DS canónico de Explore no cerrado

**Estado:** CERRADO

**DoD / AC**
- Definir inventario mínimo canónico (componentes + variantes permitidas).
- Publicar fuente de verdad y referenciarla desde contratos.

**Pruebas mínimas**
- Checklist de componentes en uso vs inventario definido.

**Referencia**
- `docs/contracts/DESIGN_SYSTEM_USAGE.md`
- Bitácora `196`.

---

### OL-P2-006 — Optimización integral de pantalla Explorar (análisis + reestructura)

**Estado:** ACTIVO — completar conforme se avanzan y definen o descartan nuevos elementos.

**Entregable esperado**
- Diagnóstico por áreas (estado actual, deuda, riesgos, impacto).
- Recomendaciones priorizadas (P0/P1/P2).
- Matriz de deprecación.
- Matriz DS.
- Plan de ejecución en micro-scopes.

**Referencias base**
- `docs/ops/CURRENT_STATE.md`
- `docs/ops/governance/GUARDRAILS_DEPRECACION.md`
- `docs/ops/plans/PLAN_EXPLORE_V1_STRANGLER.md`
- `docs/contracts/explore/EXPLORE_STATE.md`
- `docs/contracts/explore/EXPLORE_INTENTS.md`
- `docs/contracts/explore/EXPLORE_EFFECTS.md`

---

### OL-P2-008 — Descomposición de roadmap WOW (3 fases) a OL operables

**Estado:** CERRADO

**DoD / AC**
- Traducir `PLAN_WOW_ROADMAP_3_FASES.md` a OL accionables por fase.
- Cada OL debe incluir:
  - objetivo concreto,
  - DoD/AC verificable,
  - pruebas mínimas,
  - dependencia/gate de fase.
- Priorizar secuencia de ejecución para iniciar operación sin ambigüedad.

**Pruebas mínimas**
- Checklist de trazabilidad: cada iniciativa estratégica del roadmap mapeada a al menos un OL.
- Validación de que no hay OL duplicados/contradictorios con loops activos.

**Referencia**
- `docs/ops/plans/PLAN_WOW_ROADMAP_3_FASES.md`

---

## Roadmap WOW — OL operables por fase

> Gate global: no ejecutar Fase 2/3 hasta cerrar gates de Fase 1.

### Fase 1 — Fundación Clara y Estable

#### OL-WOW-F1-001 — Blueprint único de selección dominante (mapa/pines/POI)
**Estado:** CERRADO

**DoD / AC**
- Contrato único de selección documentado y aplicado en runtime activo.
- Cero doble fuente visual (pin/label/layer externo) durante selección.
- Política explícita de restauración al salir de selección.

**Pruebas mínimas**
- Smoke: selección default y to_visit en POI/spot sin traslapes.
- Smoke: pan/zoom + selección mantiene feedback inequívoco.
- Smoke: tap en POI ya existente abre spot persistido correcto (no sheet POI en estado incorrecto).
- Smoke: tipografía/estilo de labels en selección no compite visualmente con labels base de mapa.

**Dependencia**
- Ninguna (entrypoint fase 1).

**Referencia**
- `docs/contracts/explore/SELECTION_DOMINANCE_RULES.md`
- Bitácoras `192`, `194`, `195`, `196`, `198`.

#### OL-WOW-F1-002 — Contrato de estados interactivos cross-platform
**Estado:** CERRADO

**DoD / AC**
- Matriz `default/hover/pressed/focus-visible/selected/disabled/loading` cerrada.
- `pressed` mobile comunica la misma intención visual que `hover` web.
- Tokens de estado definidos y referenciados desde DS contract.

**Pruebas mínimas**
- Checklist visual web/mobile en componentes críticos (botones, icon-buttons, rows).

**Dependencia**
- `OL-WOW-F1-001`.

**Avance**
- Matriz canónica v1 documentada en `docs/contracts/DESIGN_SYSTEM_USAGE.md` (componentes críticos + reglas de mapeo + checklist).
- Implementación v1 aplicada en runtime DS de componentes críticos (`IconButton`, `ActionButton`, `SearchListCard`) con tokens de estado compartidos.
- Sección `/design-system` expandida con showcase explícito de estados (`selected/disabled/loading`) y retiro de artefactos legacy (`mapaV0`, `MapScreenV0`, `map-ui`).

**Referencia**
- Bitácoras `197`, `199`, `200`, `205`.

#### OL-WOW-F1-003 — Naming DS canónico para listados (`ListView` + `ResultRow`)
**Estado:** CERRADO

**DoD / AC**
- Naming canónico adoptado en contratos/guías.
- Alias transitorios definidos para migración sin ruptura.
- Regla de separación lista/item explícita y estable.

**Pruebas mínimas**
- Checklist de rutas de uso en Explore/Search/Edit Spot sin contradicciones de naming.

**Dependencia**
- `OL-WOW-F1-002`.

**Referencia**
- `docs/contracts/DESIGN_SYSTEM_USAGE.md`
- Bitácora `201`.

#### OL-WOW-F1-004 — Activity Summary Fase A (visited/pending)
**Estado:** CERRADO

**DoD / AC**
- Contrato `ACTIVITY_SUMMARY` aterrizado a implementación fase A.
- Métricas visibles: `visitedPlacesCount`, `pendingPlacesCount`.
- `visitedCountriesCount` bloqueado/partial hasta fuente confiable.

**Pruebas mínimas**
- Smoke: cambios de pin actualizan resumen sin polling agresivo.
- Smoke: no auth no filtra datos privados.

**Dependencia**
- `OL-WOW-F1-002`.

**Avance**
- Componente `ActivitySummary` integrado en Search web/native.
- Visibilidad condicionada a auth.
- Métricas activas: `visitedPlacesCount` (visited), `pendingPlacesCount` (to_visit).
- `visitedCountriesCount` habilitado en modo heurístico (`address`) con guardrail de cobertura mínima; fallback a `—` cuando la calidad no alcanza umbral.

**Referencia**
- `docs/contracts/ACTIVITY_SUMMARY.md`
- Bitácoras `202`, `203`, `204`.

### Gate Fase 1
**Criterio de paso**
- `OL-WOW-F1-001..004` cerrados + 3 ciclos smoke sin regresión P0.

**Estado gate**
- CERRADO (2026-02-27).

---

### Fase 2 — Interacción WOW (Intención y Flujo)

#### OL-WOW-F2-001 — Single Search Surface (contenido unificado)
**Estado:** CERRADO

**DoD / AC**
- Árbol de contenido de búsqueda unificado; adapters por plataforma mínimos.
- Paridad funcional web/native en estados `isEmpty/isPreSearch/isSearch/isNoResults`.
- Principio `Mapbox-first`: priorizar capacidades nativas de Mapbox; lógica custom solo si hay limitación demostrada o necesidad de acceso/acción sobre spots.
- SearchSurface con `renderItem` genérico compatible con union `Spot | PlaceResult` para OL posteriores.

**Pruebas mínimas**
- Smoke comparativo web/native por estado de búsqueda.

**Dependencia**
- Gate Fase 1.

**Referencia**
- Bitácora `206`.
- `docs/ops/proposals/PROPOSAL_SEARCH_POIS_LANDMARKS_IN_LIST.md` (principio: usuario ve solo spots, sin distinguir DB vs externo).

---

#### OL-WOW-F2-001-SEARCH — Lista unificada isSearch (spots + POIs/landmarks)
**Estado:** CERRADO

**DoD / AC**
- Lista principal de resultados en `isSearch` fusiona Flowya spots + POIs/landmarks Mapbox en un único listado.
- Orden por atractivo/interés (landmarks, cercanía, relevancia de query); el usuario no distingue origen.
- Misma fila visual para Spot y PlaceResult; tap en POI abre flujo Crear spot (transparente).
- En filtros `saved/visited` solo Flowya spots (operativo).

**Pruebas mínimas**
- Smoke: query >= 3, pinFilter=all → lista con spots DB + POIs/landmarks.
- Smoke: tap en spot DB → ficha; tap en POI → Crear spot.
- Smoke: filtro saved/visited → solo spots Flowya.

**Dependencia**
- OL-WOW-F2-001.

**Referencia**
- Bitácora `207`.
- `docs/ops/proposals/PROPOSAL_SEARCH_POIS_LANDMARKS_IN_LIST.md` (Fase 1).

---

#### OL-WOW-F2-001-EMPTY — Lista unificada isEmpty (Flowya + POIs categoría)
**Estado:** CERRADO

**DoD / AC**
- Lista en `isEmpty` fusiona Flowya spots cercanos + POIs por categoría Mapbox (Category API) en un único listado.
- Sin etiquetas "Spots cercanos" vs "Lugares cercanos"; el usuario ve un único listado de spots.
- Orden por atractivo/cercanía.
- `lib/places/searchPlacesCategory.ts` (nuevo) con categoría `attraction` o `landmark`.

**Pruebas mínimas**
- Smoke: query vacía, Search abierto → lista única con spots Flowya + POIs Mapbox.
- Smoke: tap en spot DB → ficha; tap en POI → Crear spot.

**Dependencia**
- OL-WOW-F2-001.

**Referencia**
- Bitácora `208`.
- Plan: `docs/ops/plans/PLAN_OL_WOW_F2_001_EMPTY_LISTA_UNIFICADA_ISEMPTY.md`
- `docs/ops/proposals/PROPOSAL_SEARCH_POIS_LANDMARKS_IN_LIST.md` (Fase 2)

---

#### OL-WOW-F2-002 — Ranking explicable (micro-señales)
**Estado:** ACTIVO

**DoD / AC**
- Señales discretas de porqué del resultado (`cerca`, `guardado`, `landmark`).
- Sin sobrecargar UI ni romper jerarquía visual.

**Pruebas mínimas**
- QA cualitativa: comprensión del ranking en primera lectura.

**Dependencia**
- `OL-WOW-F2-001`.

#### OL-WOW-F2-003 — Filtros como vistas de trabajo
**Estado:** CERRADO

**DoD / AC**
- `Todos/Por visitar/Visitados` comunicados como intención, no switch técnico.
- Pending-first navigation estable y predecible.

**Pruebas mínimas**
- Smoke: cambio de filtro conserva contexto útil y evita desorientación.

**Dependencia**
- `OL-WOW-F2-001`.

**Referencia**
- Bitácora `209`.

#### OL-WOW-F2-004 — Sheet intent model (`peek/medium/expanded`)
**Estado:** ACTIVO

**DoD / AC**
- Cada estado tiene objetivo explícito (awareness/decision/detail).
- CTA principal contextual visible en `medium`.

**Pruebas mínimas**
- QA de recorrido: menos cambios manuales de estado por confusión.

**Dependencia**
- `OL-WOW-F2-003`.

#### OL-WOW-F2-005 — Cámara/foco por intención (`discover/inspect/act`) con mini QA secuencial
**Estado:** CERRADO

**DoD / AC**
- Definir comportamiento determinista por modo:
  - `discover`: estabilidad de viewport, sin auto-movimientos agresivos.
  - `inspect`: centrar selección solo si no está legible/visible.
  - `act`: congelar recuadres automáticos durante la acción principal.
- Anti-jitter explícito: prohibido encadenar `flyTo + fitBounds` para el mismo evento.
- Cada modo se implementa y valida por separado (no bundle).

**Pruebas mínimas**
- Mini QA 1: `discover` (accept/reject UX).
- Mini QA 2: `inspect` (accept/reject UX).
- Mini QA 3: `act` (accept/reject UX).
- Si un mini QA falla, se revierte ese modo y no se avanza al siguiente.

**Dependencia**
- `OL-WOW-F2-004`.

### Gate Fase 2
**Criterio de paso**
- `OL-WOW-F2-001..005` cerrados + mejora percibida de claridad y decisión en QA.

---

### Fase 3 — Escala Operativa y Producto Vivo

#### OL-WOW-F3-001 — Extracción progresiva a runtime modular
**Estado:** ACTIVO (BLOQUEADO POR GATE F2)

**DoD / AC**
- Dominio Explore separado en módulos puros (`state/intents/reducer/invariants`).
- Reducción tangible de acoplamiento en contenedores críticos.

**Pruebas mínimas**
- Smoke de regresión transversal mapa/search/sheet.

**Dependencia**
- Gate Fase 2.

#### OL-WOW-F3-002 — Activity Summary Fase B/C (países confiables + interacciones)
**Estado:** ACTIVO (BLOQUEADO POR GATE F2)

**DoD / AC**
- `visitedCountriesCount` habilitado solo con fuente canónica confiable.
- Interacción tap en métrica abre vista filtrada correspondiente (si aplica C).

**Pruebas mínimas**
- QA de calidad de datos de país (no mostrar conteos dudosos).

**Dependencia**
- `OL-WOW-F1-004` y Gate Fase 2.

#### OL-WOW-F3-003 — Observabilidad mínima de decisiones UX
**Estado:** ACTIVO (BLOQUEADO POR GATE F2)

**DoD / AC**
- Eventos mínimos para medir tiempo a decisión y claridad de selección.
- Sin sobreinstrumentación ni impacto de performance.

**Pruebas mínimas**
- Validación de payloads y costo de logging en recorridos base.

**Dependencia**
- `OL-WOW-F3-001`.

### Gate Fase 3
**Criterio de cierre**
- Arquitectura y UX escalan con menor tasa de regresión y ciclos de entrega más predecibles.

---

### OL-P3-001 — Web sheets `max-width: 720px` + alineación derecha (postergado)

**Estado:** ACTIVO (prioridad baja; no ejecutar ahora)

**DoD / AC (cuando se retome)**
- Sheets web con `max-width: 720px`.
- Alineación derecha con gutter consistente.
- Sin regresión en backdrop/interacción mapa/breakpoints.

---

### OL-P3-002 — Países interactivo + mapa mundial shareable (postergado)

**Estado:** ACTIVO (POSTERGADO)

**DoD / AC (cuando se retome)**
- El círculo de países en mapa pasa a accionable (selected en tap).
- Tap abre vista/mapa mundial por filtro activo (`saved/visited`).
- Generación de composición imagen para compartir en redes.
- Sin duplicar métricas ya visibles en filtros (`visitados`/`pendientes`).

---

## Postergados estratégicos (no ejecutar ahora)

### OL-P0-002 — Create Spot canónico
**Estado:** ACTIVO (POSTERGADO)

### OL-P1-003 — System Status Bar
**Estado:** ACTIVO (POSTERGADO)

### OL-P1-006 — Migración POI DB (maki/categorías)
**Estado:** ACTIVO (POSTERGADO)

### OL-P1-007 — Pipeline turístico sin Google
**Estado:** ACTIVO (POSTERGADO)

---

## Cierres recientes (trazabilidad)

- `OL-WOW-F2-003`: ver bitácora `209`.
- `OL-WOW-F1-002`, `OL-WOW-F1-004`, `OL-P2-001`, `OL-P2-003`: ver bitácoras 201–205.
- `OL-P0-004`, `OL-P1-004`, `OL-P1-008`, `OL-P1-009`, `OL-P1-010`, `OL-P1-011`, `OL-P1-012`, `OL-P1-002`, `OL-P2-007`, `OL-P2-008`: ver bitácoras 143–190 y cierres de sesión 2026-02-26.
