# EXPLORE — UI Shell Contract (Fuente de verdad)

## Capas (siempre)

Layer 0 — Map (siempre montado, visible)
Layer 1 — Top Controls (perfil, filtros, search btn, etc.)
Layer 2 — Overlay (solo 1 activo a la vez)

## Estados globales (única fuente de verdad)

overlayMode:

- none
- search
- saveSpot
- pickLocation

focusMode:

- none
- typing
- list
- pickLocation

mapStyleMode:

- explore (gris, bajo ruido)
- edit (más informativo/colorido)

## Reglas de interacción

1. overlayMode = none

- Mapa interactivo (pan/zoom)
- Controles flotantes visibles

2. overlayMode = search

- Mapa visible, BLOQUEADO (no pan/zoom)
- focusMode:
  - typing cuando teclado activo
  - list cuando hay resultados visibles

- Al seleccionar resultado:
  - NO navegar a otra “pantalla blanca”
  - Transición a overlayMode = saveSpot (prefill name+coords)

3. overlayMode = saveSpot (Guardar rápido)

- Mapa visible, BLOQUEADO
- UI mínima:
  - Nombre (prefill si existe)
  - Chips estado: Por visitar / Visitado (default contextual)
  - Preview ubicación (pin) + acción “Cambiar ubicación”
  - CTA principal: Guardar

- Guardar NO requiere descripción.

4. overlayMode = pickLocation (Elegir/ajustar ubicación)

- Mapa visible, DESBLOQUEADO (pan/zoom)
- mapStyleMode = edit
- Si hay lista de sugerencias:
  - al seleccionar una sugerencia: lista colapsa automáticamente
  - al panear el mapa: lista se colapsa

- CTA: Confirmar ubicación
- Al confirmar: vuelve a overlayMode = saveSpot (con coords finales)

## Reglas de colisión (anti-empalmes)

- Si focusMode = typing:
  - ocultar/mover controles flotantes que invadan zona inferior
  - respetar safe area + keyboard

- Definir “safe bottom zone” para que ningún flotante la invada cuando hay teclado.
- Prohibido apilar overlays (no modal sobre modal). Solo cambia overlayMode.

## Defaults contextuales: estado del spot

defaultStatus:

- Si filtro actual = Por visitar → Por visitar
- Si filtro actual = Visitados → Visitado
- Si filtro actual = Todos → Por visitar (por seguridad)
- Si distancia entre targetCoords y centro del mapa > umbral (viaje/planeación) → Por visitar
- Persistencia suave en sesión: mantener último status usado mientras no cambie filtro.

## Eventos (Search V2 NO navega)

Search V2 emite:

- onSelectPlace(place, coords)
- onSelectSpot(spotId)
- onCreateQuery(query, targetCoords)

UI Shell decide:

- selectSpot → abre detail
- selectPlace → overlayMode = saveSpot (prefill)
- createQuery → overlayMode = saveSpot con targetCoords = centro del mapa (o coords del contexto) y name=query
