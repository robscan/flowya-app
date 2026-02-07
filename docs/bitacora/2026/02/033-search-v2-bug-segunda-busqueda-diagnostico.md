# Diagnóstico: “Segunda búsqueda mismo query no devuelve resultados”

**Objetivo:** Causa raíz con evidencia (estado/cache/stage/bbox/filtros/abort) antes de aplicar fixes.

---

## Paso 0 — Escenario reproducible

Elige uno y repítelo 3 veces. Documenta cuál falla.

- **A) Sin cerrar search:** Abrir search → buscar "Sagrada" → OK resultados → borrar texto → volver a escribir "Sagrada" → **¿falla?**
- **B) Cerrando search:** Abrir search → buscar "Sagrada" → OK → cerrar search (X) → abrir search de nuevo → buscar "Sagrada" → **¿falla?**

**Escenario que falla (tras 3 repeticiones):** _[ A / B ]_

---

## Instrumentación añadida (solo logs)

- **useSearchControllerV2.ts**
  - `[SearchV2:GUARD_THRESHOLD]` — setQuery no lanza búsqueda (query &lt; 3 chars).
  - `[SearchV2:CACHE_HIT]` — runSearch sale por cache (query, normalizedQuery, mode, stage, cursor, filters, bboxHash, cacheKey, cacheHit, itemsLength, append).
  - `[SearchV2:REQUEST]` — runSearch lanza request (requestId, query, normalizedQuery, mode, stage, cursor, hasMore, isLoading, filters, bboxHash, cacheKey, cacheHit, append).
  - `[SearchV2:SUCCESS]` / `[SearchV2:EMPTY]` — strategy devolvió (requestId, itemsLength, hasMore, aborted, ignoredByRace).
  - `[SearchV2:IGNORED_RACE]` — respuesta ignorada porque llegó otro request (requestId, currentId, itemsLength).
- **spotsStrategy.ts**
  - `[SpotsStrategy:ENTER]` — params (query, stage, bboxHash, cursor, bboxNull).
  - `[SpotsStrategy:GUARD_BBOX]` — salida por bbox null (stage !== 'global').
  - `[SpotsStrategy:RETURN]` — resultado (itemsLength, sortedLength, offset, hasMore, stage).

---

## Paso 2 — Reporte (rellenar tras reproducir)

### 1) Escenario que falla

_[ A o B ]_

### 2) Línea de tiempo de logs

**Primera búsqueda "Sagrada" (OK):**

```
[pegar logs en orden]
```

**Segunda búsqueda "Sagrada" (falla):**

```
[pegar logs en orden]
```

### 3) Causa raíz (elegir una frase)

- **(A)** Guard bloquea nueva búsqueda (p. ej. threshold, o condición que evita runSearch).
- **(B)** Cache devuelve vacío incorrecto (misma cacheKey pero valor cacheado con items vacíos o key distinta por bbox/filters).
- **(C)** Abort/race ignora respuesta válida (requestId !== rid, IGNORED_RACE con itemsLength > 0).
- **(D)** bbox/filters cambian y el universo de búsqueda cambia (bboxHash o filters distintos entre 1ª y 2ª, strategy recibe bbox null o filtro que excluye el spot).

### 4) Recomendación de fix mínimo (propuesta, NO implementar aún)

_[ una o dos frases ]_
