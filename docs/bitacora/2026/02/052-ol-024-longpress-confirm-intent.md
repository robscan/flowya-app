# Bitácora 052 (2026/02) — OL-024: modal confirmación long-press create spot (vNext)

**Rama:** `chore/explore-quality-2026-02-09` (mismo PR del día)  
**Objetivo:** Paridad con legacy: mostrar modal de confirmación de intención en long-press con checkbox "No volver a mostrar".

---

## 1) Parity con v0

- v0 (MapScreenV0) ya tiene: CreateSpotConfirmModal, estado pendingCreateSpotCoords, key `flowya_create_spot_skip_confirm` en localStorage. Si skip → navegar directo; si no → mostrar modal; onConfirm(dontShowAgain) persiste key y navega.
- vNext: se reutiliza el mismo componente `CreateSpotConfirmModal` y la **misma key** `flowya_create_spot_skip_confirm` para que la preferencia sea compartida entre v0 y vNext.

---

## 2) Decisión de storage / key

- **Key:** `flowya_create_spot_skip_confirm` (ya existente en v0).
- **Persistencia:** `localStorage` (web). Si `localStorage.getItem(key) === 'true'` → long-press navega directo sin modal. Al marcar "No volver a mostrar" y confirmar → `localStorage.setItem(key, 'true')`.
- No se inventó sistema nuevo; se reutiliza el de v0.

---

## 3) Implementación (MapScreenVNext.tsx)

- Estado: `showCreateSpotConfirmModal`, `pendingCreateSpotCoords`.
- Constante: `SKIP_CREATE_SPOT_CONFIRM_KEY = 'flowya_create_spot_skip_confirm'`.
- `navigateToCreateSpotWithCoords(coords)`: construye query lat/lng + map params y `router.push('/create-spot?...)`.
- `handleMapLongPress`: si no auth → auth modal (igual). Si auth: si skip → navigateToCreateSpotWithCoords(coords); si no → setPendingCreateSpotCoords(coords), setShowCreateSpotConfirmModal(true).
- `handleCreateSpotConfirm(dontShowAgain)`: si dontShowAgain → setItem(key, 'true'); navigateToCreateSpotWithCoords(pendingCreateSpotCoords); limpiar pending y cerrar modal.
- `handleCreateSpotConfirmCancel`: limpiar pending y cerrar modal.
- Render: `<CreateSpotConfirmModal visible onConfirm onCancel />`.

---

## 4) Pruebas

- **Web logged out:** Long-press → auth modal (sin cambios).
- **Web logged in, primera vez (sin flag):** Long-press → modal "¿Crear spot aquí?" con checkbox. Cancelar → no navega. Confirmar → navega a /create-spot con coords. Confirmar con "No volver a mostrar" marcado → navega y siguiente long-press va directo.
- **Web logged in, con flag:** Long-press → navega directo (sin modal).
- **Resetear flag para repetir:** En consola (DevTools): `localStorage.removeItem('flowya_create_spot_skip_confirm')` o en Application > Local Storage borrar la key.
