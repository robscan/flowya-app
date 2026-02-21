# Bitácora 098 (2026/02) — SearchPill: refactor a Design System

**Fecha:** 2026-02-14  
**Objetivo:** Extraer el pill "Buscar spots" del BottomDock a un componente canónico del Design System (SearchPill). Ancho ajustado al contenido, estilo Apple Maps, estructura simple y fácil de editar.

---

## Decisión

1. **Nuevo componente DS:** `SearchPill` en `components/design-system/search-pill.tsx`.
2. **Props:** `label` (default "Buscar spots"), `onPress`, `accessibilityLabel`, `fill` (flex: 1 cuando está junto a perfil/crear), `variant` (default | onDark).
3. **Layout:** minWidth 150px para evitar colapso; usa `Radius.pill` y tokens del theme.
4. **variant=onDark:** Fondo blanco (#ffffff), texto oscuro (#1d1d1f) para contraste sobre cluster flotante oscuro (BottomDock). Resuelve texto invisible y aspecto "plegado".
5. **BottomDock pillOnly:** Sin contenedor oscuro. Solo `SearchPill` flotante (outer > SearchPill). Composición mínima para facilitar edición. Cluster oscuro solo cuando showProfile/showCreateSpot.

---

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `components/design-system/search-pill.tsx` | **Nuevo.** Pill reutilizable. |
| `components/design-system/index.ts` | Export SearchPill, SearchPillProps |
| `components/explorar/BottomDock.tsx` | Refactor: SearchPill, clusterShrinkWrap, pillWrap |
| `app/design-system.web.tsx` | Sección "Search pill (Explore entry point)" |
| `docs/contracts/DESIGN_SYSTEM_USAGE.md` | Inventario SearchPill |
| `docs/contracts/SEARCH_V2.md` | Entry point: SearchPill del DS |

---

## Referencias

- Plan: `search_pill_ds_refactor`
- Contratos: DESIGN_SYSTEM_USAGE, SEARCH_V2
- Estilo: icon-button.tsx, buttons.tsx (Radius.pill, WebTouchManipulation)
