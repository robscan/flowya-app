# Bitácora 009 (2026/02) — Estados activos de controles de mapa

**Micro-scope:** B1-MS8  
**Estado:** Cerrado  
**Archivos tocados:** `app/(tabs)/index.web.tsx`, `components/design-system/map-controls.tsx`

---

## Objetivo

Implementar un estado activo visual (fondo azul) unificado para los tres controles de mapa (Ver el mundo, Encuadre contextual, Ubicación actual): se activa al tocar el control y se desactiva automáticamente cuando el usuario hace pan/zoom en el mapa. No se cambia la lógica de encuadres.

---

## Cambios realizados

### index.web.tsx

- **Eliminado:** `activeViewWorld` (useState) y `viewWorldFlyingRef` (useRef), usados hasta ahora solo para el control "Ver el mundo".
- **Estado unificado:** `activeMapControl` con `useState<'world' | 'contextual' | 'location' | null>(null)`.
- **Ref única:** `programmaticMoveRef` para marcar que el próximo `moveend` proviene de una acción de control (y no debe desactivar el estado hasta después de ese moveend).
- **Activación en handlers:** al inicio de `handleViewWorld`, `handleReframeSpot`, `handleReframeSpotAndUser` y `handleLocate` se hace `programmaticMoveRef.current = true` y `setActiveMapControl('world' | 'contextual' | 'location')` antes de ejecutar flyTo/fitBounds.
- **Desactivación en moveend:** en el listener `moveend` existente, si `programmaticMoveRef.current` se pone a false (animación del control terminada); si no, `setActiveMapControl(null)` (interacción manual del usuario).
- **MapControls:** se pasa `activeMapControl={activeMapControl}` en lugar de `activeViewWorld`.

### map-controls.tsx

- **Tipo exportado:** `export type ActiveMapControl = 'world' | 'contextual' | 'location' | null`.
- **Prop unificada:** reemplazo de `activeViewWorld?: boolean` por `activeMapControl?: ActiveMapControl | null`.
- **Selected por control:** Globe `selected={activeMapControl === 'world'}`, Encuadre contextual `selected={activeMapControl === 'contextual'}`, Ubicación `selected={activeMapControl === 'location'}`.

---

## Criterio de cierre

- Al tocar Ver el mundo / Encuadre contextual / Ubicación: ese control queda activo (azul).
- Al mover el mapa manualmente: todos los controles vuelven a inactivo.
- No hay estados pegados.
- **npm run build:** OK.

---

## Rollback

Revert del commit del micro-scope. Sin migraciones; estado previo recuperable.
