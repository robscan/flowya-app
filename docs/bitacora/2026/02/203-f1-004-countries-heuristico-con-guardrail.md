# 203 — F1-004 países visitados heurístico con guardrail

Fecha: 2026-02-27  
Tipo: ajuste de métricas / Activity Summary

## Contexto
Tras implementar Fase A, se observó que `Países visitados` aparecía en `—` de forma constante, lo que reducía valor percibido del resumen.

## Cambios
- `components/explorar/MapScreenVNext.tsx`
  - Se agrega cálculo heurístico de `visitedCountriesCount` a partir de `spot.address`:
    - toma el último token de la dirección (segmento país esperado),
    - normaliza y filtra tokens inválidos/no-país,
    - deduplica por texto normalizado.
  - Se aplica guardrail de calidad:
    - si cobertura de país en spots visitados < umbral mínimo, retorna `null` y UI muestra `—`.

- `docs/contracts/ACTIVITY_SUMMARY.md`
  - Se documenta que `visitedCountriesCount` opera con heurística inicial + fallback por calidad insuficiente.

- `docs/ops/OPEN_LOOPS.md`
  - Se actualiza avance de `OL-WOW-F1-004` con estado heurístico de países y guardrail.

## Resultado
- Cuando hay direcciones suficientemente completas, `Países visitados` deja de estar vacío.
- Se mantiene protección contra datos engañosos en escenarios de baja cobertura/calidad.
