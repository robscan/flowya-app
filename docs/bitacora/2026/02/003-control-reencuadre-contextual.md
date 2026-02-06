# Bitácora 003 (2026/02) — Control de reencuadre contextual

**Scope:** map-contextual-reframe-control-v1  
**Rama:** scope/map-contextual-reframe-control-v1  
**Estado:** Cerrado  
**Tipo:** Control único de reencuadre con comportamiento contextual (sin spot / con spot) y z-index ubicación usuario.

---

## Objetivo del scope

- Un solo botón de reencuadre (mismo ícono, misma posición): comportamiento según contexto.
- Sin spot seleccionado: reencuadra todos los spots visibles + ubicación del usuario (comportamiento original “Ver todos”).
- Con spot seleccionado: ciclo alternado en cada tap → reencuadrar solo el spot ↔ reencuadrar spot + ubicación del usuario.
- Ubicación del usuario siempre visible por encima de pins/markers (z-index más alto del mapa).

---

## Verificación funcional

- **Control único:** Un solo ícono (FrameWithDot), una sola posición, un solo render en MapControls. No hay duplicación por estado.
- **Sin spot seleccionado:** El botón reencuadra todos los spots visibles (comportamiento original).
- **Con spot seleccionado:**
  - Tap 1 → reencuadra solo el spot (flyTo con zoom fijo).
  - Tap 2 → reencuadra spot + ubicación del usuario (fitBounds o flyTo según puntos).
  - Tap 3 → vuelve a reencuadrar solo el spot. El ciclo se repite correctamente.
- **Cambio de spot:** Al cambiar de spot seleccionado, el ciclo se reinicia (primer tap = solo spot).
- **Ubicación del usuario:** Tiene el z-index más alto del mapa; siempre visible incluso en zonas saturadas de pins.

---

## Verificación técnica

- No se duplicaron íconos ni controles.
- No se añadieron animaciones nuevas; se usan únicamente flyTo / fitBounds existentes.
- Consola limpia (sin warnings ni logs).
- No se tocaron Search, Create Spot ni SpotCard.
- Ajustes previos del scope: duración de animación en handleViewAll (caso un punto) en ms; constante SPOT_FOCUS_ZOOM; ícono y accessibilityLabel del botón sin cambios de copy.

---

## Archivos tocados

- **app/(tabs)/index.web.tsx:** `handleReframeSpot`, `handleReframeSpotAndUser`, paso de `selectedSpot` y callbacks a MapControls; Marker de ubicación usuario con `style={{ zIndex: 9999 }}`.
- **components/design-system/map-controls.tsx:** Props `selectedSpot`, `onReframeSpot`, `onReframeSpotAndUser`; lógica unificada en un solo botón (`handleViewAllOrReframe`) con ciclo spot ↔ spot+user vía ref; sin JSX condicional duplicado.

---

## Riesgos

Ninguno identificado.

---

## Rollback

Revertir la rama `scope/map-contextual-reframe-control-v1` sin efectos colaterales: se restaura el botón “Ver todos” con comportamiento único (solo fitBounds de spots + usuario) y el Marker de usuario sin z-index explícito. No hay cambios de modelo de datos ni de otras pantallas.

---

## Cierre

**Scope cerrado:** map-contextual-reframe-control-v1.  
**Riesgo:** ninguno.  
**Rollback:** revertir rama; sin efectos colaterales.
