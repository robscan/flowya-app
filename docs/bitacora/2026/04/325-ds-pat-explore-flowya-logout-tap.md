# 325 — Vitrina ds-pat-explore: FLOWYA + logout en tap (OL-WEB-RESPONSIVE-001)

**Fecha:** 2026-04-05  
**Tipo:** Vitrina Design System

## Alcance

- Sección **Explore — banda inferior (productivo)** (`ds-pat-explore`): fila **`ExploreMapStatusRow`** (FLOWYA + pastilla países|flows), alineada a `MapScreenVNext`; FLOWYA abre **`FlowyaBetaModal`** de la vitrina.
- **`ExploreSearchActionRow`**: botón de cerrar sesión **no** visible por defecto; **`showLogoutAction`** controlado por estado local; **tap en perfil** alterna visibilidad; **Cerrar sesión** cierra el popover.

## Archivo

- [`app/design-system.web.tsx`](../../../../app/design-system.web.tsx)

## Validación

- `npm run typecheck`
