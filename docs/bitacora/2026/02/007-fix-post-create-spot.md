# Bitácora 007 (2026/02) — Fix canónico post–Create Spot (mapa ↔ card coherentes)

**Micro-scope:** B1-MS7  
**Estado:** Cerrado  
**Archivo tocado:** `app/(tabs)/index.web.tsx`

---

## Objetivo

Restaurar coherencia mapa–card tras un guardado exitoso en Create Spot: al volver al mapa, el spot recién creado debe quedar seleccionado y reencuadrado, con la card visible y activa, sin reencuadrar a la ubicación del usuario.

---

## Problema observado

Tras Create Spot exitoso el sistema podía: regresar al mapa sin foco claro, reencuadrar a la ubicación del usuario (por `tryCenterOnUser` en `onMapLoad`) o no reencuadrar al spot creado. Solo se hacía `setSelectedSpot(spot)` y se limpiaba el param de inmediato, sin paso explícito de encuadre.

---

## Cambios realizados

1. **Constantes de encuadre:** `FIT_BOUNDS_PADDING`, `FIT_BOUNDS_DURATION_MS` y `SPOT_FOCUS_ZOOM` se movieron por encima del efecto de `params.created` para reutilizarlas en el reframe post-create sin duplicar lógica.

2. **onMapLoad:** `tryCenterOnUser(map, setUserCoords)` se ejecuta solo cuando `!params.created`, para no reencuadrar al usuario al volver con un spot recién creado.

3. **Efecto `params.created`:** Tras refetch y `setSelectedSpot(spot)`, si hay `mapInstance` y `spot` se llama a `mapInstance.flyTo(...)` (mismo center/zoom/duración que `handleReframeSpot`) y después `router.replace('/(tabs)')`. Si no hay `mapInstance` aún, no se limpia el param.

4. **Segundo efecto:** Cuando `params.created` está set, hay `mapInstance` y `selectedSpot` con `selectedSpot.id === params.created`, se ejecuta `flyTo(selectedSpot)` y `router.replace('/(tabs)')`, de modo que si el mapa se monta después del refetch se encuadra al spot creado y se limpia el param.

---

## Criterio de cierre

- Crear spot → vuelta al mapa; spot recién creado seleccionado y reencuadrado; card visible y coherente.
- No se reencuadra a la ubicación del usuario en este flujo.
- **npm run build:** OK.

---

## Rollback

Revert del commit del micro-scope. Sin migraciones; estado previo recuperable.
