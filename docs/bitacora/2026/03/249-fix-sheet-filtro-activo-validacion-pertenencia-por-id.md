# 249 — Fix: apertura de SpotSheet con filtro activo (validación por pertenencia real)

Fecha: 2026-03-01
Tipo: bugfix runtime Explore

## Síntoma

Con filtro activo (`saved`/`visited`), al tocar un pin el SpotSheet podía cerrarse inmediatamente.

## Causa

El guardrail de cierre (para evitar sheet inválida) validaba `selectedSpot.saved/visited`.
En tap desde capa de mapa, el spot seleccionado puede llegar sin esos flags hidratados, provocando falso negativo y cierre inmediato.

## Fix

Archivo: `components/explorar/MapScreenVNext.tsx`

- La validación ahora usa pertenencia real por `id` contra `filteredSpots` activo:
  - `filteredSpots.some((spot) => spot.id === selectedSpot.id)`
- Se amplían dependencias del efecto para sincronizarse con `filteredSpots`.

## Resultado

- SpotSheet abre y permanece estable al tocar pin con filtro activo.
- Se mantiene regla de seguridad: si el spot realmente deja de pertenecer al filtro, el sheet se cierra.

## Sanidad

- `npm run lint -- --no-cache` OK.
