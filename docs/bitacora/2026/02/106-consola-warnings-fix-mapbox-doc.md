# Bitácora 106 — Fix consola (pointerEvents, useNativeDriver) + doc alertas Mapbox

**Fecha:** 2026-02-14

## Objetivo

Resolver avisos de consola molestos y documentar alertas Mapbox para revisión posterior.

---

## Cambios aplicados

### 1. `props.pointerEvents is deprecated. Use style.pointerEvents` (MapPinFilter)

**Archivo:** `components/design-system/map-pin-filter.tsx`

- `Animated.View` (backdrop): `pointerEvents` pasado de prop a `style`.
- `View` (menuContainer): mismo cambio.

```tsx
// Antes
<Animated.View style={[styles.backdrop, backdropAnimatedStyle]} pointerEvents={open ? 'auto' : 'none'}>
<View style={styles.menuContainer} pointerEvents={open ? 'auto' : 'none'}>

// Después
<Animated.View style={[styles.backdrop, backdropAnimatedStyle, { pointerEvents: open ? 'auto' : 'none' }]}>
<View style={[styles.menuContainer, { pointerEvents: open ? 'auto' : 'none' }]}>
```

### 2. `useNativeDriver is not supported... Falling back to JS-based animation` (web)

**Archivo:** `components/explorar/CreateSpotNameOverlay.tsx`

- `Animated.timing` usaba `useNativeDriver: true`. En web no hay driver nativo → warning.
- Cambio: `useNativeDriver: Platform.OS !== 'web'` para desactivar en web y evitar el fallback ruidoso.

### 3. Intervención `[Intervention] cancel touchmove`

**Decisión:** No tocar. Alto riesgo de afectar gestos del mapa (pan/zoom) en móvil.

---

## Documentado para revisión posterior (Mapbox)

Alertas que aparecen en consola al cargar el mapa (Mapbox GL style/featureset). No bloquean; revisar al actualizar mapbox-gl o al cambiar el estilo del mapa.

| Aviso | Descripción |
|-------|-------------|
| `featureNamespace place-A of featureset place-labels's selector...` | Relacionado con el selector de featureset `place-labels` del estilo Mapbox. Posible incompatibilidad entre versión mapbox-gl y estilo. |
| `Ignoring unknown image variable "background"` | El estilo referencia variables de imagen no reconocidas. |
| `Ignoring unknown image variable "background-stroke"` | Idem. |
| `Ignoring unknown image variable "icon"` | Idem. |

**Acción sugerida:** Al actualizar `mapbox-gl` o el estilo del mapa, verificar si estas alertas desaparecen o requieren ajustes en el JSON del estilo.

**Referencia:** OPEN_LOOPS → OL-MAPBOX-001
