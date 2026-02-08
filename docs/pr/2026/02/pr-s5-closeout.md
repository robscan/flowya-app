# Copiar en GitHub al crear el PR (base: main)

## Título del PR

```
chore(search-v2): S5 cleanup controlled closeout
```

## Cuerpo del PR (Description)

```markdown
## Qué se limpió

- **Legacy removido:** Función `resolvePlace` en `lib/mapbox-geocoding.ts` (exportada pero no usada). Se mantienen `resolvePlaceForCreate`, `ResolvedPlace` y `ResolvePlaceForCreateOptions`, usados por el CTA Crear en Map Search.

## Confirmación

- Sin flags: no existe `SEARCH_V2_ENABLED` ni `constants/flags.ts`.
- Sin legacy search en `app/(tabs)/index.web.tsx`: solo rama V2 (`useSearchControllerV2`, `SearchInputV2`, `SearchResultsListV2`, `createSpotsStrategy`).

## QA

- Resultados y checklist en [bitácora 035](docs/bitacora/2026/02/035-search-v2-s5-ejecucion-controlada.md) (QA mínimo ejecutado, resultado anotado).

## Build / Lint

- Build OK.
- Lint OK (sin errores nuevos en módulos de search).

## Checklist

- [x] QA table completada en 035
- [x] build OK
- [x] lint OK (sin errores nuevos de search)
```
