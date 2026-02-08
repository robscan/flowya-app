# CURRENT_STATE — Flowya (operativo)

> **Fuente de verdad para saber “en dónde estamos hoy”**.  
> Se actualiza al cierre de cada sesión (Cursor).

## Ahora mismo

- **Scope activo:** Ops — siguiente micro-scope (p. ej. OL-005 contratos/bitácora index, o OL-002/OL-003 gates Flow/Recordar). OL-004 cerrado.
- **Branch activa:** `main`.
- **Commit / tag de referencia:** último en main (incl. merge de `chore/search-v2-doc-alignment` y `chore/ops-update-after-searchv2-docs`).
- **Entorno afectado:** web mobile (prod Vercel desde `main`).
- **Sólido:** Prod estable. Regla commits-completos activa. Search V2 (S1–S5 + fixes 036–038, 040) en main. SEARCH_V2.md alineado con código (OL-004 DONE).
- **Frágil:** Nada crítico; pendientes abiertos: OL-002, OL-003, OL-005.
- **Next step (1 línea):** Elegir 1 loop (OL-005, OL-002 u OL-003) y ejecutarlo con DoD; actualizar CURRENT_STATE y OPEN_LOOPS al cierre.

## Qué está *cerrado* hoy (DoD cumplido)

- Fix prod: `resolvePlaceForCreate` y `bboxFilter` en main; búsqueda "Sagrada" y CTA Crear operativos en prod.
- Bitácoras 028–041 en main; contratos DATA_MODEL_CURRENT y PROFILE_AUTH_CONTRACT_CURRENT generados (prompts 4.4 y 4.5).
- Regla de commits completos y bitácora 041 (prevención commits parciales) creadas y documentadas.
- OL-001 (estado operativo vacío) cerrado con CURRENT_STATE + OPEN_LOOPS restaurados.
- OL-004 (SEARCH_V2.md desalineado) cerrado; PRs `chore/search-v2-doc-alignment` y `chore/ops-update-after-searchv2-docs` mergeados en main.

## Qué está *abierto* hoy (bloquea cierre)

- OL-004 cerrado (PRs mergeados). Gates para Flow y para Recordar no documentados (OL-002, OL-003). OL-005: contratos/bitácora sin track en índice.

## Riesgos / Alertas

- Cualquier cambio multi-archivo que no siga la regla “commits completos” puede volver a dejar prod con imports rotos.
- Si no se actualiza OPEN_LOOPS al cerrar sesión, los pendientes vuelven a vivir solo en la mente.

## Próximo paso recomendado (1 solo)

Elegir 1 loop (OL-005, OL-002 u OL-003) y ejecutarlo con criterio de cierre; actualizar OPEN_LOOPS y CURRENT_STATE al cierre.

## Cómo validar (QA mínimo)

- CURRENT_STATE: sin placeholders en “Ahora mismo”; scope/branch/next step coherentes con el repo.
- OPEN_LOOPS: snapshot sin “PR abierto” ni “merge pendiente”; OL-004 DONE con evidencia (PRs mergeados).
