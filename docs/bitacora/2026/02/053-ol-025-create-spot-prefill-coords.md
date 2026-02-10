# Bitácora 053 (2026/02) — OL-025: Create spot prefill coords from query

**Rama:** `chore/explore-quality-2026-02-09` (mismo PR del día)  
**Objetivo:** Que el wizard Create Spot use lat/lng de la query para prefill de ubicación y no se pierda la intención del long-press.

---

## 1) Síntoma

- Long-press ya navega a `/create-spot?lat=...&lng=...` (OL-022/024).
- El wizard leía params para `initialLatitude`/`initialLongitude` y `selectedPlace`, pero el estado `location` (MapLocationPickerResult) se inicializaba en `null`.
- La ubicación “seleccionada” para el flujo de creación no quedaba prefilled; el usuario debía confirmar en el mapa (correcto) pero el estado interno no reflejaba las coords entrantes hasta confirmar.

---

## 2) Fix

- **Archivo:** `app/create-spot/index.web.tsx`.
- **Lógica existente:** `initialParamsRef` ya parsea `params.lat` y `params.lng` a float y los guarda en `initial.lat` / `initial.lng`. `selectedPlace` se inicializa desde `initial` cuando hay lat/lng.
- **Cambio:** Inicializar `location` (useState) con una función: si `initial.lat` e `initial.lng` existen y son válidos, devolver `{ latitude: initial.lat, longitude: initial.lng, address: null }`; si no, `null`.
- No se llama a Mapbox reverse en este prefill; solo coords. El reverse sigue en el flujo normal del MapLocationPicker si aplica.
- Mobile: el wizard completo es web-only (index.tsx es placeholder); no cambio en native.

---

## 3) Pruebas

- **Con params:** Abrir `/create-spot?lat=20.5&lng=-87.2` (logged in). Paso 1 debe mostrar el mapa centrado en esas coords; `location` ya tiene esas coords; al confirmar ubicación se avanza a paso 2 y el spot se crea con esa ubicación.
- **Sin params:** Abrir `/create-spot` (logged in). `location` inicial `null`; flujo normal (elegir/confirmar en mapa).
- **Long-press E2E:** Long-press en mapa vNext → confirm modal → Crear spot → wizard abre con coords del long-press prefilled; confirmar ubicación y completar; el spot queda en el punto elegido.
