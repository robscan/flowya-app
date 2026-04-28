# 403 — Contrato geo identity + deduplicacion V1

**Fecha:** 2026-04-28
**Tipo:** contrato / arquitectura de datos / producto

## Contexto

Tras activar el shell nativo V1, el siguiente bloqueo real es conectar Search y GeoSheets sin repetir el problema de duplicados. Producto reporto que paises guardados pueden volver a seleccionarse y recrearse, y pidio una arquitectura que identifique sin dudas pais, ciudad y region oficial.

## Diagnostico

- `DATA_MODEL_CURRENT.md` confirma que `spots` no tiene campos geo ni tablas territoriales.
- El Master Plan ya declara que paises, regiones y ciudades no son `spots`.
- El plan de datos 2026-04-26 aun listaba `country_code`, `region_code` y `city_name` como candidatos en `spots`, lo cual podia interpretarse como fuente de verdad territorial.
- Search actual tiene guardrails contra crear desde texto, pero faltaba prohibicion explicita de crear geo como spot.

## Decision

Se crea [`GEO_IDENTITY_DEDUP_V1.md`](../../../contracts/GEO_IDENTITY_DEDUP_V1.md) como contrato canonico:

- `geo_countries`, `geo_regions`, `geo_cities` y opcionalmente `geo_areas` son la identidad territorial.
- `geo_aliases` y `geo_external_refs` permiten busqueda multidioma y dedupe por proveedor.
- `user_geo_marks` guarda la relacion usuario-geo; `pins` queda para usuario-spot.
- `spots` puede enlazar contexto territorial, pero no lo define.
- `coordinate_source` y `created_from` son campos validos para `spots`.
- `country_code`, `region_code` y `city_name` solo pueden ser cache derivado, no identidad primaria.

## Alcance

- Nuevo contrato geo/dedup V1.
- Actualizacion de `DATA_MODEL_CURRENT`.
- Actualizacion del plan data/media/geo.
- Actualizacion de `SEARCH_V2`.
- Actualizacion de Roadmap, Privacy/Data guardrails, README de definicion y `OPEN_LOOPS`.

## No tocado

- No DB.
- No migraciones.
- No RLS.
- No Storage.
- No seed de paises/ciudades.
- No Search runtime.
- No GeoSheet runtime.

## Riesgos

- Sobrediseno si se intenta construir todo el modelo geo antes de necesitarlo.
- Ambiguedad global por nombres repetidos.
- Cache divergente si `country_code/city_name` se usan como canon.
- Costo API si se resuelve todo en tiempo real.

## Mitigacion

- Fases: contrato -> prechecks -> tablas geo base -> enlaces spot-geo -> Search router.
- Seed inicial pequeno y reproducible.
- Batch/curacion primero; APIs como apoyo.
- Cache derivado solo despues de `geo_*`.
- No hard delete para resolver duplicados.

## Pruebas

Este PR es documental:

- `git diff --check`
- revision de enlaces/documentos editados
- no requiere `tsc`/build porque no toca runtime

## Rollback

Revertir el PR. No requiere rollback DB porque no aplica migraciones ni scripts.
