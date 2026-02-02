# Bitácora 021 — Modal de confirmación: Eliminar Spot

## Objetivo

Reemplazar el modal del sistema (window.confirm / Alert.alert) por ConfirmModal al eliminar un spot desde la ventana de edición. Mismo formato FLOWYA que logout (020).

---

## 1) SpotDetail: ConfirmModal para eliminar

### Archivos

- **components/design-system/spot-detail.tsx** — Cambios:
  - Estado `showDeleteConfirm` para controlar visibilidad del modal
  - handleDeleteSpotPress: abre ConfirmModal en lugar de window.confirm/Alert
  - handleDeleteConfirm: cierra modal y llama onDeleteSpot()
  - ConfirmModal con title «¿Eliminar este spot?», message «Esta acción no se puede deshacer.», variant destructive
  - Eliminados imports de Alert y Platform

### Mensaje

- **Título:** ¿Eliminar este spot?
- **Mensaje:** Esta acción no se puede deshacer.
- **Botones:** Cancelar | Eliminar (destructive)

---

## 2) Design System

- **app/design-system.web.tsx** — Sección ConfirmModal ampliada:
  - Botón «Eliminar spot» para ver el modal de eliminación
  - Descripción actualizada: menciona uso en eliminar spot
  - ConfirmModal de ejemplo con título y mensaje de eliminar spot

---

## Resumen de archivos tocados (021)

| Archivo | Cambio |
|--------|--------|
| components/design-system/spot-detail.tsx | ConfirmModal para eliminar spot, elimina Alert/Platform |
| app/design-system.web.tsx | Showcase modal eliminar spot |
| bitacora/021_confirm_modal_eliminar_spot.md | Esta bitácora |

---

## Criterio de cierre

- [x] Eliminar spot usa ConfirmModal en lugar de modal del sistema
- [x] Formato visual alineado con Modal de auth
- [x] Documentado en design system showcase
