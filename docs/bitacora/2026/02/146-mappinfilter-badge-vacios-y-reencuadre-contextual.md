# 146 — MapPinFilter: badge pendiente, vacíos deshabilitados y reencuadre contextual

Fecha: 2026-02-25

## Contexto

QA pidió reforzar UX de filtros en mapa:

- señal de "pendiente de lectura" cuando se cambia estado desde sheet estando en `Todos`;
- filtros sin resultados deshabilitados y sin contador;
- reencuadre solo cuando el filtro activo no tiene resultados visibles en viewport.

## Cambios aplicados

1. `MapPinFilter`:
   - agrega `pendingValue` para mostrar punto rojo en trigger (`Todos`) y opción destino en dropdown;
   - agrega `pulseNonce` para animar trigger aun sin cambio de valor;
   - opciones `Por visitar/Visitados` se deshabilitan cuando count=0;
   - counts de cero no se renderizan.
2. `MapScreenVNext`:
   - nuevo `handlePinFilterChange`:
     - limpia badge pendiente al cambiar filtro,
     - si filtro `saved/visited` no tiene resultados visibles en viewport, reencuadra al conjunto del filtro,
     - si sí hay visibles, mantiene cámara.
   - en `handleSavePin`:
     - si filtro actual es `Todos`, setea `pendingFilterBadge` al destino (`saved/visited`);
     - si filtro actual ya es el destino, dispara pulse contextual del filtro (sin badge).

## Estado

- Implementación técnica: completada.
- Pendiente QA: smoke de `OL-P1-011` (badge, vacíos, reencuadre con/sin visibles).
