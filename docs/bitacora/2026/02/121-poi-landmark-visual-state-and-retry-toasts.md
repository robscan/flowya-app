# Bitácora 121 — POI/Landmark: estado visual, badge y toasts de reintento

**Fecha:** 2026-02-25  
**Rama:** `codex/poi-landmark-visuals`  
**Relación:** Explore vNext, tap POI/landmark, creación desde POI

---

## Contexto

Se ajustó el comportamiento visual al tocar elementos de mapa para separar claramente:

- `POI`: estado temporal visual "por visitar" durante creación.
- `Landmark`: indicador pequeño tipo badge (arriba-derecha), sin reemplazar el landmark base.
- `Visitado`: sin cambios funcionales (se mantiene actualización de color del pin en spot FLOWYA).

Además, se reforzó el manejo de errores para evitar silencios en creación desde POI.

---

## Cambios aplicados

### 1) Tipado de feature tocado en mapa

En `MapScreenVNext` se definió `TappedMapFeature` con:

- `kind`: `poi | landmark`
- `visualState`: `default | to_visit`

Se agregó clasificación por `layer.id` + `properties` para distinguir landmark/poi al tap.

### 2) Visual diferenciada en `MapCoreView`

Se extendió el preview con:

- `previewPinKind`: `spot | poi | landmark`
- `previewPinState`: `default | to_visit`

Render:

- `spot`: pin FLOWYA existente (`MapPinSpot`).
- `poi`: dot circular (naranja en `to_visit`).
- `landmark`: badge dot desplazado (`+x, -y`) para no tapar el punto central.

### 3) Guardrail de consistencia (rollback visual)

En `handleCreateSpotFromPoi`:

- el estado visual `to_visit` se marca optimista al iniciar;
- si no se crea spot (error/duplicado/corte), vuelve a `default` automáticamente.

### 4) Estados de error con reintento (toast)

Se agregaron toasts explícitos para evitar fallos silenciosos:

- `No se pudo guardar el lugar. Intenta de nuevo.`
- `Se creó el lugar, pero no se pudo marcar como Por visitar. Intenta de nuevo.`

Aplicado en:

- `handleCreateSpotFromPoi`
- `handleCreateSpotFromPoiAndShare`

con `try/catch/finally` para asegurar cierre de loading y feedback.

---

## Archivos modificados

- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/MapCoreView.tsx`

---

## Criterios de cierre

- Lint OK en archivos tocados.
- POI/Landmark muestran indicador visual diferenciado.
- En error de creación desde POI, usuario recibe toast y estado visual temporal no queda colgado.

---

## Riesgos abiertos

- Clasificación `poi` vs `landmark` depende de `layer.id`/props del estilo y puede variar entre estilos.
- En zonas densas, `queryRenderedFeatures` puede elegir una feature no ideal en el primer match.
- Duplicado visual base (POI de basemap + señal FLOWYA) sigue siendo posible por cómo renderiza Mapbox features múltiples del mismo lugar.

---

## Nota de rollback

Revertir la rama restaura:

- preview único tipo pin (sin diferenciación `poi/landmark`);
- flujo anterior sin rollback de estado visual optimista;
- menor cobertura de toasts de reintento en creación desde POI.
