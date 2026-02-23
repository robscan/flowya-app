# Bitácora 103 (2026/02) — MS-B: Pin visible en Paso 0

**Fecha:** 2026-02-14

**Objetivo:** Mostrar el pin en el mapa en la posición exacta donde se creará el spot mientras el overlay Paso 0 (nombre) está visible.

---

## Cambios realizados

- **`components/explorar/MapCoreView.tsx`:**
  - Nueva prop `previewPinCoords?: { lat: number; lng: number } | null`.
  - Cuando se proporciona, se renderiza un Marker con MapPinSpot (status default, selected) en esa posición — más grande para mayor visibilidad. Label del pin = `previewPinLabel` (actualizado en tiempo real conforme el usuario escribe). No interactivo.
- **`components/explorar/MapScreenVNext.tsx`:**
  - Estado `createSpotNameValue` para el valor actual del input. Sync al abrir/cerrar Paso 0.
  - Pasa `previewPinCoords` y `previewPinLabel` a MapCoreView.
  - CreateSpotNameOverlay: prop `onValueChange={setCreateSpotNameValue}`.
- **`components/explorar/CreateSpotNameOverlay.tsx`:**
  - Prop opcional `onValueChange?: (value: string) => void` — se llama en cada cambio del input.
- **`docs/contracts/CREATE_SPOT_PASO_0.md`:** Añadida regla del pin de preview en sección E; archivos clave actualizados.
- **Botón Paso 0:** "Continuar" → "Continuar y ajustar ubicación" (indica que podrá ajustar ubicación en el mapa).
