# 153 — Filtros `Por visitar`/`Visitados`: reencuadre cíclico al alternar

Fecha: 2026-02-25

## Contexto

Se definió regla UX para mapa/search:

- Si usuario alterna entre `Por visitar` y `Visitados`, el encuadre debe actualizarse para mostrar el conjunto completo del filtro destino.
- Se mantiene la regla previa: si no hay pines visibles en viewport para el filtro seleccionado, reencuadrar a todos los del filtro.
- Con zoom manual intermedio, el ciclo debe mantenerse (sin falsos vacíos).

## Implementación

Archivo:

- `components/explorar/MapScreenVNext.tsx`

Cambio:

1. En `handlePinFilterChange` se detecta `cross-toggle` entre `saved` y `visited`.
2. Cuando el cambio es `saved <-> visited`, se fuerza reencuadre al conjunto completo destino (flyTo si 1, fitBounds si varios), aunque exista algún pin visible.
3. Para el resto de casos se conserva criterio anterior: solo reencuadrar cuando no hay pines visibles del filtro destino.

## Resultado esperado

- Alternancia `Por visitar` <-> `Visitados` produce encuadre consistente y predecible (ciclo QA).
- Si usuario hace zoom y luego cambia a un filtro sin visibles, el mapa reencuadra para mostrar todos los del filtro.

## Validación mínima

- `npm run lint` OK.

