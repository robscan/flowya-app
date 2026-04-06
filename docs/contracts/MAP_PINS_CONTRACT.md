# MAP_PINS_CONTRACT — Contrato de map pins (Explorar)

**Fuentes de verdad (orden de lectura):**

1. `constants/theme.ts` → `Colors.*.mapPinSpot` (radios, trazos, `default.*` para fill/stroke/label/plus, `makiIconSize`, etc.).
2. `lib/map-core/map-pin-metrics.ts` — fórmulas compartidas (círculos vs sprite compuesto); debe coincidir con `spots-layer` y `pin-status-images`.
3. `lib/map-core/spots-layer.ts` — pintura de capas Mapbox (`circle`, `DEFAULT_PLUS_*`, `PINS_SAVED_VISITED`, labels).
4. `lib/map-core/pin-status-images.ts` — bitmaps `FLOWYA_PIN_*`; colores desde `mapPinSpotPalette`, sin hex duplicados.
5. `components/design-system/map-pins.tsx` — `MapPinSpot`, `MapPinLocation`, vitrina; **paridad obligatoria** con lo anterior.
6. `components/explorar/MapCoreView.tsx` — markers React (preview, usuario).
7. `app/design-system.web.tsx` — sección Map pins.

**Anti-regresión:** si el DS y el mapa divergen, casi siempre alguien usó `pin.default` / `pin.outline` para un pin en mapa. Los pins **default** en mapa usan **`mapPinSpot.default.*`**, no `pin.*` (salvo estados `to_visit`/`visited`, donde el relleno sigue `pin.planned` / `pin.visited` alineados al theme). Detalle en bitácora **321**.

---

## 1) Tamaños (`MAP_PIN_SIZES`, light)

Valores derivados de `Colors.light.mapPinSpot` y `getCompositePinMetrics` / `getUserLocationPinSize` — ver export en `map-pins.tsx`.

| Clave | Significado |
|-------|-------------|
| `location` | Punto usuario (`getUserLocationPinSize`) |
| `spot` / `spotSelected` | Diámetro círculo default (unselected / selected radius × 2) |
| `spotSavedRestOuter` / `spotSavedSelectedOuter` | Caja sprite guardados (por visitar/visitado) |
| `spotSavedRestDisc` / `spotSavedSelectedDisc` | Disco visible compuesto |
| `creating` / `existing` | Create spot (Scope G) |

No usar números mágicos en componentes nuevos: preferir tokens o `map-pin-metrics`.

---

## 2) Jerarquía de capas (stacking)

En `MapCoreView`:

1. **Spots** en mapa: capas nativas Mapbox (`useMapCore` / `spots-layer`), no Marker DOM.
2. **Ubicación del usuario** — Marker React + `MapPinLocation`.
3. **Preview** (crear spot, etc.) — Marker React + `MapPinSpot` (`defaultPinStyle="flowya_unlinked"` cuando `status === 'default'` para paridad con capas `DEFAULT_PLUS_*`).

---

## 3) `MapPinSpot` — reglas de paridad

| Estado | Modelo visual | Tokens / notas |
|--------|----------------|-----------------|
| `default` + `plain` | Solo círculo | `mapPinSpot.default.fill`, borde `default.stroke` → `selected.defaultStroke` si `selected` |
| `default` + `flowya_unlinked` | Círculo + «+» | Mismo relleno/borde; «+» con `default.plusText`, `plusHalo`, tamaños `unselected/selected.plusTextSize` |
| `to_visit` / `visited` | Sprite compuesto | `getCompositePinMetrics`; icono Pin/Check siempre visible (como bitmap Mapbox) |

**Labels:** con `status === 'default'`, texto bajo pin con `default.labelText` y halo `default.labelHalo` (bitácora 271). Otros estados: estilo reforzado según implementación actual en `map-pins.tsx`.

---

## 4) Animaciones (`MapPinSpot`)

| Transición | Duración | Easing |
|------------|----------|--------|
| selected ↔ unselected (tamaño círculo / compuesto) | 200 ms | `Easing.out(Easing.cubic)` |
| Hover (scale ~1.08, solo reposo) | 100 ms | idem |
| Press (scale ~0.95, solo reposo) | 100 ms | idem |

---

## 5) Componentes auxiliares

- **MapPinLocation** — `getUserLocationPinSize`.
- **MapPinCreating / MapPinExisting** — Create Spot; proporciones desde `mapPinSpot` donde aplica.

### Preview en `MapCoreView`

- `previewPinState` y `MapPinSpot` con `defaultPinStyle` acorde a `status` (ver código).

---

## 6) Imágenes Mapbox (`FLOWYA_PIN_*`)

- Registro: `style-image-fallback` + `installStyleImageFallback(map, { mapPinPalette })` con paleta light/dark según `isDarkStyle` (`useMapCore`).
- Al cambiar tema del mapa, las imágenes se regeneran desde `palette`.

---

## 7) Guía labels en mapa (spots-layer)

- `text-offset` / `text-size` dinámicos según `selected` y `mapPinSpot` (ver `spots-layer`).
- Cambios en labels: actualizar **tanto** `spots-layer` como, si aplica, labels en `MapPinSpot` para default.

---

## 8) Referencias históricas

- **096** — tamaños, animaciones.  
- **095** — MapPinFilter.  
- **268–271** — default Flowya sin POI, color, label.  
- **305** — pins por visitar / visitados compuestos.  
- **321** — paridad DS ↔ Mapbox, `map-pin-metrics`, contrato unificado.

---

## 9) Reglas de visibilidad linking (Track A)

- Ver secciones 7–8 del contrato anterior: filtros `all` / `saved` / `visited`, `forceVisible`, zoom mínimo default unlinked (`DEFAULT_UNLINKED_MIN_ZOOM`), etc. La lógica de producto no cambia por la paridad visual; solo se documenta aquí que los **colores** del pin default visible siguen `mapPinSpot.default`.
