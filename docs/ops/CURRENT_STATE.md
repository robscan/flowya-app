# CURRENT_STATE — Flowya (operativo)

> **Fuente de verdad para saber “en dónde estamos hoy”**.  
> Se actualiza al cierre de cada sesión (Cursor).

## Ahora mismo

- **Scope activo:** Sprint 1 / MS2 — Search V2 doc alignment (OL-004). Foco en alinear documentación con código.
- **Branch activa:** `main`. PR abierto: `chore/search-v2-doc-alignment` (alineación de `docs/definitions/search/SEARCH_V2.md` + .cursor/ ignore).
- **Commit / tag de referencia:** último en main (fix prod + chore ops). PR de docs en rama separada.
- **Entorno afectado:** web mobile (prod Vercel desde `main`).
- **Sólido:** Prod estable. Regla commits-completos activa. Search V2 (S1–S5 + fixes 036–038, 040) en main.
- **Frágil:** SEARCH_V2.md desalineado hasta que se mergee el PR de doc alignment.
- **Next step (1 línea):** Merge del PR `chore/search-v2-doc-alignment` y cierre de OL-004 si el doc queda alineado con el comportamiento actual de Search V2.

## Qué está *cerrado* hoy (DoD cumplido)

- Fix prod: `resolvePlaceForCreate` y `bboxFilter` en main; búsqueda "Sagrada" y CTA Crear operativos en prod.
- Bitácoras 028–041 en main; contratos DATA_MODEL_CURRENT y PROFILE_AUTH_CONTRACT_CURRENT generados (prompts 4.4 y 4.5).
- Regla de commits completos y bitácora 041 (prevención commits parciales) creadas y documentadas.
- OL-001 (estado operativo vacío) cerrado con CURRENT_STATE + OPEN_LOOPS restaurados.

## Qué está *abierto* hoy (bloquea cierre)

- OL-004: SEARCH_V2.md desalineado — en PR `chore/search-v2-doc-alignment`; pendiente merge y cierre del loop.
- Gates para Flow y para Recordar no documentados (OL-002, OL-003).

## Riesgos / Alertas

- Cualquier cambio multi-archivo que no siga la regla “commits completos” puede volver a dejar prod con imports rotos.
- Si no se actualiza OPEN_LOOPS al cerrar sesión, los pendientes vuelven a vivir solo en la mente.

## Próximo paso recomendado (1 solo)

Hacer merge del PR `chore/search-v2-doc-alignment`; verificar que SEARCH_V2.md en main refleje el comportamiento actual; marcar OL-004 como DONE con evidencia (link al PR).

## Cómo validar (QA mínimo)

- CURRENT_STATE: sin placeholders en “Ahora mismo”; scope/branch/PR/next step coherentes con el repo.
- OPEN_LOOPS: snapshot con referencia al PR de OL-004; OL-004 con estado y evidencia actualizados.
