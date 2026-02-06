# Bitácora 023 (2026/02) — B2-MS8: Anti-duplicados (soft)

**Micro-scope:** B2-MS8  
**Rama:** `search/B2-MS8-anti-duplicados-soft`  
**Objetivo:** Advertencia antes de crear si hay coincidencias débiles; confirmación explícita del usuario.

---

## Qué se tocó

- **app/(tabs)/index.web.tsx:**
  - Import de `checkDuplicateSpot` y `normalizeSpotTitle` desde `@/lib/spot-duplicate-check`.
  - Estado `showCreateSpotDuplicateWarning`, `duplicateWarningSpotTitle` y ref `pendingCreateFromSearchRef` para guardar la acción pendiente al mostrar la advertencia.
  - `handleCreateSpotFromSearch` deja de navegar de inmediato: si hay `resolvedPlace`, llama a `checkDuplicateSpot(name, lat, lng, 300)`; si hay duplicado, muestra modal y guarda pending. Si no hay lugar resuelto pero sí query, busca en `filteredSpots` un spot con el mismo título normalizado; si existe, muestra modal. Solo si no hay coincidencia débil se navega a Create Spot.
  - Handlers `handleCreateSpotDuplicateWarningConfirm` (navega con pending y cierra modal) y `handleCreateSpotDuplicateWarningCancel` (cierra sin navegar).
  - `ConfirmModal`: título "Spot parecido", mensaje con el nombre del spot existente y "¿Crear otro?", botones "Crear otro" / "Cancelar".

---

## Qué NO se tocó

- Create Spot, lib/spot-duplicate-check (solo uso de funciones existentes). Radio 300 m para caso resoluble; comparación por título normalizado para caso ambiguo.

---

## Criterio de cierre

- Al pulsar CTA crear desde Search, si hay coincidencia débil (mismo título normalizado o spot cercano por checkDuplicateSpot) se muestra advertencia; solo se navega a Create Spot si el usuario confirma "Crear otro".
- Build limpio.

---

## Rollback

- Quitar import de checkDuplicateSpot y normalizeSpotTitle; eliminar estado y ref de advertencia; restaurar handleCreateSpotFromSearch a navegación directa; eliminar ConfirmModal de spot parecido y sus handlers.
