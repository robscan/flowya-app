# Design System Audit — Explore + Edit Spot

**Fecha:** 2026-02-26
**Objetivo:** unificar UX/estructura con dirección Apple Maps-like, reducir deuda y preparar eliminación de legacy.

## Resultado ejecutivo

El sistema actual tiene componentes útiles, pero también ruido histórico y duplicación de patrones visuales. La prioridad no es “agregar componentes”, sino consolidar un set mínimo estable y remover variantes paralelas.

## Hallazgos principales

1. **Catálogo DS mezcla runtime activo con histórico/demo**
- Evidencia: `/design-system` muestra scopes y placeholders fuera del foco actual.
- Riesgo: confusión de canon y proliferación de variantes.

2. **Duplicación de “row/card” en búsqueda y selección**
- Evidencia: `SpotCard`, `SearchResultCard`, `SearchListCard` cubren patrones similares con APIs distintas.
- Riesgo: inconsistencia de spacing/estados/acciones y mayor costo de mantenimiento.

3. **Edit Spot no consume suficientes primitivas DS**
- Evidencia: inputs/actions/layout definidos inline en `app/spot/edit/[id].web.tsx`.
- Riesgo: desalineación visual y técnica frente a Explore.

4. **Componentes placeholder sin valor productivo actual**
- Evidencia: `components/design-system/map-ui.tsx`.
- Riesgo: deuda documental y señales falsas sobre componentes “canónicos”.

## Propuesta de estructura canónica

### A) Primitivas base
- `IconButton`
- `SheetHandle`
- `SurfaceCard`
- `FormField` (label + input/textarea + helper/error)
- `ActionButton` (primary/secondary/destructive)
- `ListView` (infra de listados: scroll/secciones/paginación/keyboard-safe)
- `ResultRow` (elemento visual de listado)

### B) Bloques Explore
- `MapControlStack`
- `PinFilterControl` (dropdown + inline como variantes del mismo componente)
- `SearchBarShell`
- `ResultRow` (único row para resultados)
- `SpotSheet`

### C) Bloques Edit Spot
- `EditSpotForm`
- `CoverImageField`
- `LocationField` (map slot + action)
- `DangerZone`

## Propuestas concretas de reestructura

### P0
- Mantener separación lista/item y converger naming:
  - `SearchResultsListV2` -> `ListView` (infra).
  - `SearchListCard` + `SearchResultCard` -> `ResultRow` (item visual).
- Extraer `FormField` y `ActionButton` para eliminar estilos inline repetidos en Edit Spot.

### P0
- Definir contrato de estados cross-platform para primitivos:
  - `hover` web,
  - `pressed` web/mobile (misma intención visual),
  - `focus-visible` web,
  - `disabled/loading/selected`.
- Asegurar implementación con tokens light/dark, sin hardcodes.

### P1
- Reescribir `MapPinFilter` y `MapPinFilterInline` sobre una base común (`PinFilterBase`).
- Dejar solo adapters de presentación (dropdown / inline).

### P1
- Limitar showcase `/design-system` a componentes activos de Explore/Edit Spot.
- Mover ejemplos legacy a sección explícita “deprecado” con fecha objetivo de retiro.

### P2
- Ejecutar cleanup de deprecados:
  - `MapScreenV0`, `mapaV0` routes, `map-ui.tsx` placeholder.
- Quitar exports y referencias tras smoke test.

## Candidatos deprecados (pre-eliminación)

- `components/explorar/MapScreenV0.tsx`
- `app/mapaV0.tsx`
- `app/mapaV0.web.tsx`
- `components/design-system/map-ui.tsx`

## Criterios de aceptación

- Un único patrón de `ResultRow` y un único `ListView` canónico para listados.
- Edit Spot sin estilos inline repetidos para botones/fields críticos.
- `/design-system` separado por: Activo vs Deprecado.
- Lista de deprecación con reemplazo y plan de retiro.
