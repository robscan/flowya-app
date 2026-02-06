# Bitácora 014 (2026/02) — B2-MS0: Fuente de verdad de Search

**Micro-scope:** B2-MS0  
**Rama:** `search/B2-MS0-fuente-verdad-search`  
**Objetivo:** Documentar reglas duras de Search para el equipo y para futuros micro-scopes.

---

## Qué se tocó

- Creado este documento en `docs/bitacora/2026/02/014-search-ms0.md` con la fuente de verdad de Search (reglas duras y casos canónicos).
- **No se modificó código.**

---

## Qué NO se tocó

- Código de Search, Create Spot, ni ningún archivo de la aplicación.
- Otros documentos del plan BLOQUE 2.

---

## Fuente de verdad — Reglas duras de Search

1. **Search solo invita a crear cuando no hay resultados válidos.** Si existe al menos un spot que coincida por el criterio de búsqueda (hoy: título), no se muestra CTA de crear.

2. **Búsqueda solo por `title`.** No hay tags, categorías ni campos alternos. Cuando en el futuro existan otros campos, se agregarán explícitamente; hoy no se simulan ni se declaran.

3. **Search propone, Create Spot confirma.** La decisión de crear es del usuario en Create Spot; Search solo propone la acción cuando no hay coincidencia.

4. **Sin IA, sin drafts persistentes, sin cookies/cache.** No se usa IA para búsqueda ni para sugerencias. No hay borradores persistentes ni almacenamiento de resultados de búsqueda en store/cache/cookies.

5. **Params → estado local → params ignorados.** Cualquier dato pasado por URL a Create Spot se lee una vez al montar, se vierte en estado local, y los params se ignoran a partir de entonces (navegación atrás/adelante o limpieza de URL no deben re-inicializar).

6. **Si no hay certeza, no se pasa contexto.** No se pasan texto ambiguo como nombre ni coordenadas inventadas a Create Spot.

7. **Nada de lógica "por si después" activa.** No se implementa comportamiento condicionado a datos que aún no existen.

---

## Casos canónicos de creación

- **Caso A — Ambiguo:** No hay lugar identificable ni coordenadas confiables. Search muestra CTA "Crear spot: {query}". Al tocar → Create Spot sin name/lat/lng (mapa libre, nombre vacío).

- **Caso B — Resoluble:** No existe spot en DB; sí existe lugar identificable (nombre + coords). Search muestra CTA "Crear: {nombre}". Al tocar → Create Spot con name, lat, lng (mapa centrado, pin colocado, nombre prellenado).

- **Caso C — Spot existente:** Hay resultados válidos por title. Search **no** muestra CTA de crear; solo permite seleccionar el spot.

---

## Criterio de cierre

- Documento creado con las reglas y casos canónicos.
- Sin cambios de código; build sin alteración.

---

## Rollback

- Eliminar `docs/bitacora/2026/02/014-search-ms0.md` y descartar la rama `search/B2-MS0-fuente-verdad-search` si se quisiera revertir este micro-scope.
