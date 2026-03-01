# PLAN_OL_WOW_F3_001_RUNTIME_MODULAR

**Fecha:** 2026-02-28  
**OL:** `OL-WOW-F3-001`  
**Objetivo:** extraer runtime modular de Explore en micro-scopes seguros, sin regresiones funcionales.

---

## 1) Alcance de este plan

Incluye únicamente F3-001 en 3 micro-scopes secuenciales:
- **MS1:** extracción mínima (`state/intents/reducer/invariants`) + adopción inicial en `MapScreenVNext`.
- **MS2:** mover intents e invariantes adicionales de flujo (sin features nuevas).
- **MS3:** cableado final y limpieza de acoplamientos legacy con guardrails.

No incluye:
- Activación de F3-002.
- Instrumentación runtime de F3-003.
- Cambios de API pública.

Estado de avance (2026-02-28):
- MS1 completado + smoke manual OK (bitácora `215`).
- MS2 en progreso.

---

## 2) Contrato interno MS1 (decision-complete)

### Interfaces

- `ExploreRuntimeState`
  - `pinFilter: "all" | "saved" | "visited"`
  - `sheetState: "peek" | "medium" | "expanded"`

- `ExploreIntent`
  - `EXPLORE_RUNTIME/SET_PIN_FILTER`
  - `EXPLORE_RUNTIME/SET_SHEET_STATE`
  - `EXPLORE_RUNTIME/RESET`

- `ExploreReducer`
  - firma pura `(state, intent) => nextState`

- `ExploreInvariantResult`
  - `{ ok: true } | { ok: false; reason: string }`

### Ubicación

- `core/explore/runtime/state.ts`
- `core/explore/runtime/intents.ts`
- `core/explore/runtime/reducer.ts`
- `core/explore/runtime/invariants.ts`

---

## 3) Plan por micro-scope

## MS1 — Extracción mínima segura

### Implementación
- Crear los 4 archivos runtime con tipos y reducer puros.
- Integrar `useReducer` en `MapScreenVNext` para `pinFilter/sheetState`.
- Mantener mismos defaults y mismos handlers externos.
- Añadir validación de invariantes solo en modo desarrollo/log (sin romper runtime).

### DoD
- `MapScreenVNext` compila y opera con runtime reducer.
- No cambia la UX de search/map/sheet.
- Sin cambios de contrato público.

### Riesgo principal
- Ruptura accidental en handlers que dependen de `setPinFilter` o `setSheetState`.

### Mitigación
- Exponer wrappers compatibles con uso actual.
- Smoke manual completo al final del micro-scope.

### Rollback
- Revertir integración de `useReducer` y mantener runtime files sin uso.

---

## MS2 — Intents e invariantes extendidos

### Implementación
- Expandir intents puros para transición de selección/contexto sin side effects.
- Centralizar reglas deterministas en invariantes.

### DoD
- Menos lógica condicional dispersa en pantalla.
- Reglas de transición documentadas y testeables.

### Riesgo
- Sobre-abstracción temprana.

### Mitigación
- Mover solo reglas ya estables en contratos.

### Rollback
- Mantener invariantes en helper functions locales.

---

## MS3 — Cableado final y limpieza

### Implementación
- Sustituir acoplamientos legacy restantes por runtime modular.
- Eliminar duplicaciones claras de estado derivado.

### DoD
- Menor complejidad de contenedor crítico.
- Sin regresiones en mapa/search/sheet.

### Riesgo
- Mezclar limpieza con cambios de comportamiento.

### Mitigación
- PR acotado solo a limpieza estructural.

### Rollback
- Reintroducir adaptador legacy temporal y cortar alcance.

---

## 4) Smoke mínimo obligatorio por micro-scope

1. Abrir mapa base sin errores.
2. Abrir y cerrar search.
3. Seleccionar spot y POI externo.
4. Cambiar filtro `all/saved/visited`.
5. Abrir sheet en `medium` desde selección.
6. Confirmar que cámara respeta `discover/inspect/act` sin jitter.

Regla: si falla un smoke, no avanzar al siguiente micro-scope.

---

## 5) Preparación F3-002 y F3-003 (sin implementación runtime)

### F3-002 (Activity Summary)
- Mantener bloqueo funcional para países: `visitedCountriesCount = —` cuando calidad `< umbral`.
- No activar interacción de países hasta fuente canónica.

### F3-003 (Observabilidad mínima)
Lista mínima de eventos (documental):
- `explore_decision_started`
  - payload: `{ source: "map"|"search", pinFilter, hasSelection, timestampMs }`
- `explore_decision_completed`
  - payload: `{ outcome: "saved"|"visited"|"dismissed"|"opened_detail", elapsedMs, pinFilter }`
- `explore_selection_changed`
  - payload: `{ entityType: "spot"|"poi", selectionState: "selected"|"cleared", fromFilter, toFilter }`

Guardrail: no instrumentar runtime en este ciclo.

Actualización 2026-02-28 (post-cierre F3-001):
- Guardrail ya cumplido durante F3-001.
- La implementación runtime de F3-003 se mueve a su propio ciclo (bitácora `219`).

---

## 6) Evidencia de cierre esperada

Para cerrar MS1:
- Bitácora del día con alcance, cambios y smoke.
- `OPEN_LOOPS` actualizado con estado y dependencia.
- Referencia a este plan en trazabilidad.
