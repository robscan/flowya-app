# 161 — Deep link share: priorizar encuadre de spot sobre auto-center en usuario

Fecha: 2026-02-25

## Contexto

Bug activo (`OL-P1-005`): al abrir link compartido (`spotId + sheet=medium`) se seleccionaba spot correcto, pero mapa podía quedar centrado en usuario.

## Causa técnica

- `tryCenterOnUser` en `onMapLoad` puede resolver tarde (geoloc async) y hacer `flyTo` al usuario después de iniciar el intake de deep link.
- El foco en spot dependía de un efecto con params que puede competir con limpieza de URL.

## Implementación

Archivos:

- `lib/map-core/constants.ts`
- `hooks/useMapCore.ts`
- `components/explorar/MapScreenVNext.tsx`

Cambio:

1. `tryCenterOnUser` acepta guard dinámico `shouldCenter()` para bloquear `flyTo` tardío en usuario.
2. `useMapCore` expone `shouldCenterOnUser` en options y lo usa al resolver geoloc.
3. `MapScreenVNext` agrega lock de deep link (`deepLinkCenterLockRef`) y lo activa cuando hay `spotId/created`.
4. Intake de deep link ahora encola y ejecuta foco explícito de cámara al spot (`queueDeepLinkFocus`) al aplicar spot/created.
5. Si mapa aún no está listo, el foco queda pendiente y se ejecuta al montar `mapInstance`.

## Resultado esperado

- En entrada por share deep link, el mapa prioriza encuadre del spot compartido.
- Auto-center en usuario no pisa el foco del deep link.

## Validación mínima

- `npm run lint` OK.

