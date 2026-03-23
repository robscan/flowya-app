# 313 — Explore: retirar slogan de entrada al abrir búsqueda, filtros o sheets

Fecha: 2026-03-22
Tipo: Fix UX / z-order (slogan intro vs overlays)

## Contexto
El letrero animado «SIGUE LO QUE / TE MUEVE» (entrada a Explore) quedaba por encima del dropdown de filtros en capa y podía solaparse también al abrir búsqueda full-screen, sheet de países o el sheet de spot en estados `medium` / `expanded`. Se pidió interrumpir la intro y ocultar el mensaje sin volver a mostrarlo al cerrar el menú de filtros.

## Cambios aplicados
- `dismissEntrySlogan` en `MapScreenVNext`: detiene la animación compuesta, resetea opacidad/translate y pone `showEntrySlogan` en falso.
- Efecto que llama a `dismissEntrySlogan` cuando hay búsqueda abierta, sheet de países o sheet de spot/POI en `medium`/`expanded`.
- Condición de render del overlay del slogan que excluye esos estados (`entrySloganOccludedByOverlay`) para evitar un frame visible antes del efecto.
- `MapPinFilter` expone `onOpenChange(open)`; al abrir o cerrar el menú se notifica de forma sincrónica en el mismo ciclo del toggle/cierre; el padre despacha `dismissEntrySlogan` cuando `open === true`.

## Evidencia (archivos)
- `components/explorar/MapScreenVNext.tsx`
- `components/design-system/map-pin-filter.tsx`

## Validación mínima
- `npx tsc --noEmit`
- Explorar: durante la intro, abrir filtro / búsqueda / países / sheet de spot — el slogan debe desaparecer de inmediato y no reaparecer al cerrar solo el filtro.

## Rollback
Quitar `dismissEntrySlogan`, el efecto asociado, la guarda de render, la prop `onOpenChange` en `MapPinFilter` y el wiring en `MapScreenVNext`.
