# 417 — Native geo mark clear

**Fecha:** 2026-04-28
**Rama:** `codex/native-geo-mark-clear-048`
**OL relacionado:** `OL-GLOBAL-SHELL-SEARCH-001`, `OL-DATA-MODEL-INTROSPECTION-001`

## Contexto

La GeoSheet nativa ya permitía marcar una entidad geo como `Por visitar` o `Visitado`, pero no permitía revertir esa decisión desde la misma ficha. Eso dejaba al usuario sin control completo sobre su estado personal.

## Alcance aplicado

- Se agrega `deleteUserGeoMark(entityType, entityId)`.
- `NativeGeoSheet` muestra `Quitar` cuando la entidad tiene marca activa.
- `NativeExploreMapScreen` actualiza `selectedGeo` y `geoResults` localmente después de quitar la marca.
- Mensajes de estado:
  - `Marca quitada.`
  - `Inicia sesión para actualizar.`
  - `No se pudo actualizar. Intenta de nuevo.`

## Alcance excluido

- No cambia DB, RLS, Storage ni migraciones.
- No cambia web.
- No toca `spots`, `pins` ni media.
- No hace cleanup automático ni hard delete de contenido.

## Riesgos y mitigación

- La acción borra una fila owner-only de `user_geo_marks`; es un cambio de estado explícito del usuario, no una operación administrativa ni cleanup masivo.
- RLS sigue limitando la operación a `auth.uid() = user_id`.
- La UI actualiza estado local para evitar duplicidad visual o stale state.

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

No requiere rollback DB. Si un usuario ya quitó una marca, ese cambio fue iniciado por el usuario; no reinsertar estado sin una acción explícita.

## Próximo paso recomendado

QA iOS Simulator con sesión autenticada:

- buscar `mexico` o `holbox`;
- marcar `Por visitar`;
- cerrar/abrir ficha y confirmar estado;
- tocar `Quitar`;
- confirmar que desaparece el badge en Search y que la ficha queda sin marca.
