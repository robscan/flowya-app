# Runtime Audit — map/filter/controls/search

**Fecha:** 2026-02-26
**Rol aplicado:** consultoría UX + arquitectura (enfoque estabilidad operativa)

## Resultado ejecutivo

El runtime funciona, pero la estabilidad futura está comprometida por exceso de orquestación en pantalla y reglas críticas distribuidas entre UI/adapters sin una máquina de estado explícita.

## Hallazgos críticos

1. **Orquestador monolítico en Explore**
- Evidencia: `components/explorar/MapScreenVNext.tsx` (>2500 líneas).
- Riesgo: regresiones cruzadas (mapa/sheet/search/filtros) y difícil testeo por dominio.

2. **Reglas core no encapsuladas como dominio puro**
- Evidencia: transición cross-filter, pending badges y reencuadre diferido viven en handlers de pantalla.
- Riesgo: discrepancia entre contrato (`*_RUNTIME_RULES`) e implementación real.

3. **Duplicación web/native en Search overlay**
- Evidencia: `SearchOverlayWeb.tsx` y `SearchFloatingNative.tsx` replican estructura y ramas de estado.
- Riesgo: drift funcional (un bug se corrige en una plataforma y reaparece en otra).

4. **Acoplamiento UI+IO en pantalla principal**
- Evidencia: fetch/auth/persistencia local/taps de mapa/acciones de sheet conviven en el mismo contenedor.
- Riesgo: alta fricción para cambios y baja observabilidad de fallos.

5. **Contratos sin matriz de invariantes verificables**
- Evidencia: contratos describen reglas, pero no existe set mínimo de invariantes ejecutables o smoke tests automatizados.
- Riesgo: QA manual permanente y regresiones silenciosas.

6. **POI seleccionado sin estado visual inequívoco (default vs selected)**
- Evidencia: POI Mapbox en estado `default` puede verse igual seleccionado y no seleccionado.
- Riesgo: falta de feedback del sistema y pérdida de confianza en la interacción de mapa.
- Estado: resuelto en runtime (`components/explorar/MapCoreView.tsx`, bitácora 181); mantener como invariante para no regresionar.

## Huecos de definición

- Falta un **state chart único** para Explore runtime: selección, search open/close, sheet state, focus map.
- Falta **tabla de eventos canónica** (evento -> precondición -> transición -> efectos).
- Falta límite explícito de responsabilidades por módulo (qué no puede vivir en pantalla).

## Propuestas concretas (priorizadas)

### P0 — Reducer runtime canónico (sin cambiar UX)
- Crear `core/explore/runtime/` con:
  - `state.ts` (estado mínimo),
  - `intents.ts` (eventos),
  - `reducer.ts` (transiciones puras),
  - `invariants.ts` (asserts de desarrollo).
- Dejar `MapScreenVNext` como adapter/orquestador visual.

### P0 — Unificar Search Surface
- Extraer layout compartido de `SearchOverlayWeb` y `SearchFloatingNative` a `SearchSurface`.
- Mantener solo adapters por plataforma (container + gesture/body lock).
- Objetivo: 1 árbol de render para estados `isEmpty/isPreSearch/isSearch/isNoResults`.

### P1 — Extraer reglas de filtros/pending/reframe a dominio puro
- Mover a `core/explore/runtime/filterRules.ts` y `mapRules.ts`:
  - `reducePendingBadges`
  - `resolveCrossFilterTransition`
  - `shouldReframeToAll`
- La UI solo despacha intents y consume estado derivado.

### P1 — Presupuesto de complejidad por archivo
- Guardrail operativo:
  - Screen/container: max 400 líneas.
  - Componente DS: max 300 líneas.
  - si excede: split obligatorio por dominio.

### P1 — Contrato explícito de estilo para POI seleccionado
- Definir `selected` como estado visual independiente de `pinStatus`.
- Regla: `selected` siempre debe alterar jerarquía visual (escala/contorno/opacidad), incluso si `pinStatus=default`.
- Alinear `MapCoreView` + representación de POI externo con `MAP_PINS_CONTRACT`.

### P2 — Invariantes y smoke automatizado
- Crear suite mínima de invariantes:
  - `search open => spot sheet oculta`
  - `pinFilter saved => color unificado saved`
  - `cross-filter status change => sheet=medium y foco retenido`
  - `poi selected (default) => render distinto a poi default no seleccionado`

## Cambios que recomiendo descartar

- Seguir agregando reglas en `MapScreenVNext` sin separar dominio.
- Mantener dos implementaciones de Search UI con copy-paste lógico.
- Introducir nuevas variantes visuales de filtros/cards sin cerrar inventario canónico.

## Plan de ejecución sugerido (micro-scopes)

1. MS-R1: crear reducer runtime + tipos + invariantes (sin conectar UI).
2. MS-R2: conectar filtros/pending/reframe al reducer.
3. MS-R3: introducir `SearchSurface` y reducir duplicación web/native.
4. MS-R4: smoke tests/invariantes y limpieza de código muerto.
