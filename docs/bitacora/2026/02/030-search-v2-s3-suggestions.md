# Bitácora 030 (2026/02) — Search V2 S3: Sugerencias estilo Google

**Micro-scope:** S3 — P2 Sugerencias (solo stage global + 0 resultados)  
**Rama:** `feat/search-v2-s3-suggestions`  
**Objetivo:** Mostrar sugerencias (1–3) solo después de agotar "find" (stage global, 0 resultados). Tap sugerencia reemplaza query y vuelve a buscar sin duplicar llamadas.

---

## Qué se tocó

- **lib/search/suggestions.ts:** `getSuggestions(query: string): string[]`. Usa `normalizeQuery`; diccionario ES↔EN curado (~30 pares: capitolio↔capitol, mirador↔viewpoint, playa↔beach, museo↔museum, etc.); máximo 3 sugerencias; formato listo para el input.
- **hooks/search/useSearchControllerV2.ts:** `suggestions: string[]` (useMemo cuando mode spots, query >= 3, stage global, results.length === 0); `onSuggestionTap(s)` = `setQuery(s)` (reusa debounce/cache).
- **app/(tabs)/index.web.tsx:** Sección "Sugerencias" cuando `searchV2.suggestions.length > 0` (lista de filas tapables, estilo Google); CTA "Crear" se mantiene debajo. Estilos `suggestionsSection`, `suggestionRow`.
- **docs/definitions/search/SEARCH_V2.md:** Sección S3 ampliada (condición solo global + 0 results; no viewport/expanded; no si hay resultados).
- **docs/bitacora/2026/02/030-search-v2-s3-suggestions.md:** esta entrada.

---

## Reglas no negociables (cumplidas)

1. **No** sugerencias en viewport ni expanded (solo en global + 0 resultados).
2. **No** sugerencias si ya hay resultados.
3. Tap sugerencia = `setQuery(suggestion)` → flujo normal (sin bypass).
4. Performance: `normalizeQuery` + diccionario curado; máx 3 sugerencias.
5. UX: sin "¿No encontraste…?"; solo sección "Sugerencias" + CTA "Crear".

---

## Checklist de cierre

- [ ] "Capitolio Texas" → viewport 0, expanded 0, global 0 → aparecen sugerencias (ej. "Capitol Texas"); tap → reinicia flujo → encuentra resultados y deja de mostrar sugerencias.
- [ ] No aparecen sugerencias si hay resultados en cualquier stage.
- [ ] No aparecen sugerencias en viewport/expanded aunque haya 0 resultados.
- [ ] Tap sugerencia no duplica llamadas (reusa debounce/cancelación/cache).
- [ ] Build OK, sin lint errors.

---

## Rollback

`SEARCH_V2_ENABLED = false` en `constants/flags.ts`.

---

## QA

- Caso típico: buscar "Capitolio Texas" sin spots con ese nombre → stages viewport → expanded → global → 0 resultados → se muestra "Sugerencias" con "Capitol Texas" (o equivalente); al tocar se hace setQuery("Capitol Texas") y se ejecuta la búsqueda de nuevo; si existe un spot "Capitol Texas" aparecen resultados y ya no se muestran sugerencias.
