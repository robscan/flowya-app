# EXPLORE — UI Shell Contract (Canon)

## Capas (siempre)

Layer 0 — Map (siempre montado, visible)
Layer 1 — Top Controls (perfil, filtros, search btn, etc.)
Layer 2 — OverlayPanel (solo 1 activo a la vez)
Layer 3 — Toast/Feedback (temporal, no interactivo o mínimo)

---

## Estados globales (fuente de verdad)

overlayMode:

- none
- search
- saveSpot
- pickLocation
- spotPreview (tap pin)

focusMode:

- none
- typing
- list
- pickLocation

mapStyleMode:

- explore (gris, bajo ruido)
- edit (más informativo/colorido)

---

## Reglas de interacción por overlayMode

### 1) overlayMode = none

- Mapa interactivo (pan/zoom)
- Controles flotantes visibles (icon-first)

### 2) overlayMode = search

- Mapa visible, BLOQUEADO (no pan/zoom)
- focusMode:
  - typing cuando teclado activo
  - list cuando hay resultados visibles

- Search V2 **NO navega**; solo emite eventos.
- Salidas:
  - selectSpot → overlayMode = spotPreview (o abrir detail directo, según decisión)
  - selectPlace → overlayMode = saveSpot (prefill name+coords)
  - createQuery → overlayMode = saveSpot (name=query, coords=centro del mapa)

### 3) overlayMode = saveSpot (Guardar rápido)

- Mapa visible, BLOQUEADO
- UI mínima:
  - Nombre (prefill si existe) — NO se pide dos veces.
  - Chips estado: Por visitar / Visitado (default contextual)
  - Preview ubicación (pin visible) + acción “Cambiar ubicación”
  - CTA principal: “Guardar”

- No requiere descripción.
- Al guardar:
  - feedback discreto (toast)
  - overlayMode = none
  - pin aparece de inmediato

### 4) overlayMode = pickLocation (Elegir/ajustar ubicación)

- Mapa visible, DESBLOQUEADO (pan/zoom)
- mapStyleMode = edit
- Lista de sugerencias (si existe):
  - al seleccionar: lista colapsa automáticamente
  - al panear: lista colapsa

- CTA principal: “Confirmar ubicación”
- Al confirmar:
  - overlayMode = saveSpot (coords finales)

### 5) overlayMode = spotPreview (Consultar spot)

- Mapa visible, BLOQUEADO (opcional: permitir pan suave, pero sin perder foco)
- Card flotante (mínimo):
  - título
  - estado (por visitar/visitado)
  - 1–2 líneas de nota/desc si existe (clamp)
  - acciones:
    - icon-only: cerrar, share (si aplica)
    - CTA (si aplica): “Abrir” / “Editar”

- Tap fuera:
  - cierra preview (overlayMode=none)

---

## Reglas de colisión (anti-empalmes)

- Prohibido apilar overlays. Solo cambia overlayMode.
- Si focusMode = typing:
  - ocultar/mover controles flotantes que invadan zona inferior
  - respetar safe area + keyboard

- Definir “safe bottom zone” (altura fija) reservada cuando teclado está activo.

---

## Defaults contextuales: estado del spot

defaultStatus:

- Si filtro actual = Por visitar → Por visitar
- Si filtro actual = Visitados → Visitado
- Si filtro actual = Todos → Por visitar (por seguridad)
- Si distancia entre targetCoords y centro del mapa > umbral → Por visitar
- Persistencia suave en sesión: mantener último status usado mientras no cambie filtro.

---

## Search display rules (turismo primero)

Objetivo: Flowya es turística. Priorizar lugares/POIs.

Secciones sugeridas en resultados:

1. **Lugares** (POIs / landmarks / negocios relevantes)
2. **Tus spots** (si aplica / coincidencias en tu mapa)
3. **Zonas** (barrios/ciudades)
4. **Direcciones / calles** (al final o bajo “Ver direcciones”)

Regla:

- Si hay POIs relevantes, NO mostrar calles arriba.
- “Guardar ‘{query}’ aquí” aparece solo cuando:
  - no hay resultados suficientes o
  - el usuario explícitamente quiere guardarlo.

---

## Eventos (Search V2 NO navega)

Search V2 emite:

- onSelectPlace(place, coords)
- onSelectSpot(spotId)
- onCreateQuery(query, targetCoords?)

UI Shell decide:

- selectSpot → spotPreview o detail
- selectPlace → saveSpot (prefill)
- createQuery → saveSpot con coords = centro del mapa (default) y name=query
