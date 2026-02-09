# Bitácora 048 (2026/02) — Explore stability: gate crear spot sin sesión

**Rama:** `chore/explore-stability-2026-02-09`  
**Objetivo:** Cerrar OL-009: usuario sin sesión no navega a `/create-spot`; auth modal sobre `/` (Explore vNext). Contexto preservado al cerrar modal.

---

## 1) Contexto

- **Fuentes de verdad:** docs/ops (OPEN_LOOPS, CURRENT_STATE), OL-009.
- **Entry real:** Explore vNext (`/`) usa MapScreenVNext; el CTA "Crear nuevo spot" viene de SearchFloating y llama a `searchV2.onCreate()`, que ejecutaba directamente `router.push('/create-spot')` sin comprobar sesión.
- **Diagnóstico:** `setOnCreate` se registra una sola vez; useSearchControllerV2 no hace push interno. El callback era siempre navegar; la corrección es gate en ese callback.

---

## 2) Cambio implementado

- **MapScreenVNext:** Helper local `requireAuthOrModal(message): Promise<boolean>` (getUser; si no hay usuario o es anónimo → openAuthModal y return false; si no return true). Refactor de `handleProfilePress` para usarlo. Callback de `searchV2.setOnCreate`: solo si `requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot)` devuelve true → `router.push('/create-spot')`. Logged out: modal sobre `/`, no navegación.
- **Auth modal:** Añadido `AUTH_MODAL_MESSAGES.createSpot: 'Inicia sesión para crear un spot'`.
- **create-spot/index.web.tsx:** Uso de `AUTH_MODAL_MESSAGES.createSpot` en el useEffect al montar sin sesión. Guard al inicio de `handleCreate`: getUser; si !user o is_anonymous → openAuthModal(createSpot) y return (evita race/RLS).
- **OL-009:** Cerrado en OPEN_LOOPS (solo si pruebas reales pasan; ver nota en OPEN_LOOPS).

---

## 3) Pruebas mínimas

- **Web logged out:** Click "Crear spot" desde Explore vNext → auth modal sobre `/`, no se navega a `/create-spot`; al cerrar modal, usuario sigue en `/`. Consola limpia.
- **Web logged in:** Crear spot funciona igual que antes (navega y flujo normal).

---

## 4) Resultado y notas

- Implementación estable. OL-009 se considera cerrado tras verificación manual de los criterios anteriores.
- Fuera de alcance: fallback UI en `/create-spot` (pantalla blanca por URL directa); solo se corrigió el entry desde VNext.
