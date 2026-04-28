# 413 — Native Search geo + spots

**Fecha:** 2026-04-28
**Rama:** `codex/native-search-geo-spots-044`
**OL relacionado:** `OL-GLOBAL-SHELL-SEARCH-001`, `OL-DATA-MODEL-INTROSPECTION-001`

## Contexto

El primer runtime geo nativo ya permitía buscar entidades territoriales oficiales, pero Search aún no representaba el modelo map-first completo: el usuario debe poder explorar también los lugares concretos visibles/cargados del mapa sin que eso implique que el mapa está limitado a un conteo cerrado.

## Alcance aplicado

- Search nativo muestra resultados mixtos en secciones:
  - `Destinos oficiales`: países/regiones/ciudades desde `geo_*`;
  - `Lugares del mapa`: spots cargados en el mapa nativo.
- Se agrega búsqueda local parcial/acento-insensible para spots nativos.
- Tap en destino geo:
  - enfoca mapa;
  - abre GeoSheet;
  - guarda `Por visitar` / `Visitado` vía `user_geo_marks`.
- Tap en spot:
  - enfoca mapa;
  - abre sheet mínimo de lugar;
  - no crea ni muta datos.

## Alcance excluido

- No se toca DB, RLS, Storage ni migraciones.
- No se cambia web.
- No se agregan POIs externos ni Mapbox Search al runtime nativo.
- No se implementa SpotSheet nativo completo todavía.
- No se crean países/regiones/ciudades como `spots`.

## Riesgos y notas

- Los spots se buscan solo sobre el lote ya cargado (`SPOTS_LIMIT`). Es suficiente para el shell nativo inicial; el buscador global final debe consultar una fuente indexada/paginada.
- La sheet de spot nativa es deliberadamente mínima para no copiar deuda web ni fingir paridad.
- La separación visual `Destinos oficiales` / `Lugares del mapa` protege el modelo mental y reduce riesgo de duplicar geo como lugar.

## Verificación

```bash
npx tsc --noEmit
npm run test:regression
git diff --check
```

Resultado: todas pasan.

## Rollback

Rollback de código:

```bash
git revert <commit>
```

No requiere rollback DB.

## Próximo paso recomendado

QA iOS Simulator:

- buscar `mexico`, `holbox`, `principal`;
- confirmar que geo y spots se separan por sección;
- confirmar que spot enfoca mapa sin crear registro;
- confirmar que geo guarda estado con sesión autenticada.

Después, avanzar una de dos rutas:

- profundizar GeoSheet nativa con contenido territorial V1;
- o crear SpotSheet nativo mínimo real para spots guardados/visitados.
