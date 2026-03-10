# 302 — OL-URGENT-MAKI-001: iconos Maki en listas y pins del mapa

**Fecha:** 2026-03-09  
**Tipo:** Ajuste urgente  
**Estado:** Abordado (listas + mapa)

## Problema

1. **Listas:** ResultRow y SearchResultCard mostraban MapPin genérico en items sin imagen; la categoría (`place.maki` / `spot.linked_maki`) no se usaba.
2. **Mapa:** Los pins Flowya con `linked_maki` (ej. Vondelpark parque) solo mostraban icono maki si el spot estaba `to_visit` o `visited`; spots en estado `default` con `linked_maki` no mostraban icono de categoría.

## Solución implementada

### Listas

1. **`lib/maki-icon-mapping.ts`** — Mapeo maki → Lucide (park → TreePine, museum → Landmark, etc.). Fallback: MapPin.
2. **`SearchListCard`** — Prop `maki`. Usa `getMakiLucideIcon(maki)` cuando no hay imagen.
3. **`ResultRow`** / **`SearchResultCard`** — Pasan `place.maki` o `spot.linked_maki`.

### Pins del mapa

4. **`lib/map-core/spots-layer.ts`** — Nueva propiedad GeoJSON `hasLinkedMaki` y filtro `filterMakiVisible()`:
   - Antes: maki solo para `pinStatus in ['to_visit','visited']`
   - Ahora: maki para `(to_visit|visited) OR (default AND hasLinkedMaki)`
   - Permite que spots en estado default con `linked_maki` (ej. parque recién creado) muestren icono de categoría en el mapa.

## Archivos modificados

- `lib/maki-icon-mapping.ts`
- `components/design-system/search-list-card.tsx`
- `components/design-system/search-result-card.tsx`
- `components/explorar/MapScreenVNext.tsx`
- `lib/map-core/spots-layer.ts`

## Ajustes posteriores (iconos no visibles en mapa)

- **coalesce** en `icon-image`: `['coalesce', ['image', ['get','makiIcon']], ['image','marker-15']]` para fallback robusto.
- **style-image-fallback**: preload de marker-15, flowya-fallback-generic, flowya-fallback-park, flowya-fallback-museum, flowya-fallback-monument; soporte para IDs maki (park-15, etc.).
- **makiIconSize** aumentado: 0.8→1.0 (unselected), 0.95→1.2 (selected).

## Notas

- Con `EXPO_PUBLIC_FF_HIDE_LINKED_UNSAVED=true` (default), los spots default+linked suelen estar ocultos; el cambio de filtro maki aplica cuando el flag está off o cuando el spot pasa a to_visit/visited.
- **Persistencia `linked_maki`:** Create-from-search ya persiste `linked_maki` (poi.maki → insertPayload, bitácora 129). Verificado en MapScreenVNext líneas 2091, 2396, 2502, 2540.
