# 145 — Create-from-POI sin bloqueo por anti-duplicado

Fecha: 2026-02-25

## Contexto

QA reportó fricción en modo planificación: al seleccionar un POI explícito (mapa/search), la regla anti-duplicados bloqueaba inserción y mostraba modal, aunque el usuario no percibe creación manual.

## Cambio aplicado

En `MapScreenVNext`:

1. `handleCreateSpotFromPoi` ya no ejecuta bloqueo por `checkDuplicateSpot`.
2. `handleCreateSpotFromPoiAndShare` ya no ejecuta bloqueo por `checkDuplicateSpot`.
3. Se mantiene sin cambios el bloqueo anti-duplicado en creación manual/draft (`handleCreateSpotFromDraft`).

## Resultado esperado

- Selección explícita de POI crea spot sin interrupción por duplicado.
- Creación manual sigue protegida por guardrail anti-duplicado.

## Estado

- Implementación técnica: completada.
- Validación pendiente: smoke QA de `OL-P1-009` para confirmar:
  - POI explícito no bloquea;
  - draft/manual sí bloquea cuando corresponde.
