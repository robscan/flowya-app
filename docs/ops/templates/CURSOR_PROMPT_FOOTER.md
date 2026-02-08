# CURSOR — CLOSEOUT (MANDATORY)

> No se considera “terminado” ningún micro‑scope si NO se cumple esta lista.

## 0) Sanidad
- Corre TypeScript/linters/tests relevantes y verifica que no haya errores.
- Verifica que el build y/o run principal funcione (web mobile).
- Si tocaste UI/gestos/teclado: prueba al menos 1 caso con teclado abierto y 1 sin teclado.

## 0.5) Disciplina de scope (NO NEGOCIABLE)

- **1 PR = 1 micro-scope.** Si algo extra aparece, **no lo metas**: conviértelo en **OPEN LOOP**.
- Diferencia clave: **OPEN LOOP (OL)** = pendiente detectado; **Micro-scope (MS)** = PR que resuelve 1 OL (o una pieza concreta del plan).
- **Flow** / **Recordar**: NO abrir ni implementar salvo que `docs/ops/GUARDRAILS.md` lo permita.  
  Si surge como requisito, registra OPEN LOOP con **gates** (criterio de apertura) y detén el scope ahí.


## 1) Git
- Commit con mensaje claro (scope + acción).
- Push a la rama actual.

## 2) Estado operativo (FUENTE DE VERDAD)
- Actualiza `docs/ops/CURRENT_STATE.md` con:
  - Scope/sub-scope activo
  - Branch actual
  - Commit SHA actual (local + origin)
  - Qué cambió (1–3 bullets)
  - Riesgos / cosas a vigilar
  - Next step (1 línea accionable)

## 3) OPEN LOOPS (Backlog único)
- Actualiza `docs/ops/OPEN_LOOPS.md`:
  - Cierra loops resueltos (incluye evidencia breve: archivo(s)/pantalla(s)/PR).
  - Abre loops nuevos solo si tienen: **DoD**, owner, y prioridad.

## 4) PR (si aplica)
- Si abriste o actualizaste PR:
  - Guarda PR card en `docs/pr/YYYY/MM/` con:
    - Link del PR
    - Resumen (Minto: qué/por qué/cómo probar)
    - QA checklist
    - Riesgos/rollbacks
  - Agrega/actualiza entrada en `docs/pr/PR_INDEX.md`.

## 5) Bitácora (si hubo cambios reales)
- Agrega entrada en `docs/bitacora/YYYY/MM/`:
  - Qué se cambió
  - Qué se probó
  - Qué quedó pendiente
- Si es un tema nuevo o cerraste un track: actualiza `docs/bitacora/INDEX.md`.
