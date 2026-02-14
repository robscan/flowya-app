# V3 — Cleanup completado (2026-02)

## Archivos eliminados

```
app/exploreV3.tsx
app/exploreV3.web.tsx
components/explorar/SpotPeekCardV3Web.tsx
components/explorar/SpotSheetV3Web.tsx
components/search/SearchOverlayV3Web.tsx
components/explorar/exploreV3-types.ts
```

## Archivos editados

- `app/_layout.tsx` — ruta exploreV3 y comentarios V3 eliminados
- `components/explorar/MapScreenVNext.tsx` — props spotSheetVariant/searchOverlayVariant e imports V3 eliminados; solo SpotSheet legacy
- `components/search/SearchFloating.tsx` — SearchOverlayV3Web y variante v3 eliminados
- `components/search/types.ts` — overlayVariant eliminado

## Nota

`core/` NO se eliminó — es compartido (search, visibility) y lo usa MapScreenVNext/useSearchControllerV2.
