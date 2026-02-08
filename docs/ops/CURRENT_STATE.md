# CURRENT_STATE — Flowya (operativo)

> **Fuente de verdad para saber “en dónde estamos hoy”**.  
> Se actualiza al cierre de cada sesión (Cursor).

## Ahora mismo

- **Scope activo:** Ops / retomabilidad — restablecer fuente de verdad (CURRENT_STATE + OPEN_LOOPS) sin tocar código de la app.
- **Branch activa:** `main`
- **Commit / tag de referencia:** `1057b84` (fix prod: resolvePlaceForCreate + bboxFilter). Tras este PR: commit del chore(ops).
- **Entorno afectado:** web mobile (prod Vercel desde `main`).
- **Sólido:** Prod alineado con local tras subir `lib/mapbox-geocoding.ts` y `lib/search/spotsStrategy.ts`. Regla `.cursor/rules/commits-completos-y-deploy.mdc` activa. Search V2 (S1–S5 + fixes 036–038, 040) en main.
- **Frágil:** OPEN_LOOPS y CURRENT_STATE estaban con placeholders; sin esto la retomabilidad depende de memoria.
- **Next step (1 línea):** Retomar mañana leyendo CURRENT_STATE + OPEN_LOOPS y eligiendo 1 loop o 1 micro-scope de la lista.

## Qué está *cerrado* hoy (DoD cumplido)

- Fix prod: `resolvePlaceForCreate` y `bboxFilter` en main; búsqueda "Sagrada" y CTA Crear operativos en prod.
- Bitácoras 028–041 en main; contratos DATA_MODEL_CURRENT y PROFILE_AUTH_CONTRACT_CURRENT generados (prompts 4.4 y 4.5).
- Regla de commits completos y bitácora 041 (prevención commits parciales) creadas y documentadas.

## Qué está *abierto* hoy (bloquea cierre)

- Estado operativo vacío como P0: hasta que CURRENT_STATE y OPEN_LOOPS estén llenos y consistentes, el proyecto no es plenamente retomable sin memoria.
- Gates para Flow y para Recordar no documentados (registrados como loops P2, no se abren las herramientas en este PR).

## Riesgos / Alertas

- Cualquier cambio multi-archivo que no siga la regla “commits completos” puede volver a dejar prod con imports rotos.
- Si no se actualiza OPEN_LOOPS al cerrar sesión, los pendientes vuelven a vivir solo en la mente.

## Próximo paso recomendado (1 solo)

Leer CURRENT_STATE y OPEN_LOOPS; elegir un loop (p. ej. OL-001 si queda abierto) o el siguiente micro-scope de producto y ejecutarlo con criterio de cierre claro.

## Cómo validar (QA mínimo)

- CURRENT_STATE: sin placeholders en “Ahora mismo”; branch/commit/scope/entorno/next step coherentes con el repo.
- OPEN_LOOPS: snapshot rápido lleno; ≥3 loops reales con prioridad, DoD y owner; consistencia con CURRENT_STATE.
