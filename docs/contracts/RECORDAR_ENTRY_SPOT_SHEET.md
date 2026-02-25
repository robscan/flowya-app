# RECORDAR_ENTRY_SPOT_SHEET — Contrato

**Estado:** DRAFT  
**Owner:** Explore + Recordar  
**Última actualización:** 2026-02-14

> Entry point de "Mi diario" (Recordar) desde SpotSheet. Plan completo en `docs/ops/plans/PLAN_RECORDAR_MI_DIARIO.md`.

---

## 1. Condición de visibilidad

El botón "Mi diario" (o equivalente) se muestra **solo** cuando el spot tiene:

- `saved === true` O
- `visited === true`

Es decir: el usuario ya marcó el spot como Por visitar o Visitado. No se muestra en estado "default" (sin guardar).

---

## 2. Ubicación y layout

- **Fila:** La misma que el botón de estado (Por visitar / Visitado).
- **Disposición:** Dos botones lado a lado en la misma fila.
- **Ancho:** Ambos comparten el ancho disponible de forma **responsiva** (ej. flex: 1 cada uno).
- **Orden:** Estado (Por visitar | Visitado) a la izquierda; "Mi diario" a la derecha (o según diseño final).

---

## 3. Acción

Al pulsar "Mi diario":

- Abre el flujo de notas/diario para ese spot.
- El destino concreto (modal, sheet, pantalla) se define en el plan de implementación (EP-3).

---

## 4. Nivel visual

- Ambos botones usan el mismo nivel jerárquico (primary/secondary según Design System).
- No crear jerarquía que oculte el CTA principal (estado Por visitar/Visitado).

---

## 5. Accesibilidad

- Etiquetas claras: p. ej. "Ir a mi diario" o "Ver mis notas".
- `accessibilityRole="button"`.
- `accessibilityLabel` descriptivo.

---

## 6. Dependencias

- SpotSheet en estados medium y expanded (actionRow).
- `lib/pins` con soporte de `notes` y `updatePinNotes`.
- Usuario autenticado para persistir notas.
