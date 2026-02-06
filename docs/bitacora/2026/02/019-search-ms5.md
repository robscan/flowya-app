# Bitácora 019 (2026/02) — B2-MS5: Handoff Search → Create Spot

**Micro-scope:** B2-MS5  
**Rama:** `search/B2-MS5-handoff-search-create-spot`  
**Objetivo:** Pasar params a Create Spot solo en caso resoluble (nombre + coords); caso ambiguo mantener flujo actual.

---

## Qué se tocó

- **app/(tabs)/index.web.tsx:** `handleCreateSpotFromSearch` ahora distingue caso resoluble vs ambiguo. Si existe `resolvedPlace` (lugar resuelto en MS4), navega a `/create-spot?name=...&lat=...&lng=...&source=search` usando `URLSearchParams` para codificar el nombre. Si no hay lugar resuelto, navega a `/create-spot?source=search` como antes.

---

## Qué NO se tocó

- Create Spot: aún no lee `name` ni inicializa desde params (MS5a). La URL ya lleva los params para cuando MS5a los consuma.
- Resolución de lugar (MS4), orden de resultados (MS6), anti-duplicados (MS8).

---

## Criterio de cierre

- Con lugar resuelto: params name, lat, lng, source=search en la URL.
- Caso ambiguo: solo source=search.
- Build limpio.

---

## Rollback

- Restaurar `handleCreateSpotFromSearch` a una única navegación `'/create-spot?from=search'` (o `source=search`) sin usar `resolvedPlace`.
