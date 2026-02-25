# 149 — Search results: badge flotante para estados Por visitar / Visitado

Fecha: 2026-02-25

## Contexto

Se pidió mostrar estado de spot en cards de resultados para mejorar lectura rápida:

- `Por visitar`
- `Visitado`

sin recargar la card con texto adicional.

## Implementación

Archivos:

- `components/design-system/search-list-card.tsx`
- `components/design-system/search-result-card.tsx`

Cambio:

1. `SearchListCard` acepta `pinStatus` opcional (`default | to_visit | visited`).
2. Si el estado es `to_visit` o `visited`, renderiza badge flotante en esquina superior derecha.
   - `to_visit`: icono `Pin` + color `stateToVisit`.
   - `visited`: icono `CheckCircle` + color `stateSuccess`.
3. `SearchResultCard` pasa `spot.pinStatus` a `SearchListCard`.
4. Sin estado (`default`): no se renderiza badge.

## Criterio UX

- Badge informativo (no interactivo).
- Sin alterar layout principal de título/subtítulo.
- Consistente con tokens DS y tema actual.

## Estado

- Implementación técnica: completada.
- Validación técnica: `npm run lint` OK.
- Pendiente QA visual final en web/native.
