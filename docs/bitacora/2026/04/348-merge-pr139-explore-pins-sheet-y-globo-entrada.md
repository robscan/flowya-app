# 348 — Merge PR 139: pins del sheet (Explorar) y animación de entrada del globo

Fecha: 2026-04-12  
Tipo: merge / bugfix UX + rendimiento  
PR: https://github.com/robscan/flowya-app/pull/139 (squash a `main`)

## Alcance

### Pins «Por visitar» / «Visitado» (SpotSheet)

- Feedback más inmediato al guardar; spinner solo en la pill de la acción pulsada.
- Menos parpadeo y doble render entre pills al actualizar estado.
- `lib/pins.ts`: uso de sesión/usuario coherente con mutaciones (`preloadedUserId` / helpers) para reducir latencia percibida.

### Mapa — animación de entrada del globo (regresión «mapa estático»)

**Síntoma:** el zoom out inicial al «mundo» no se ejecutaba; el mapa parecía fijo al abrir Explorar.

**Causas técnicas documentadas:**

1. `programmaticFlyTo` en un `setTimeout` podía cerrar sobre un render con `mapInstance === null` → el `flyTo` no hacía nada.
2. El `useEffect` del arranque incluía dependencias inestables (`programmaticFlyTo`, `suspendFilterUntilCameraSettles`): el cleanup cancelaba el delay de 160 ms antes de ejecutarse.
3. En `onMapLoad`, `applyGlobeAndAtmosphere` (proyección globo / niebla) podía disparar `movestart` sin `programmaticMoveRef`, activando `onUserMapGestureStart` y anulando la secuencia de entrada.

**Fix:**

| Archivo | Cambio |
|---------|--------|
| `hooks/useMapCore.ts` | `programmaticMoveRef.current = true` antes de `applyGlobeAndAtmosphere` en `onMapLoad`. |
| `components/explorar/MapScreenVNext.tsx` | Refs (`programmaticFlyToRef`, `mapInstanceRef`, `suspendFilterUntilCameraSettlesRef`, `shouldSkipGlobeEntryMotionRef`); efecto de entrada con deps mínimas `[mapInstance, shouldSkipGlobeEntryMotion]`; timeout llama al `flyTo` actual vía refs. |

### Letrero «SIGUE LO QUE / TE MUEVE»

- Ajustes de visibilidad/estilo en la misma ventana de trabajo (alineación con comportamiento esperado en welcome/sheet); detalle en commits de la rama previa al squash.

## Archivos tocados en el merge (squash)

- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/SpotSheet.tsx`
- `hooks/useMapCore.ts`
- `lib/pins.ts`

## Sanidad

- `npx tsc --noEmit` OK en el momento del cierre del PR.

## Referencia

- Esta bitácora: `docs/bitacora/2026/04/348-merge-pr139-explore-pins-sheet-y-globo-entrada.md`
- Índice PR #130–#139: [`349`](349-indice-trazabilidad-pr-130-139-2026-04.md)
- Relacionada (entrada animada mapa / controles, contexto histórico): `docs/bitacora/2026/03/254-fix-map-controls-entrada-animada-real-y-sin-salto-inicial.md`
