# 395 — Guard runtime contra duplicados al crear POI

Fecha: 2026-04-27

## Contexto

Producto reporta que `Plaza Principal` en Holbox aparece repetida en el listado de `Visitados` aunque se agregó una sola vez.

Consulta remota de solo lectura a `spots` confirmó múltiples filas públicas con:

- mismo `title`: `Plaza Principal`;
- mismas coordenadas: `21.5237114970129`, `-87.3789118230343`;
- mismo `linked_place_id`: `2027633701`;
- creación concentrada entre `2026-04-19T03:06:00Z` y `2026-04-19T03:06:03Z`.

## Diagnóstico

El flujo de creación desde POI dependía de estado React (`poiSheetLoading` / busy) para bloquear interacciones, pero no tenía un candado sincrónico antes de los primeros `await`. Un doble/triple disparo rápido podía ejecutar varias persistencias concurrentes del mismo POI antes de que el primer insert estuviera disponible para el anti-duplicado.

## Cambio aplicado

- Se agrega lock runtime por `placeId` o, si no existe, por `name + lat/lng`.
- El lock cubre:
  - `Visitado` / `Por visitar` desde POI;
  - `Guardar y subir mis fotos`;
  - crear POI para compartir.
- El cambio es no destructivo y no modifica RLS ni Storage.

## Validación

- `npx tsc --noEmit`
- `npm run test:regression`
- `git diff --check`

## Seguimiento

El saneamiento de data existente se ejecuta después como micro-scope separado no destructivo; ver bitácora [`396`](396-spots-linked-exact-duplicate-cleanup.md).
