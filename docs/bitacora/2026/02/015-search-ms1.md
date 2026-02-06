# Bitácora 015 (2026/02) — B2-MS1: Auditoría + hardening del Search actual

**Micro-scope:** B2-MS1  
**Rama:** `search/B2-MS1-auditoria-hardening-search`  
**Objetivo:** Confirmar búsqueda solo por title, eliminar lógica muerta.

---

## Qué se tocó

- Auditoría de `app/(tabs)/index.web.tsx`: revisión de todo lo que alimenta `searchResults` y la UI de Search.
- **Confirmado:** El único campo usado para el match de búsqueda es `spot.title` (líneas 202-207: `filteredSpots.filter((s) => s.title.toLowerCase().includes(q))`). El comentario existente ya indica "solo por título".
- **No se encontró** lógica muerta: no hay referencias a tags, categorías ni a `description_short`/`description_long` en el criterio de búsqueda. La query de Supabase selecciona `description_short` y `cover_image_url` para la tarjeta de resultado, no para el filtro.
- Sin cambios de código: el estado actual cumple el objetivo; no fue necesario eliminar ni modificar líneas.

---

## Qué NO se tocó

- Create Spot, lib, componentes de diseño.
- Comportamiento de defaultSpots (orden por distancia; no afecta criterio de match).
- Ningún otro archivo.

---

## Criterio de cierre

- Búsqueda documentada y verificada como solo por title.
- Sin código muerto relacionado con búsqueda por otros campos.
- Build limpio (sin cambios, mismo que MS0).

---

## Rollback

- Esta rama no introduce cambios de código; solo documentación. Para revertir: descartar rama `search/B2-MS1-auditoria-hardening-search` y el archivo `docs/bitacora/2026/02/015-search-ms1.md`.
