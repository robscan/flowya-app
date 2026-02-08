# Create Spot — Defaults Contextuales (Por visitar vs Visitado)

**Fecha:** 2026-02-07  
**Objetivo:** Que Flowya se sienta natural en 3 momentos (Explorar/Planear, Fluir/Viajar, Recordar/Diario) sin obligar al usuario a “llenar ficha”.

---

## 1) Inputs que usa el sistema (mínimos)

### A. `appMode` (intención del usuario)
- `explore` = planeo / marco pines por visitar
- `flow` = estoy viajando y agrego paradas (aún sin flows)
- `remember` = ya lo visité / diario

> Nota: aunque el tab bar no exista todavía, el sistema puede inferir `appMode` por el entrypoint y/o por un “selector rápido” en creación.

### B. `activeFilter` (contexto visible)
- `all` | `to_visit` | `visited`

### C. `entrypoint`
- `long_press_map` (crear en mapa)
- `search_create` (tap en “Crear ‘X’” dentro de búsqueda)
- `search_select_place` (selecciona POI existente y luego decide guardarlo)
- `spot_missing_create` (no existe → crear)

---

## 2) Defaults propuestos (reglas claras)

### Regla 1 — Si el usuario está filtrando, respeta su intención
- Si `activeFilter = to_visit` → `defaultStatus = to_visit`
- Si `activeFilter = visited` → `defaultStatus = visited`
- Si `activeFilter = all` → aplica reglas 2 y 3

### Regla 2 — En Explore, por defecto “Por visitar”
- Si `appMode = explore` → `defaultStatus = to_visit`

### Regla 3 — En Remember, por defecto “Visitado”
- Si `appMode = remember` → `defaultStatus = visited`

### Regla 4 — En Flow (viajando), por defecto “Por visitar”
- Si `appMode = flow` → `defaultStatus = to_visit`
- (Porque muchas paradas se agregan antes de conocer el lugar)

---

## 3) Compact vs Full (progresive disclosure)

### `createMode = compact` (90% de casos)
Se usa cuando el usuario está:
- planeando (explore)
- viajando (flow)
- creando porque “no encontró” el lugar

UI mínima:
- Título (prefill si existe)
- Chips: `Por visitar` / `Visitado`
- Guardar

**Sin formulario.**  
*Opcional:* 1 campo de “nota rápida” (ver sección 4).

### `createMode = full` (solo cuando vale la pena)
Se habilita cuando:
- `defaultStatus = visited` (diario) **o**
- el usuario hace tap en “Agregar detalles / Diario” desde el card

UI:
- Nota/diario (texto)
- Fotos
- Tags (ligeros)
- VisitedAt (fecha aproximada)

---

## 4) Hacer más fácil la descripción (sin “trabajar para la app”)

### A. Nota rápida (1 línea)
Placeholder por contexto:
- Explore/Flow: “¿Por qué lo guardas?” / “¿Qué quieres hacer aquí?”
- Remember: “¿Qué te gustó? (1 línea)”

### B. Plantillas tipo chips (tap-to-fill)
Ejemplos:
- “Ir al atardecer”
- “Reservar antes”
- “Buen café”
- “Carísimo pero vale”
- “Volver con amigos”

### C. Diario asistido (solo en Remember)
- 3 prompts cortos:
  1) “Lo mejor: ___”
  2) “Tip: ___”
  3) “Volvería: Sí/No”

---

## 5) Persistencia (evitar pedir el nombre dos veces)
Si el flujo inicia con texto (Search → “Crear ‘Capitol’”):
- `title` se prellena
- **no se vuelve a pedir** salvo que el usuario lo edite

---

## 6) Casos límite
- Si el usuario cambia chip (to_visit ↔ visited): actualizar `createMode` sugerido, pero **no forzar** a abrir formulario.
- Si el lugar viene de `place` (Mapbox) y el usuario solo quiere pin: guarda metadata y listo (ver `data/MAPBOX_DATA_MODEL.md`).

