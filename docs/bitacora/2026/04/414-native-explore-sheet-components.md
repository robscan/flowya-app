# 414 — Native Explore sheet components

**Fecha:** 2026-04-28
**Rama:** `codex/native-explore-sheets-components-045`
**OL relacionado:** `OL-GLOBAL-SHELL-SEARCH-001`, `OL-EXPLORE-SHEETS-CANON-001`

## Contexto

Tras conectar Search nativo a geo + spots, `NativeExploreMapScreen` empezó a concentrar mapa, búsqueda, GeoSheet, SpotSheet, estilos y estado. Antes de profundizar fichas o acciones, convenía separar responsabilidades para proteger calidad UI y velocidad operativa.

## Alcance aplicado

- `NativeExploreMapScreen` queda como orquestador de mapa, carga de spots, selección y navegación.
- Se extraen componentes nativos:
  - `NativeExploreSearchSheet`;
  - `NativeGeoSheet`;
  - `NativeSpotSheet`.
- Se agrega `lib/geo/display.ts` para display compartido de tipo geo.
- Se eliminan estilos de sheets del mapa principal.

## Alcance excluido

- No cambia DB, RLS, Storage ni migraciones.
- No cambia web.
- No agrega contenido nuevo a GeoSheet.
- No convierte SpotSheet nativo en ficha completa todavía.
- No altera persistencia ni contratos de geo/spots.

## Riesgos y mitigación

- Riesgo principal: regresión visual por refactor. Mitigación: extracción sin cambiar props ni flujo, con typecheck/regresión.
- La duplicación de estilos entre sheets sigue existiendo de forma controlada; se deberá consolidar en un `NativeSheetShell` cuando haya una tercera iteración de layout o nuevas variantes.

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

Profundizar `NativeGeoSheet` con progressive disclosure V1:

- identidad y jerarquía geo;
- estado del usuario (`Por visitar` / `Visitado`);
- bloque inicial de planeación sin meter visa/salud/transporte/clima en `spots`;
- preparar futuro consumo batch-first desde `geo_*`/tablas editoriales.
