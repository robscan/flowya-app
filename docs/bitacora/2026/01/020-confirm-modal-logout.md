# Bitácora 020 — Modal de confirmación (logout)

## Objetivo

Reemplazar el modal del sistema (window.confirm / Alert.alert) por un modal de confirmación con formato FLOWYA, alineado con el Modal de auth (Scope I). Usado para cerrar sesión.

---

## 1) Componente ConfirmModal

### Archivos

- **components/ui/confirm-modal.tsx** — Nuevo componente. Mismo formato visual que auth modal:
  - Backdrop semitransparente
  - Sheet centrado: maxWidth 400, Radius.xl, sombra
  - Título (18px, fontWeight 600)
  - Mensaje opcional (14px, textSecondary)
  - Dos botones: Cancelar (borde) y confirmación (primary o destructive)
  - variant: `default` | `destructive` — destructive usa stateError (rojo) para el botón de confirmar
  - Props: visible, title, message?, confirmLabel, cancelLabel?, variant?, onConfirm, onCancel

- **components/design-system/index.ts** — Re-export de ConfirmModal y tipos

### API

```tsx
<ConfirmModal
  visible={showConfirm}
  title="¿Cerrar sesión?"
  confirmLabel="Cerrar sesión"
  cancelLabel="Cancelar"
  variant="destructive"
  onConfirm={handleConfirm}
  onCancel={() => setShowConfirm(false)}
/>
```

---

## 2) Uso en mapa (logout)

### Archivos

- **app/(tabs)/index.web.tsx** — Eliminados window.confirm y Alert.alert. Nuevo flujo:
  - handleLogoutPress: abre ConfirmModal (setShowLogoutConfirm(true))
  - handleLogoutConfirm: cierra modal, cierra opción X, signOut
  - ConfirmModal con title «¿Cerrar sesión?», variant destructive
  - Eliminado import de Alert

---

## 3) Design System

- **app/design-system.web.tsx** — Nueva sección «Modal de confirmación (logout)»:
  - Descripción del componente
  - Botón para abrir el modal de ejemplo
  - ConfirmModal controlado con estado local

---

## Resumen de archivos tocados (020)

| Archivo | Cambio |
|--------|--------|
| components/ui/confirm-modal.tsx | Nuevo: modal de confirmación |
| components/design-system/index.ts | Re-export ConfirmModal |
| app/(tabs)/index.web.tsx | ConfirmModal para logout, elimina Alert/window.confirm |
| app/design-system.web.tsx | Sección showcase ConfirmModal |
| docs/bitacora/2026/01/020-confirm-modal-logout.md | Esta bitácora |

---

## Criterio de cierre

- [x] Logout usa ConfirmModal en lugar de modal del sistema
- [x] Formato visual alineado con Modal de auth
- [x] Componente en librería (design-system) y documentado en showcase

---

**Bitácora 021** — Modal de confirmación para eliminar spot. Ver `docs/bitacora/2026/01/021-confirm-modal-eliminar-spot.md`.
