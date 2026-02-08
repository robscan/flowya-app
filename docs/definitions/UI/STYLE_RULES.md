# Flowya — UI Style Rules (Canon)

## Golden Rules (mandatorias)

1. **Map-first (Explore):** el mapa es la pantalla. Las herramientas viven encima.
2. **Quiet UI:** no grita. Prioriza claridad + calma.
3. **Icon-first:** los accionables son iconos salvo que haya ambigüedad.
4. **Container only when needed:** contenedor solo por legibilidad o jerarquía (CTA principal).
5. **No ugly forms:** evitar UI tradicional de “formulario”. Inputs suaves, integrados, humanos.

---

## Accionables: icon-only vs CTA con label

### Icon-only (preferido)

Usa botón de icono SIN label cuando:

- la acción es estándar (cerrar, atrás, buscar, limpiar, ubicación, compartir)
- el contexto hace obvio qué hace (p. ej. “X” en search)
- no hay riesgo de interpretación

**Regla:** si un usuario puede dudar “¿qué hace esto?”, no es icon-only.

### CTA con label (solo cuando es inevitable)

Usa botón con texto cuando:

- es **acción principal** del estado (Guardar, Confirmar ubicación)
- existe ambigüedad (Crear/Guardar vs Abrir)
- hay riesgo de pérdida (Eliminar, Descartar)

**Regla:** un estado puede tener **1 CTA con label** como máximo.

---

## Contenedores (pills/cards) y cuándo usarlos

### Usar contenedor cuando:

- el fondo es variable/ruidoso (mapa)
- necesitas separar tap targets
- necesitas elevar jerarquía (CTA principal)

### No usar contenedor cuando:

- estás dentro de un overlay/panel con fondo controlado
- es icon-only secundario y ya es legible
- el contenedor solo agrega ruido visual

---

## Inputs (anti-form tradicional)

Objetivo: input “integrado”, no caja fea.

### Input base

- bordes redondeados
- padding generoso
- placeholder claro (humano, corto)
- sin labels arriba (evitar “form vibe”) salvo casos complejos

### Estados de input (obligatorios si aplica)

- default
- focus
- filled
- disabled
- error (con mensaje humano)
- loading (si la acción depende de red)

**Regla:** el input no debe empalmarse con teclado/acciones flotantes → se gobierna por `focusMode`.

---

## Tipografía, tono visual y jerarquía

- Titulares: pocos, cortos. Evitar bloques largos.
- Descripciones: 1–2 líneas por defecto (clamp).
- Spacing: priorizar aire sobre líneas divisorias.
- Divisores: si se usan, que sean sutiles (espacio > líneas).

---

## Map overlays (legibilidad sobre mapa)

- Evitar blur costoso si no es necesario.
- Usar sombra/panel claro cuando el overlay esté sobre mapa.
- Respetar “safe bottom zone” cuando hay teclado.
- Un solo overlay activo (prohibido apilar modales).

---

## Micro-interacciones

- Feedback inmediato al tap (press state).
- Loading discreto (no bloquear si no es necesario).
- Transiciones cortas (sin show-off).
