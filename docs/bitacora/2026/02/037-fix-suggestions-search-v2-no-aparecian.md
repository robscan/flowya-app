# Bitácora 037 (2026/02) — Fix P1: Suggestions no aparecían en Search V2 (Map)

**Problema:** En QA, la sección "Sugerencias" (S3) no aparecía nunca en Map Search V2.

**Diagnóstico:**
- Condición S3: `mode='spots'`, `query.trim().length >= 3`, `stage === 'global'`, `results.length === 0`.
- La UI solo renderizaba la sección "Sugerencias" cuando `suggestions.length > 0`. Para términos sin entrada en el diccionario (ej. "zzzzzz") o antes de llegar a global, la sección no se mostraba y parecía que las sugerencias "no existían".
- Además, el `setStage('viewport')` redundante en el callback del debounce podía contribuir a condiciones de carrera con el chaining viewport→expanded→global.

**Causa raíz:** (B) Render: la sección "Sugerencias" estaba condicionada a `suggestions.length > 0`, por lo que en estado "0 resultados" no se veía la sección cuando el diccionario no devolvía alternativas (ej. "zzzzzz") o mientras el chaining aún no había llegado a global.

**Fix aplicado:**
1. **UI (index.web.tsx):** Mostrar siempre la sección "Sugerencias" en el estado búsqueda sin resultados (query >= 3, results.length === 0). Dentro: si hay sugerencias, lista tapable; si no, texto "No hay sugerencias para este término." Así se confirma que se llegó al estado "sin resultados" y las sugerencias son visibles cuando el diccionario devuelve algo (ej. "capitolio" → "Capitol").
2. **Controller (useSearchControllerV2.ts):** Eliminar el `setStage('viewport')` redundante del callback del debounce; el stage lo fija únicamente `runSearch` al completar cada etapa, evitando posibles carreras con el chaining.

**QA:**
- Buscar "zzzzzz" (>=3): se muestra sección "Sugerencias" con "No hay sugerencias para este término." (y CTA Crear).
- Buscar "capitolio": si global 0 resultados → aparecen sugerencias (ej. "Capitol"); tap reemplaza query y dispara búsqueda.
- Con resultados presentes → no se muestra la rama "sin resultados", por tanto no aparece la sección Sugerencias.
- Sin regresiones en stages / fetchMore / filtros.

**Archivos:** `app/(tabs)/index.web.tsx`, `hooks/search/useSearchControllerV2.ts`.
