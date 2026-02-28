# 209 — Cierre OL-WOW-F2-003 Filtros como vistas de trabajo

Fecha: 2026-02-28  
Tipo: cierre operativo / OL-WOW-F2-003

## Contexto
OL-WOW-F2-003: comunicar filtros `Todos/Por visitar/Visitados` como intención, no switch técnico; pending-first navigation estable.

## Implementación
- **Toast de intención:** al seleccionar filtro en dropdown del mapa, toast con mensaje de intención:
  - `Todos`: "Explora y decide"
  - `Por visitar`: "Planifica lo próximo"
  - `Visitados`: "Recuerda lo vivido"
- **MapPinFilter:** `INTENTION_BY_FILTER` exportado; a11y incluye intención en accessibilityLabel.
- **MapPinFilterInline (buscador):** sin subtítulos para no saturar.
- **FILTER_RUNTIME_RULES:** reglas 0 y 2 actualizadas (intención + pending-first).
- **Ref `searchIsOpenRef`:** evita ReferenceError (handlePinFilterChange definido antes de searchV2).

## Criterios de aceptación
- [x] Filtros comunicados como intención (toast en dropdown del mapa).
- [x] Pending-first navigation estable (bitácora 175).
- [x] Cambio de filtro conserva contexto y evita desorientación.

## Resultado
- OL-WOW-F2-003 cerrado. En futuro se evaluará comportamiento adaptativo de mensajes.
