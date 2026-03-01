# 242 — Filtro dropdown + retardo hasta settle de cámara (flyTo/fitBounds)

Fecha: 2026-03-01  
Scope: Explore / MapScreenVNext / filtros de mapa

## Contexto

Se identificó un punto crítico de UX: el dropdown de filtros podía aparecer mientras la cámara aún estaba en transición (`flyTo` / `fitBounds` / load), provocando ruido visual y percepción de “UI desincronizada”.

Además, faltaba documentación explícita de:

- reglas del dropdown (anclaje, apertura arriba/abajo, visibilidad por contexto),
- regla de retardo/gating del filtro hasta que la cámara se estabiliza.

## Objetivo

1. Dejar trazado canónico del comportamiento del dropdown en mapa.
2. Declarar la regla runtime “esperar settle de cámara antes de mostrar filtros”.
3. Evitar regresiones donde filtro/menú compitan visualmente con navegación de cámara.

## Implementación consolidada (runtime actual)

Archivo principal: `components/explorar/MapScreenVNext.tsx`

### A) Gating de visibilidad del dropdown

`shouldShowFilterDropdown` exige simultáneamente:

- `!createSpotNameOverlayOpen`
- `!searchV2.isOpen`
- `!isFilterWaitingForCamera`
- anclaje válido (`filterTop >= filterMinimumTop`)

Resultado: no se renderiza dropdown durante flujos de Create Spot, Search o transición de cámara.

### B) Espera explícita hasta settle de cámara

Estado/refs:

- `isFilterWaitingForCamera`
- `filterWaitActiveRef`
- `filterWaitFallbackTimerRef`

Mecánica:

1. Antes de navegación programática se llama `suspendFilterUntilCameraSettles()`.
2. Al actualizar `viewportNonce` (movimiento asentado), se libera espera con retardo corto (`FILTER_WAIT_RELEASE_DELAY_MS`).
3. Guardrail de fallback: auto-release por timeout (`FILTER_WAIT_FOR_CAMERA_FALLBACK_MS`) para evitar bloqueo si no llega evento esperado.

Resultado: el filtro reaparece cuando la cámara ya es legible para el usuario, sin “parpadeo” en medio de fly/fit.

### C) Puntos donde se activa la espera

- `flyToUnlessActMode` (wrapper canónico de fly programático).
- `handleMapLoadWithFilterDelay` (carga inicial mapa).
- `handleLocateWithFilterDelay` (control ubicación actual).
- `handleViewWorldWithFilterDelay` (control mundo).
- Reencuadres contextuales (`handleReframeContextual`, `handleReframeContextualAndUser`).
- Interacciones del mapa mundial de países (fitBounds por país).

### D) Animación de entrada del dropdown (post-settle)

- Primer reveal con delay (`FILTER_OVERLAY_ENTRY_DELAY_MS`) para suavizar aparición tras transición.
- Entrada con timing controlado (`FILTER_OVERLAY_ENTRY_DURATION_MS`, `translateY + opacity`).
- Reveals subsecuentes sin delay inicial extra (evita latencia innecesaria).

## Reglas UX del dropdown documentadas

1. El menú abre arriba o abajo según espacio disponible (`shouldOpenFilterMenuUp`) para no colisionar con sheet/viewport.
2. El anclaje del trigger se calcula con top del sheet activo para mantener continuidad con SpotSheet.
3. Si no hay condiciones de legibilidad (camara en tránsito), el dropdown no debe mostrarse.

## Contratos actualizados

- `docs/contracts/explore/FILTER_RUNTIME_RULES.md`
- `docs/contracts/explore/MAP_RUNTIME_RULES.md`

## Validación recomendada (manual)

1. Ejecutar `Locate` y `View World`: filtro debe ocultarse durante transición y reaparecer al estabilizar cámara.
2. Cambiar filtro con reencuadre programático: sin parpadeo de menú en medio del fly.
3. Con Search abierto o Paso 0 activo: dropdown no debe renderizarse.
4. En bordes de pantalla/sheet alto: menú del dropdown debe invertir apertura (up/down) correctamente.

## Estado

- Regla de retardo hasta settle de cámara documentada y canonizada.
- Comportamiento del dropdown formalizado para evitar regresiones.
