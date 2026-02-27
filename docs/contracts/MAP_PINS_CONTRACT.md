# MAP_PINS_CONTRACT — Contrato de map pins (Explorar)

**Fuentes de verdad:** `components/design-system/map-pins.tsx`, `components/explorar/MapCoreView.tsx`, `lib/map-core/spots-layer.ts`, `app/design-system.web.tsx`.

---

## 1) Tamaños (MAP_PIN_SIZES)

| Constante | Valor | Uso |
|-----------|-------|-----|
| `SPOT_PIN_SIZE` | 14 | Nivel 2 — reposo (spots no seleccionados) |
| `SPOT_PIN_SELECTED_SIZE` | 32 | Nivel 1 — protagonista (spot seleccionado) |
| `SPOT_PIN_ICON_SIZE` | 18 | Icono dentro del pin seleccionado (to_visit/visited) |
| `SPOT_PIN_STROKE` | 2 | Borde en reposo |
| `SPOT_PIN_SELECTED_STROKE` | 3 | Borde en seleccionado |
| `LOCATION_PIN_SIZE` | 14 | Pin de ubicación del usuario |

Export: `MAP_PIN_SIZES` en `map-pins.tsx` para anchor/consumidores externos.

---

## 2) Jerarquía de capas (stacking)

En `MapCoreView` actual:

1. **Spots** se renderizan como `SymbolLayer` nativa (no Marker DOM), gestionados en `useMapCore`.
2. **Ubicación del usuario** se renderiza como Marker React.
3. **Preview temporal** (draft/POI/Landmark) se renderiza como Marker React.

Regla práctica: la señal temporal de preview y la ubicación de usuario deben quedar visualmente por encima del contexto base.

---

## 3) Animaciones MapPinSpot

| Transición | Duración | Easing |
|------------|----------|--------|
| selected ↔ unselected (size 12↔36) | 200 ms | Easing.out(Easing.cubic) |
| Hover (scale 1.08x, solo reposo) | 100 ms | idem |
| Press (scale 0.95x, solo reposo) | 100 ms | idem |
| Icono fade-in al seleccionar | 200 ms (con selected) | idem |

---

## 4) Componentes

- **MapPinSpot:** Spot en mapa; props `status`, `label`, `selected`, `colorScheme`.
- **MapPinLocation:** Ubicación del usuario; círculo azul.
- **MapPinCreating / MapPinExisting:** Create Spot (Scope G); 20px y 10px respectivamente.

### Preview temporal en mapa (MapCoreView)

`MapCoreView` usa `MapPinSpot` como preview canónico para selección temporal (`draft`, `POI`, `landmark`).

Estado visual temporal:

- `previewPinState="default"`
- `previewPinState="to_visit"` (accent naranja para feedback de acción)
- `previewPinState="visited"` (accent verde para feedback de acción)

---

## 5) Guía canónica para texto en mapa (labels)

### 5.1 Fuente visual del texto
- Labels de spots persistidos: `lib/map-core/spots-layer.ts` (`flowya-spots-labels`).
- Label de preview: `MapPinSpot` solo cuando aplica (ej. draft). En selección POI se evita competir con labels del mapa.

### 5.2 Regla de tipografía
- `default`: tipografía base Mapbox (`MAPBOX_LABEL_STYLE_*`).
- `to_visit` / `visited`: un solo estilo reforzado (bold), mismo para ambos estados.
- No mezclar pesos distintos por estado si no hay contrato explícito.

### 5.3 Regla de separación pin↔texto
- El `text-offset` debe ser dinámico:
  - pin seleccionado (más grande) => mayor offset;
  - pin no seleccionado => menor offset.
- Objetivo: evitar empalme visual cuando el pin escala al seleccionar.

### 5.4 Sombra/halo
- Usar halo suave para `to_visit/visited` (legibilidad), no sombra dura.
- `default` mantiene halo base de Mapbox.

### 5.5 Regla de cambios
- Si se modifica tipografía/gap/sombra de labels en mapa:
  - actualizar `spots-layer` en rama de creación y rama de actualización (cuando capa ya existe),
  - validar en dark/light,
  - validar `default / to_visit / visited` con zoom in/out.

---

## 6) Referencias

- Bitácora 096: tamaños, animaciones, z-index.
- Bitácora 095: MapPinFilter dropdown.
- Bitácora 010: estados visuales spot (selected solo para tamaño).
- Bitácora 121: preview diferenciado POI/Landmark + rollback/toasts.
- DESIGN_SYSTEM_USAGE: componentes canónicos.

---

## 7) Reglas de visibilidad linking (Track A)

- Si `link_status=linked` y `saved=false` y `visited=false`, el pin FLOWYA puede ocultarse detrás de flag.
- Guardrail QA 2026-02-25: ocultamiento `linked+unsaved` solo aplica si landmarks base están habilitados (`ff_map_landmark_labels=ON`).
- `uncertain` y `unlinked` nunca se ocultan automáticamente.
- Guardrail de seguridad: no ocultar un spot `linked+unsaved` si no existe `linked_place_id` válido.
- Cuando hay `saved` o `visited`, el pin FLOWYA siempre se mantiene visible.
