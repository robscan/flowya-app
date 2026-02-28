# 212 — Cierre OL-WOW-F2-004 Sheet intent model + CTA contextual

Fecha: 2026-02-28  
Tipo: cierre operativo / OL-WOW-F2-004

## Contexto
OL-WOW-F2-004: cada estado del sheet con objetivo explícito (awareness/decision/detail); CTA principal contextual visible en `medium`.

## Implementación

### CTA contextual por filtro y estado del lugar
- **Spot sin marcar + Filtro Todos:** dos pills (Por visitar | Visitado).
- **Spot sin marcar + Filtro Por visitar:** solo pill Por visitar.
- **Spot sin marcar + Filtro Visitados:** solo pill Visitado.
- **Spot Por visitar / Visitado:** lógica existente (toggle).

### Cambios técnicos
- **MapScreenVNext:** `handleSavePin(spot, targetStatus?)`, `handleCreateSpotFromPoi(initialStatus?)`; pasa `pinFilter`, `onPoiVisitado`.
- **SpotSheet:** prop `pinFilter`; `MediumBodyContent` y `PoiBodyContent` con CTAs contextuales.
- **EXPLORE_SHEET.md:** regla documentada (CTA contextual por filtro y estado).

### Toasts conversacionales
- Mensajes más naturales: "Agregado a Por visitar", "¡Marcado como visitado!", "Listo, ya no está en tu lista", "Explorando todo", etc.
- Errores: "Ups, no se pudo guardar. ¿Intentas de nuevo?"

## Criterios de aceptación
- [x] Cada estado tiene objetivo explícito (peek/medium/expanded).
- [x] CTA principal contextual visible en `medium` según filtro activo.
- [x] Permite marcar Visitado directamente sin pasar por Por visitar.
- [x] QA de recorrido: menos confusión en toma de decisión.

## Archivos relevantes
- components/explorar/SpotSheet.tsx (pinFilter, MediumBodyContent, PoiBodyContent)
- components/explorar/MapScreenVNext.tsx (handleSavePin, handleCreateSpotFromPoi, toasts)
- app/spot/[id].web.tsx (toasts)
- app/spot/edit/[id].web.tsx, edit/[id].tsx (toasts)
- docs/contracts/EXPLORE_SHEET.md

## Resultado
- OL-WOW-F2-004 cerrado. Sheet intent model + CTA contextual operativos.
