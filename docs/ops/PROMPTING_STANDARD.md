# PROMPTING STANDARD — FLOWYA (Arquitecto ↔ Cursor)

Este documento define el **formato obligatorio** de prompts del Arquitecto para Cursor y las reglas de higiene del proyecto.
Objetivo: que el proyecto sea **autocontenible** (memoria operativa) y que mañana podamos retomar solo con `docs/`.

---

## 1) Regla de oro

**Ningún prompt es válido si NO incluye:**
- Objetivo
- Restricciones
- Pasos
- Criterios de aceptación (DoD)
- **CURSOR — CLOSEOUT (MANDATORY)** (footer)
- **OPS DISCIPLINE (MANDATORY)** (disciplina de scope + actualización de ops)

El footer oficial vive en: `docs/ops/templates/CURSOR_PROMPT_FOOTER.md`.

---

## 2) Formato obligatorio de prompt (plantilla)

## OPS DISCIPLINE (MANDATORY)

Este bloque es **obligatorio** en cada micro-scope / PR (lo ejecuta Cursor como parte del closeout):

- Recuerda: **OL = pendiente detectado**, **MS = 1 PR que lo resuelve**.  
  Si aparece un pendiente nuevo durante el trabajo: **NO lo metas a este PR** → crea/actualiza un **OPEN LOOP** con DoD, owner y prioridad.
- Regla de scope: **1 PR = 1 micro-scope**. Lo que no quepa → OPEN LOOP.
- Este PR debe actualizar SIEMPRE:
  1) `docs/ops/CURRENT_STATE.md` (2–6 líneas: qué cambió, commit, next step)
  2) `docs/ops/OPEN_LOOPS.md` (snapshot + mover loops tocados: OPEN/READY/DONE con evidencia)
- **Flow** y **Recordar**: **no se abren** salvo que `docs/ops/GUARDRAILS.md` lo permita.  
  Si aparecen como “necesidad”: registra OPEN LOOP con **criterio de apertura (gates)**, no implementes.



### (A) Objective
Una frase: qué cambia el usuario (no qué cambian los archivos).

### (B) Constraints
- No romper Explore (map-first).
- No introducir dependencia de login para crear/guardar.
- Evitar overlays apilados.
- Evitar regresiones de rendimiento en mapa.

### (C) Steps (quirúrgicos)
Lista numerada. Máximo 7 pasos.

### (D) Acceptance Criteria (DoD)
Checklist verificable. Debe incluir al menos:
- UX: comportamiento esperado en 2–3 casos.
- Estado: no errores/Warnings nuevos.
- Prueba manual mínima (web mobile).

### (E) Closeout (MANDATORY)
Pegar el contenido de `docs/ops/templates/CURSOR_PROMPT_FOOTER.md` **tal cual**.

---

## 3) Micro‑scopes: reglas para velocidad sin caos

### 3.1 Tamaño máximo
- Un micro‑scope debe poder cerrarse con 1 PR pequeño.
- Si requiere cambiar DB + UI + lógica, dividir.

### 3.2 Definición de Done (DoD) mínima
- Caso feliz probado
- 1 caso borde probado
- No regresiones obvias (map gestures, teclado, navegación)
- Estado operativo actualizado (CURRENT_STATE + OPEN_LOOPS + PR card si aplica)

### 3.3 Anti‑scope‑creep
Si aparece “ya que estamos…”, se convierte en:
- un nuevo OPEN LOOP con prioridad
- o se difiere a otro micro‑scope

---

## 4) Roles

### Arquitecto (ChatGPT)
- Define estrategia y contratos.
- Protege UX (map-first) y estabilidad.
- Evita inconsistencias entre Explore / Flow / Recordar.

### Cursor (Ejecutor)
- Implementa micro‑scopes.
- Mantiene la memoria operativa actualizada (Closeout).
- No decide cambios de producto sin decisión registrada.

### Usuario (Negocio / puente)
- Prioriza, valida UX, provee contexto (capturas, videos, decisiones).

---

## 5) Reglas de documentación (fuente de verdad)

### 5.1 `docs/ops/` manda
- `CURRENT_STATE.md`: siempre actualizado al cierre.
- `OPEN_LOOPS.md`: backlog único (no en chats).
- `DECISIONS.md`: decisiones cerradas (ADR-lite).
- `SYSTEM_MAP.md`: arquitectura viva y contratos.

### 5.2 PR cards
- Todo PR tiene su card en `docs/pr/YYYY/MM/`.
- `PR_INDEX.md` debe poder leerse como timeline.

### 5.3 Bitácora
- Evidencia y narrativa de ejecución.
- No sustituye OPEN_LOOPS ni DECISIONS.

---

## 6) Señales de que debemos abrir “Flow” o “Recordar” (guardrail)

No se abre nuevo macro‑alcance por entusiasmo.
Se abre cuando se cumpla **al menos 2** de estas condiciones:
1) Explore está estable: Search→Save→Spot abierto/cerrado sin fricción, con teclado sin empalmes.
2) Data model + ownership están definidos (guest→claim listo o planificado sin deuda).
3) Activity log básico (C3) ya está capturando señales mínimas.
4) Hay 3+ OPEN LOOPS que piden explícitamente Flow/Recuerdo para resolverse.
5) Hay demanda clara en JTBD: el usuario ya “terminó” Explore y pide siguiente misión.

La decisión de abrir macro‑alcance debe registrarse en `docs/ops/DECISIONS.md`.
