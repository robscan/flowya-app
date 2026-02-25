# MAP_PINS_CONTRACT — Contrato de map pins (Explorar)

**Fuentes de verdad:** `components/design-system/map-pins.tsx`, `components/explorar/MapCoreView.tsx`, `app/design-system.web.tsx`.

---

## 1) Tamaños (MAP_PIN_SIZES)

| Constante | Valor | Uso |
|-----------|-------|-----|
| `SPOT_PIN_SIZE` | 12 | Nivel 2 — reposo (spots no seleccionados) |
| `SPOT_PIN_SELECTED_SIZE` | 36 | Nivel 1 — protagonista (spot seleccionado, estilo Apple Maps ~30–40px) |
| `SPOT_PIN_ICON_SIZE` | 20 | Icono dentro del pin seleccionado (to_visit/visited) |
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

`MapCoreView` soporta variantes de preview:

- `previewPinKind="spot"`: usa `MapPinSpot` (flujo draft/paso 0).
- `previewPinKind="poi"`: dot circular temporal.
- `previewPinKind="landmark"`: badge dot desplazado arriba-derecha (no reemplaza centro del landmark).

Estado visual temporal:

- `previewPinState="default"`
- `previewPinState="to_visit"` (accent naranja para feedback de acción)

---

## 5) Referencias

- Bitácora 096: tamaños, animaciones, z-index.
- Bitácora 095: MapPinFilter dropdown.
- Bitácora 010: estados visuales spot (selected solo para tamaño).
- Bitácora 121: preview diferenciado POI/Landmark + rollback/toasts.
- DESIGN_SYSTEM_USAGE: componentes canónicos.
