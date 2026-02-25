# 152 — Search V2: `Todos` incluye visitados + títulos por filtro

Fecha: 2026-02-25

## Contexto

QA reportó que en `Todos` no siempre aparecían spots `visitados` que sí estaban visibles en filtro `Visitados`.
También se pidió regla explícita de títulos:

- `Visitados` -> **Cerca de aquí**
- `Por visitar` -> **En esta zona**

## Implementación

Archivos:

- `components/explorar/MapScreenVNext.tsx`
- `hooks/search/useSearchControllerV2.ts`
- `lib/search/spotsStrategy.ts`

Cambios:

1. `getFilters` de Search V2 ahora pasa contexto mínimo:
   - `pinFilter`
   - `hasVisited` (si existen visitados en pool local)
2. Guardrail de promoción en `Todos`:
   - Si hay visitados en pool (`hasVisited=true`) y etapa actual no devuelve ninguno, Search V2 avanza de etapa (`viewport -> expanded -> global`) para no ocultar visitados relevantes.
3. Parse de filtros extendido en `spotsStrategy` para soportar forma objeto (`{ pinFilter, hasVisited }`) sin romper compatibilidad.
4. Etiqueta de sección por filtro:
   - `visited`: "Cerca de aquí"
   - `saved`: "En esta zona"
   - `all`: mantiene etiqueta por stage.

## Validación mínima

- `npm run lint` OK.

