# 201 — F1-003 naming canónico `ListView` + `ResultRow` (cerrado)

Fecha: 2026-02-27  
Tipo: design system / naming / migración segura

## Objetivo
Cerrar `OL-WOW-F1-003` adoptando naming DS canónico para listados sin romper compatibilidad.

## Cambios
- `components/search/SearchResultsListV2.tsx`
  - Se agrega alias canónico: `ListView`.
  - Se agrega alias de tipos: `ListViewProps<T>`.

- `components/design-system/search-list-card.tsx`
  - Se agrega alias canónico: `ResultRow`.
  - Se agrega alias de tipos: `ResultRowProps`.

- `components/search/index.ts`
  - Exports actualizados para exponer `ListView` + `ListViewProps`.

- `components/design-system/index.ts`
  - Exports actualizados para exponer `ResultRow` + `ResultRowProps`.

- Runtime Search actualizado a naming canónico:
  - `components/search/SearchOverlayWeb.tsx`:
    - `SearchResultsListV2` -> `ListView`
    - `SearchListCard` -> `ResultRow`
  - `components/search/SearchFloatingNative.tsx`:
    - `SearchResultsListV2` -> `ListView`
    - `SearchListCard` -> `ResultRow`

- Contrato:
  - `docs/contracts/DESIGN_SYSTEM_USAGE.md` actualizado con estado de adopción.
  - `docs/ops/OPEN_LOOPS.md`: `OL-WOW-F1-003` marcado `CERRADO`.

## Verificación
- `npm run lint` => OK.

## Resultado
- Naming canónico queda adoptado en código y contratos.
- Alias legacy se mantienen para migración progresiva sin ruptura.
