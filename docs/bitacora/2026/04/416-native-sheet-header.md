# 416 — Native Sheet Header

**Fecha:** 2026-04-28
**Rama:** `codex/native-sheet-header-047`
**OL relacionado:** `OL-GLOBAL-SHELL-SEARCH-001`, `OL-EXPLORE-SHEETS-CANON-001`

## Contexto

Después de crear `NativeSheetShell`, las sheets nativas aún repetían el mismo header: título, subtítulo, botón de cierre, icono y espaciado. Esa duplicación era pequeña, pero peligrosa para la consistencia visual antes de profundizar fichas.

## Alcance aplicado

- Se agrega `NativeSheetHeader`.
- `NativeExploreSearchSheet`, `NativeGeoSheet` y `NativeSpotSheet` usan el header compartido.
- Se corrige el sangrado JSX heredado del refactor anterior.

## Alcance excluido

- No cambia DB, RLS, Storage ni migraciones.
- No cambia web.
- No agrega contenido nuevo a GeoSheet/SpotSheet.
- No cambia persistencia, búsqueda ni navegación.

## Riesgos y mitigación

- Riesgo: regresión visual por sustitución de header. Mitigación: se conserva copy, tamaño de cierre y estructura; se valida con typecheck/regresión.

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

Con shell + header unificados, el siguiente bloque puede profundizar `NativeGeoSheet` con contenido progresivo y reglas UXW sin abrir deuda visual.
