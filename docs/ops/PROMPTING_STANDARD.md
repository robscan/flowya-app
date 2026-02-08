# PROMPTING_STANDARD.md
**FLOWYA — Prompting Standard (Source of Truth)**

Este documento define el estándar mínimo para prompts dirigidos a Cursor en FLOWYA, enfocado en:
- ejecución quirúrgica (1 PR = 1 micro-scope),
- estabilidad (evitar regresiones),
- y trazabilidad operativa (CURRENT_STATE + OPEN_LOOPS siempre actualizados).

> **Regla de oro:** Si no está en `docs/ops/CURRENT_STATE.md` o `docs/ops/OPEN_LOOPS.md`, no existe.


---

## 1) Principios (NO NEGOCIABLES)

1) **1 PR = 1 micro-scope.**  
   Lo que no quepa en el PR → se registra como **OPEN LOOP** con DoD, owner y prioridad.

2) **Map-first / Apple Maps vibe.**  
   El mapa es el lienzo; overlays son herramientas. No se apilan (un overlay activo). No degradar performance.

3) **No abrir Flow ni Recordar** salvo que `docs/ops/GUARDRAILS.md` lo permita.  
   Si aparecen como “necesidad”: **registrar OPEN LOOP con gates**, no implementarlo.

4) **Nada de reproches.**  
   Comunicación motivadora, directa, recompensante.

5) **Trazabilidad obligatoria.**  
   Cada PR debe dejar el repo “retomable mañana”.


---

## 2) Formato obligatorio de prompt (plantilla)

Todo prompt a Cursor debe seguir el formato A–E.

### (A) Objective
- 1–2 líneas: qué valor entrega al usuario final.
- Si es infra/ops: qué valor entrega a la retomabilidad/estabilidad.

### (B) Constraints
- Reglas de scope: 1 PR = 1 micro-scope.
- Guardrails relevantes (map-first, no Flow/Recordar, no degradar rendimiento, etc.).
- Dependencias explícitas (si aplica).

### (C) Steps (quirúrgicos)
- Lista corta de pasos.
- Cada paso debe ser atómico y verificable.
- No mezclar DB + UI + arquitectura en el mismo micro-scope salvo que sea estrictamente necesario.

### (D) Acceptance Criteria (DoD)
- Checklist testable.
- Debe incluir: “sin nuevos warnings/errores” y criterios de UX cuando aplique.

### (E) Closeout (MANDATORY)
**SIEMPRE** pegar el footer `docs/ops/templates/CURSOR_PROMPT_FOOTER.md` **verbatim** (sin editar).


---

## 3) OPS DISCIPLINE (MANDATORY)

**No dupliques reglas de disciplina en el prompt.**  
La **fuente de verdad** de disciplina operativa (OL vs MS, 1 PR = 1 micro-scope, updates obligatorios de ops, y gates Flow/Recordar) vive **únicamente** en:

- `docs/ops/templates/CURSOR_PROMPT_FOOTER.md`

El prompt debe terminar en (E) pegando ese footer tal cual.  
Esto evita duplicación y deriva entre copias.


---

## 4) Estándar de commits y PR

- Mensajes de commit: claros, con scope, y sin mezclar micro-scopes.
  - Ejemplos:
    - `chore(ops): ...`
    - `feat(search): ...`
    - `fix(map): ...`

- Si el repo requiere PR para `main`, siempre:
  - `git checkout -b <branch>`
  - `git push -u origin <branch>`
  - abrir PR → merge


---

## 5) Pruebas mínimas por micro-scope (baseline)

Según el tipo de cambio, incluir al menos:

- **web mobile**: viewport tipo iPhone, taps rápidos, scroll.
- **teclado** (si hay input): focus/blur, teclado tapa UI, selección estable.
- **regresión**: abrir/cerrar overlays 10 veces si tocaste navegación/overlays.

Si aparece un edge case no contemplado → OPEN LOOP (no meterlo al mismo PR).


---

## 6) Ejemplo mínimo de prompt (estructura)

### (A) Objective
<una frase>

### (B) Constraints
<3–6 bullets>

### (C) Steps (quirúrgicos)
1) ...
2) ...

### (D) Acceptance Criteria (DoD)
- ...
- ...

### (E) Closeout (MANDATORY)
(Pegar aquí `docs/ops/templates/CURSOR_PROMPT_FOOTER.md` tal cual)
