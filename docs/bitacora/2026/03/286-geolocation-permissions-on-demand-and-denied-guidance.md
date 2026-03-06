# 286 — Geolocalización on-demand + guía explícita en permiso denegado

Fecha: 2026-03-06  
Tipo: Fix transversal UX/runtime  
Área: `explore`, `spot-detail`, `map-location-picker`, `map-controls`

## Contexto

La app pedía ubicación automáticamente en carga en varias superficies. Esto generaba fricción inicial y percepción invasiva.  
Se definió política única: pedir ubicación solo cuando el usuario toca `Mi ubicación`.

## Cambios aplicados

1. Capa común de geolocalización:
- nuevo módulo `lib/geolocation/request-user-location.ts`;
- estado de permiso normalizado (`granted|prompt|denied|unsupported`);
- request tipado con estados de error (`denied|timeout|unavailable|unknown`).

2. Explore:
- `useMapCore` ya no ejecuta `tryCenterOnUser` en `onMapLoad`;
- `handleLocate` usa helper común y retorna resultado para UI;
- `MapScreenVNext` muestra toast guía en `denied` y toast de error temporal en `timeout/unavailable`.

3. Spot Detail:
- se eliminó request automático al cargar;
- `Centrar en mi ubicación` ahora solicita on-demand y actualiza `userCoords` para distancia;
- distancia queda oculta hasta obtener ubicación.

4. Map Location Picker:
- se eliminó auto-centrado por ubicación en `onMapLoad`;
- `MapControls` recibe `onLocate` explícito y usa helper común;
- en éxito se centra y posiciona pin en coords del usuario.

5. MapControls:
- se retiró fallback geoloc interno cuando no llega `onLocate`;
- el contenedor queda como fuente única de política de permisos.

## Evidencia

- `lib/geolocation/request-user-location.ts`
- `hooks/useMapCore.ts`
- `components/explorar/MapScreenVNext.tsx`
- `app/spot/[id].web.tsx`
- `components/design-system/map-location-picker.tsx`
- `components/design-system/map-controls.tsx`
- `docs/ops/plans/PLAN_FIX_GEOLOCATION_PERMISSIONS_INTENT_DRIVEN_2026-03-06.md`

## Validación mínima

- `npm run lint -- --no-cache hooks/useMapCore.ts components/explorar/MapScreenVNext.tsx app/spot/[id].web.tsx components/design-system/map-location-picker.tsx components/design-system/map-controls.tsx lib/geolocation/request-user-location.ts`

Resultado esperado:
- sin errores bloqueantes en archivos tocados.

## Nota de rollback

Revertir este fix restaura solicitudes automáticas al cargar y elimina la guía explícita en `denied`.  
No afecta esquema de datos ni contratos de persistencia.
