# Bitácora 311 (2026/03) — Fix regresión tag filter desde chip en SpotSheet (PR #108)

## Contexto
Tras el rollout de etiquetas en Explore (bitácora 310), se detectó una regresión en el flujo:
- tocar un chip de etiqueta en `SpotSheet` debía abrir búsqueda en `Todos` filtrada por esa etiqueta,
- pero el filtro por etiqueta se limpiaba inmediatamente al cambiar `pinFilter`.

## Evidencia concreta
- Commit origen de regresión: `11befcbc8da35cc9da44547853c37ca4af8f8a1b`.
- Archivo afectado: `components/explorar/MapScreenVNext.tsx`.
- Interacción problemática:
  - `handleSheetTagChipPress` hace `setPinFilter("all")` y `setSelectedTagFilterId(tagId)`.
  - un `useEffect` de cambio de `pinFilter` hacía `setSelectedTagFilterId(null)` y anulaba el filtro recién aplicado.

## Ajuste mínimo aplicado
- Se removió la limpieza automática de `selectedTagFilterId` en el efecto de cambio de `pinFilter`.
- Se conserva solo el cierre de modo edición (`setTagFilterEditMode(false)`).

## Entrega Git
- Commit: `41168b473afc7a5fd7cfc91df240f3417b28b726`
- PR: [#108](https://github.com/robscan/flowya-app/pull/108)
- Merge (squash) en `main`: `cd720227dd12f402938975abc28655664d3e437a`

## Alcance y riesgo
- Cambio de 1 línea (delete).
- Sin refactor ni cambios de contrato.
- Riesgo bajo: corrige consistencia del flujo chip->filtro sin alterar query/search strategy.
