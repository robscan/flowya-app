# 412 — Native geo runtime foundation

**Fecha:** 2026-04-28
**Rama:** `codex/geo-runtime-foundation-043`
**OL relacionado:** `OL-DATA-MODEL-INTROSPECTION-001`, `OL-GLOBAL-SHELL-SEARCH-001`, `OL-GEO-CANON-001`

## Contexto

Tras aplicar/verificar `040`, `041` y `042`, Flowya ya tiene identidad geo canónica y relación usuario→geo. El riesgo principal era seguir creando países/regiones/ciudades como `spots`, generando duplicados y bloqueando fichas territoriales robustas.

## Alcance aplicado

- Se agrega runtime geo en `lib/geo/`:
  - tipos para `GeoSearchResult`;
  - scoring local para entidades geo + aliases;
  - parsing defensivo de `bbox`;
  - lectura best-effort de `geo_*`;
  - upsert idempotente a `user_geo_marks`.
- En iOS/Android `NativeExploreMapScreen`:
  - Search consulta países/regiones/ciudades oficiales;
  - tap de resultado enfoca el mapa por bbox/centroide;
  - GeoSheet mínimo permite `Por visitar` / `Visitado`;
  - guardar escribe en `user_geo_marks`, no en `spots`;
  - se retira el contador de lugares disponibles del pill nativo para no sugerir que el mapa es limitado.

## Alcance excluido

- No se cambia DB, RLS, Storage ni migraciones.
- No se hace backfill desde `spots`.
- No se conectan POIs externos a esta ficha.
- No se adapta web en este PR.
- No se crea país/región/ciudad como `spots`.

## Riesgos y decisión

- Se acepta que web pueda requerir adaptación posterior si se conecta a geo runtime, pero este PR no cambia `index.web.tsx` ni `MapScreenVNext`.
- El runtime lee todas las entidades activas y filtra localmente. Es correcto para seed mínimo; cuando haya seed amplio debe migrar a query indexada por alias/RPC.
- `user_geo_marks.entity_id` sigue siendo polimórfico por contrato; runtime valida `entityType` y DB aplica RLS owner-only.

## Ajustes pendientes web

- Integrar `GeoSearchResult` en `SearchFloating`/`MapScreenVNext` sin usar heurística de `Spot` basada en `title + latitude`.
- Prefijar keys mixtas (`geo:country:id`, `spot:id`, `place:coords`) para evitar colisiones.
- Definir GeoSheet web con progressive disclosure antes de añadir CTAs de guardado.
- Separar métricas de resultados geo vs spots vs externos.

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

No requiere rollback DB porque no hay cambios de esquema ni datos automáticos. Si algún usuario ya guardó marcas geo, mantener `user_geo_marks`; no borrar datos de usuario.

## Próximo paso recomendado

Validar en iOS Simulator:

- abrir Search;
- buscar `mexico`, `holbox`, `quintana`;
- seleccionar resultado;
- confirmar enfoque de mapa y GeoSheet;
- guardar como `Por visitar` / `Visitado` con usuario autenticado.

Después, decidir si el siguiente PR adapta web o profundiza GeoSheet nativa con contenido útil de viaje.
