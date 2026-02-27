# 202 — F1-004 Activity Summary Fase A implementada

Fecha: 2026-02-27  
Tipo: implementación runtime / métricas UX

## Objetivo
Implementar `OL-WOW-F1-004` Fase A con métricas visibles de actividad sin polling agresivo y con guardrail de auth.

## Cambios
- Nuevo componente DS:
  - `components/design-system/activity-summary.tsx`
  - Muestra 3 métricas compactas:
    - `Países visitados`
    - `Lugares visitados`
    - `Pendientes`
  - Estado parcial para países (`—`) cuando el valor es `null`.

- Integración runtime Search:
  - `components/search/types.ts`: nuevo prop `activitySummary`.
  - `components/search/SearchOverlayWeb.tsx`: render de `ActivitySummary` bajo el input.
  - `components/search/SearchFloatingNative.tsx`: render de `ActivitySummary` bajo el input.

- Conexión de datos en Explore:
  - `components/explorar/MapScreenVNext.tsx`:
    - `visitedPlacesCount` = `pinCounts.visited`
    - `pendingPlacesCount` = `pinCounts.saved`
    - `visitedCountriesCount` = `null`
    - Visibilidad: solo si `isAuthUser === true`.

- Exports DS:
  - `components/design-system/index.ts`: se agrega export de `ActivitySummary`.

- Contratos y operación:
  - `docs/contracts/ACTIVITY_SUMMARY.md`: estado actualizado a activo con Fase A implementada.
  - `docs/ops/OPEN_LOOPS.md`: `OL-WOW-F1-004` pasa a `EN VALIDACIÓN QA`.

## Verificación
- `npm run lint` => OK.

## Resultado
- Métricas de actividad visibles para usuario autenticado en Search (web/native).
- Actualización reactiva por cambios de pin (sin polling).
- `visitedCountriesCount` permanece bloqueado hasta fuente confiable (Fase B).
