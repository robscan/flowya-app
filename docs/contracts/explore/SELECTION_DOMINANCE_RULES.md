# SELECTION_DOMINANCE_RULES — Explore

**Fecha:** 2026-04-26
**Estado:** ACTIVE (Fase 1 — OL-WOW-F1-001)

## Objetivo

Garantizar una sola fuente visual dominante cuando existe selección activa (spot o POI) y eliminar conflictos entre representación Flowya y capas externas del mapa.

---

## 1) Regla madre

Si existe selección activa, la representación visual dominante debe ser Flowya.

- Prioridad de render:
  1. Selección activa Flowya (pin+label según contrato)
  2. Estado semántico (`default`/`to_visit`/`visited`)
  3. Contexto externo (labels/icons de terceros)

---

## 2) Fuentes de selección

- `selectedSpot` (spot persistido o draft)
- `poiTapped` (POI externo)

`selectedSpot` tiene precedencia sobre `poiTapped` si ambos coexisten temporalmente.

---

## 3) Política de capas externas

Durante selección activa:
- Suprimir labels/iconos POI de Mapbox que compitan con la selección.
- Mantener contexto base del mapa (calles/bloques) sin ruido competitivo.
- Suprimir auto-apertura de sheets contextuales/motivacionales (`ExploreWelcomeSheet`, `CountriesSheet`) que reemplacen la consulta activa.
- Forzar visibilidad del pin seleccionado aunque esté fuera del filtro activo (por ejemplo, abrir un spot `Visitado` desde búsqueda estando en `Por visitar`). El estado visual del pin debe reflejar su estado real, no el filtro activo.

Al salir de selección:
- Restaurar visibilidad normal de layers externas.

---

## 4) Label policy

- Una entidad seleccionada no puede mostrar labels competitivos simultáneos.
- Si se renderiza label Flowya de selección, el label externo equivalente debe quedar suprimido.
- Si no se puede suprimir externamente, se desactiva label Flowya para ese caso y se registra como gap.
- En selección POI: prioridad a legibilidad y no duplicidad; el sistema puede ocultar labels Flowya de spots mientras exista `poiTapped`.

---

## 5) Estados semánticos de selección

- `default`: selección clara sin perder legibilidad.
- `to_visit`: selección + color semántico `to_visit`.
- `visited`: selección + color semántico `visited`.

La selección no reemplaza el estado semántico, lo enmarca.

---

## 6) Restauración (exit rules)

Eventos de salida:
- `CLOSE_SPOT`
- `tap fuera` / `dismiss overlay`
- `cambio de selección`

Acción obligatoria:
- Restaurar layers externas suprimidas.
- Limpiar overlay de selección anterior.
- Si el filtro activo es `saved`/`visited`, hay datos y la entrada a CountriesSheet fue diferida por selección activa, abrir/restaurar CountriesSheet después del cierre, no antes.

---

## 7) Anti-jitter

- Prohibido encadenar múltiples representaciones para el mismo evento (ej. badge + pin + label extra).
- Transición de selección debe ser atómica: un evento, un estado visual final.

---

## 8) Smoke mínimo

1. Selección POI `default` => pin seleccionado claro, sin duplicidad competitiva de texto.
2. Selección POI `to_visit` => mismo comportamiento sin traslape.
3. Selección spot oculto por regla de visibilidad => overlay Flowya consistente.
4. Al cerrar selección => capas externas restauradas.
5. Tap en POI ya existente => abre spot persistido correcto (sin sheet POI en estado incorrecto).
6. Con SpotSheet abierto desde `Todos`, cambiar a `Por visitar`/`Visitados` => el spot sigue visible; CountriesSheet no lo reemplaza.
7. Cerrar ese SpotSheet con filtro KPI activo y count > 0 => CountriesSheet puede aparecer como contexto diferido.
8. En `Por visitar`, buscar y abrir spot `Visitado` => SpotSheet visible y pin seleccionado visible en mapa con estado `visited`.

---

## 9) Referencias

- `docs/contracts/explore/MAP_RUNTIME_RULES.md`
- `docs/contracts/explore/FILTER_RUNTIME_RULES.md`
- `docs/contracts/EXPLORE_CHROME_SHELL.md`
- `docs/contracts/MAP_PINS_CONTRACT.md`
- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/MapCoreView.tsx`
