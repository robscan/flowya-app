# BRANCHING_RULES — scopes ↔ branches ↔ bitácora ↔ PR

## Objetivo
Mantener trazabilidad simple sin perder cambios.

## Convenciones

### Branch
- `chore/<area>-<scope>` para limpieza/refactor
- `feat/<area>-<scope>` para features
- `fix/<area>-<scope>` para bugs
Ejemplos:
- `feat/search-v2-s6-create-spot`
- `chore/search-v2-s5-cleanup`
- `fix/mapbox-label-pixelation`

### Bitácora
Nombre recomendado:
`NNN-<area>-<scope>-<resumen>.md`
Ejemplos:
- `042-search-v2-s6-create-spot-overlay.md`

Incluye siempre:
- Branch y commit
- Qué se hizo
- Qué falta para cerrar
- QA mínimo + resultados

### PR card (docs/pr)
Debe incluir el link al PR + link a bitácoras relacionadas.

## Regla: 1 sesión = 1 micro-scope
Evita “commits parciales” y pérdidas de cambios.
