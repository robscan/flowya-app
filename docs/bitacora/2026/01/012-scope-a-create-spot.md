# Bitácora: Scope A — Create Spot (MVP)

**Fecha:** 2026-02-01

## Objetivo

Implementar el flujo Create Spot (core loop MVP): selección de ubicación en mapa, reverse geocoding una vez, persistencia de address, wizard 1 campo por pantalla, consola limpia.

## Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `components/design-system/map-location-picker.tsx` | MapLocationPicker: mapa, un pin, CTA «Confirmar ubicación», estados empty/selecting/confirmed. Al confirmar llama reverseGeocode y retorna `{ latitude, longitude, address }`. |
| `app/create-spot/index.web.tsx` | Wizard Create Spot: 5 pasos (ubicación, título, descripción corta, descripción larga, crear). Un input por pantalla. Insert en `spots`, vuelve a mapa con `?created=id`. |
| `docs/bitacora/2026/01/012-scope-a-create-spot.md` | Esta bitácora. |

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `lib/mapbox-geocoding.ts` | Export `reverseGeocode` (alias de `resolveAddress`) para Scope A. |
| `components/design-system/index.ts` | Export MapLocationPicker y tipos. |
| `app/_layout.tsx` | Stack.Screen `create-spot` con título «Crear spot». |
| `app/(tabs)/index.web.tsx` | FAB «Crear spot» (navega a /create-spot). Refetch spots y efecto para `?created=id`: selecciona el nuevo spot y abre SpotCard. |
| `app/design-system.web.tsx` | Showcase MapLocationPicker y sección «Create Spot Wizard (Scope A)» con descripción del flujo. |

## Decisiones

- **MapLocationPicker**: Un solo pin; tap en mapa coloca o mueve. No pin fijo con mapa moviéndose. Reverse geocoding solo al confirmar (no al colocar pin).
- **Wizard**: Pantallas secuenciales con header dinámico (`setOptions` por paso). Validación mínima: ubicación + título. Si reverse geocoding falla, `address = null` y el spot sigue siendo válido.
- **Vuelta al mapa**: `router.replace('/(tabs)?created=' + newId)`. El mapa lee `params.created`, refetch spots, busca el spot por id, `setSelectedSpot(spot)`, luego `router.replace('/(tabs)')` para quitar el query.
- **FAB**: Abajo a la izquierda para no solapar controles del mapa (derecha) ni tab bar.

## Reglas respetadas

- No mostrar lat/lng en UI.
- Reverse geocoding solo al confirmar ubicación.
- Address persistido en `spots.address` (columna ya existía).
- SpotCard y SpotDetail sin cambios estructurales; SpotDetail muestra «Ubicación» solo si `address` existe.
- No implementado: imágenes, pins (guardar/compartir), share, duplicados, bulk import.

## Pendientes explícitos

- **Scope C (imágenes)**: Cover image en creación/edición de spot; no incluido en Scope A.
- **Scope G (duplicados)**: Detección/evitar spots duplicados; no incluido en Scope A.

## Criterio de cierre

- [x] Crear spot funciona end-to-end (ubicación → título → desc. corta → desc. larga → crear).
- [x] Reverse geocoding se ejecuta una vez y se guarda en `spots.address`.
- [x] Address visible en Spot Detail solo cuando existe.
- [x] Design System actualizado (MapLocationPicker + descripción wizard).
- [ ] Consola sin errores ni warnings nuevos persistentes (verificar en ejecución; linter puede mostrar tipos preexistentes en index.web).
