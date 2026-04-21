# 376 — Etiquetas v2 + filtro multi-país + panel de perfil

**Fecha:** 2026-04-20
**Estado:** mergeado en `main` (PR #158) / QA manual pendiente

## 1) Motivo

Con el bloque correctivo P0 ya validado por QA, se ejecuta el siguiente bloque pedido por producto antes de retomar el siguiente loop formado:

1. permitir renombrar etiquetas;
2. permitir administrar etiquetas desde perfil;
3. permitir seleccionar varios spots del listado para asignar etiquetas;
4. permitir seleccionar más de un país en filtros;
5. mantener fuera de este bloque la privacidad por foto, que sigue como cambio estructural posterior.

## 2) Decisiones de arquitectura aplicadas

1. **Etiquetas** se mantiene sobre `user_tags` + `pin_tags`; no se abre un modelo nuevo.
2. El rename se implementa como cambio canónico en `lib/tags.ts`, recalculando `slug` y bloqueando colisiones.
3. La asignación masiva usa selección efímera en runtime; no persiste `selectedSpotIds`.
4. El filtro de país se desacopla de `CountriesSheetListDetail`:
   - `CountriesSheetListDetail` sigue resolviendo la ruta visual del sheet;
   - `ExplorePlacesCountryFilter` pasa a gobernar dataset, chips y persistencia.
5. `Todos` vuelve a ser el estado canónico cuando no hay subconjunto válido de países.

## 3) Superficies tocadas

- `lib/tags.ts`
- `components/account/web/AccountTagsPanel.web.tsx`
- `components/account/web/AccountHomePanel.web.tsx`
- `components/account/AccountExploreDesktopPanel.tsx`
- `app/account/tags.web.tsx`
- `app/account/tags.tsx`
- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/explore-bulk-tag-selection-bar.tsx`
- `components/design-system/search-list-card.tsx`
- `components/design-system/search-result-card.tsx`
- `components/design-system/countries-sheet-types.ts`
- `components/design-system/explore-country-filter-chip-row.tsx`
- `components/explorar/explore-places-filters-modal.tsx`
- `components/explorar/explore-places-active-filters-bar.tsx`
- `lib/storage/explorePlacesFiltersPreference.ts`

## 4) Resultado runtime

### 4.1 Etiquetas

- Perfil incorpora el panel `Etiquetas`.
- El usuario puede:
  - ver inventario global;
  - ver conteo de spots por etiqueta;
  - renombrar;
  - borrar.

### 4.2 Etiquetado masivo

- `Lugares` ahora soporta modo selección múltiple.
- La barra bulk permite:
  - entrar a modo selección;
  - ver cantidad seleccionada;
  - abrir asignación de etiquetas;
  - cancelar y limpiar selección.
- El modal de etiquetas soporta objetivo simple o bulk sin duplicar tags ya compartidas por todos los spots seleccionados.

### 4.3 País multi-select

- El modal de filtros permite marcar varios países o volver a `Todos`.
- La barra activa resume el subconjunto como:
  - nombre del país si es uno;
  - `N países` si son varios.
- La persistencia local sube a snapshot v2 y migra la preferencia anterior single-select al nuevo contrato.

## 5) Guardrails mantenidos

- No se implementa aún privacidad por foto.
- No se mezclan buckets/tablas públicas y privadas existentes.
- `CountriesSheet` conserva su ruta visual (`KPI`, `all_places`, `country`) sin reutilizarla como fuente de datos.

## 6) Validación ejecutada

- `npx tsc --noEmit`

## 7) QA manual pendiente (post-merge)

1. Abrir perfil web y validar panel `Etiquetas` con rename/delete.
2. Seleccionar varios spots en `Por visitar` y `Visitados`, asignar etiqueta y verificar resultado.
3. Abrir filtros de país, seleccionar 2+ países, cerrar/reabrir y validar persistencia + chips activos.
