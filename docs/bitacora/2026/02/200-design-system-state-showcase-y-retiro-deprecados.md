# 200 — Design System state showcase + retiro deprecados

Fecha: 2026-02-27  
Tipo: UI / limpieza estructural

## Objetivo
Hacer visible la matriz de estados en `/design-system` y retirar código legacy deprecado del runtime.

## Cambios
- `app/design-system.web.tsx`
  - Nueva sección **Matriz de estados (F1-002)** con ejemplos explícitos:
    - `IconButton`: default/selected/loading/disabled.
    - `ButtonPrimary/ButtonSecondary`: default/loading/disabled.
    - `SearchListCard`: default/selected/disabled.
  - Eliminadas secciones legacy de placeholder deprecado y bloque de retiro.

- Retiro de deprecados del código:
  - Eliminado `components/explorar/MapScreenV0.tsx`
  - Eliminado `app/mapaV0.tsx`
  - Eliminado `app/mapaV0.web.tsx`
  - Eliminado `components/design-system/map-ui.tsx`
  - `components/design-system/index.ts`: removido export `MapUIShowcase`
  - `app/_layout.tsx`: removida ruta `mapaV0`

- Documentación:
  - `docs/contracts/DESIGN_SYSTEM_USAGE.md`: sección de deprecación actualizada a retiro efectivo.
  - `docs/ops/OPEN_LOOPS.md`: avance de F1-002 actualizado con showcase + retiro.

## Verificación
- `npm run lint` => OK.

## Resultado
- `/design-system` ahora sirve para validar estados interactivos de forma directa.
- El código legacy marcado como deprecado salió del runtime activo.
