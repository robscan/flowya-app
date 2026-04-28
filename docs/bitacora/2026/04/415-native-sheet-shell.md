# 415 — Native Sheet Shell

**Fecha:** 2026-04-28
**Rama:** `codex/native-sheet-shell-046`
**OL relacionado:** `OL-GLOBAL-SHELL-SEARCH-001`, `OL-EXPLORE-SHEETS-CANON-001`

## Contexto

Tras extraer `NativeExploreSearchSheet`, `NativeGeoSheet` y `NativeSpotSheet`, las tres superficies aún duplicaban modal, scrim, safe-area, bordes y sombras. Para sostener calidad UI y escalar a fichas más ricas, hacía falta un shell compartido.

## Alcance aplicado

- Se agrega `NativeSheetShell`.
- `NativeExploreSearchSheet` usa el shell con `keyboardAvoiding`.
- `NativeGeoSheet` y `NativeSpotSheet` usan el mismo shell base.
- Se elimina duplicación de `Modal`, backdrop, safe-area, borde y sombra.

## Alcance excluido

- No cambia DB, RLS, Storage ni migraciones.
- No cambia web.
- No agrega contenido nuevo ni acciones nuevas.
- No implementa Liquid Glass todavía; deja un punto único para esa evolución.

## Riesgos y mitigación

- Riesgo: regresión visual por extracción de contenedor. Mitigación: shell conserva valores previos y se verifica con typecheck/regresión.
- Riesgo: Search necesita evitar teclado. Mitigación: `NativeSheetShell` soporta `keyboardAvoiding` solo cuando la sheet lo pide.

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

Profundizar `NativeGeoSheet` sobre este shell:

- bloques de información por progressive disclosure;
- copy claro y no manipulador;
- jerarquía país/región/ciudad;
- placeholders editoriales preparados para modelo batch-first.
