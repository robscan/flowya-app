# 402 — V1 native shell entry

**Fecha:** 2026-04-28
**Tipo:** implementacion / shell mobile-first

## Contexto

Producto aclaro que FLOWYA no busca imitar la web actual. La web aporta aprendizaje, evidencia y piezas rescatables, pero el target V1 debe reconstruirse como app mobile-first para tiendas.

Este bloque ejecuta el primer slice seguro de `OL-GLOBAL-SHELL-SEARCH-001` sin tocar contratos de datos ni persistencia.

## Alcance

- Activar bottom nav nativo con `Explore`, `Flow` y `Passport`.
- Mantener web sin tab bar visible.
- Agregar entry point de Account arriba izquierda sobre el mapa nativo.
- Agregar entry point de Search arriba derecha sobre el mapa nativo.
- Incluir un sheet nativo minimo de Search con input controlado.
- Crear placeholders nativos minimos para `Flow` y `Passport`.
- Corregir `supabaseFetch` para que `cache: 'no-store'` aplique solo en web; React Native expone `window` y ese guard provocaba query params invalidos contra PostgREST.

## Decision

Search queda conectado como entrada de shell, no como sistema de resultados.

La conexion real de resultados debe esperar contrato de entidades oficiales y deduplicacion geo/spot para evitar consolidar el mismo problema que provoco duplicados de paises, ciudades, regiones o POI.

## Contrato runtime

- `Explore` sigue usando `NativeExploreMapScreen` y `react-native-maps`.
- `Flow` y `Passport` existen como dominios navegables base, sin prometer funcionalidades.
- Account navega a `/account`, que conserva el estado nativo actual.
- Search abre/cierra un modal nativo y conserva query local.
- Supabase REST mantiene `no-store` en web y evita ese flag en iOS/Android.

## Riesgos

- `Flow` y `Passport` son intencionalmente placeholders; no deben leerse como features cerradas.
- Search sin resultados puede parecer incompleto si se valida fuera del contexto de shell V1.
- El modelo de resultados globales sigue bloqueado por `OL-DATA-MODEL-INTROSPECTION-001` y por el diseno de entidades geo oficiales.

## Pruebas

- `git diff --check`
- `npx tsc --noEmit`
- `npm run test:regression`
- `npm run build`
- iOS Simulator smoke para confirmar mapa visible, pins cargados, chrome nativo accesible, bottom nav visible y Search input operativo.

## Rollback

Revertir el commit del slice para volver al shell previo con una sola pestana oculta. No requiere migracion ni cleanup porque no toca DB, RLS, Storage ni dependencias.

## No tocado

- DB.
- RLS.
- Storage.
- Deduplicacion geo.
- Resultados reales de Search.
- Flujos productivos de Flow/Passport.
- Paridad con web actual.
