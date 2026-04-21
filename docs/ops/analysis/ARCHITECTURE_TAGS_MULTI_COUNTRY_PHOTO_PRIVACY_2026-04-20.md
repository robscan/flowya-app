# Arquitectura 2026-04-20 — Etiquetas, multi-país y privacidad por foto

**Estado:** análisis de capacidad base; implementación parcial ejecutada el 2026-04-20 para `Etiquetas v2` y `Filtro multi-país v2` (ver bitácora [`376`](../../bitacora/2026/04/376-etiquetas-v2-multipais-profile-panel-bulk.md)); privacidad por foto sigue sin implementación  
**Relacionado con:** [`USER_TAGS_EXPLORE.md`](../../contracts/USER_TAGS_EXPLORE.md), [`PHOTO_SHARING_CONSENT.md`](../../contracts/PHOTO_SHARING_CONSENT.md), [`PROFILE_VNEXT_MENU_KPIS.md`](../../contracts/PROFILE_VNEXT_MENU_KPIS.md), [`OPEN_LOOPS.md`](../OPEN_LOOPS.md)

## 1) Objetivo

Registrar capacidad actual y proponer una solución segura para estos requerimientos nuevos:

1. editar nombre de etiqueta;
2. asignar etiquetas a varios spots desde la lista de resultados;
3. permitir seleccionar más de un país en filtros;
4. mostrar si cada foto es pública o privada y permitir mezcla por foto;
5. evaluar un menú de perfil `Etiquetas` para administrar inventario.

## 2) Baseline verificable actual

### 2.1 Etiquetas

- El modelo vigente es **personal y owner-only**: `user_tags` + `pin_tags`.
- Runtime actual:
  - crear etiqueta si no existe;
  - reutilizar por `slug`;
  - asignar a **un spot por vez**;
  - quitar de un spot;
  - borrar etiqueta completa del inventario.
- No existe API de rename en `lib/tags.ts`.
- La UI actual de asignación vive dentro de `MapScreenVNext` y está centrada en un solo `tagAssignSpot`.

### 2.2 Filtros de país

- El contrato de selección actual es binario:
  - `{ kind: "all_places" }`
  - `{ kind: "country", key, label }`
- La persistencia local guarda un solo `country`.
- Los chips y el runtime de Explore están montados como **single-select**.

### 2.3 Fotos

- La preferencia actual es global por perfil: `profiles.share_photos_with_world`.
- El runtime separa dos ramas:
  - públicas: `spot_images` + bucket público `spot-covers`;
  - privadas: `spot_personal_images` + bucket privado `spot-personal`.
- No existe identidad canónica por foto con campo `visibility`.
- `spot_images` no guarda `user_id`; `spot_personal_images` sí lo guarda, pero solo para privados.

### 2.4 Perfil

- El shell de perfil ya soporta subpaneles en stack y en Explore desktop embebido.
- Hoy existen `profile`, `details`, `privacy`, `language`.
- Agregar `tags` es viable dentro del host actual.

## 3) Superficies y contratos afectados

- Etiquetas:
  - `docs/contracts/USER_TAGS_EXPLORE.md`
  - `lib/tags.ts`
  - `supabase/migrations/020_user_tags_pin_tags.sql`
  - `components/explorar/MapScreenVNext.tsx`
- Filtro multi-país:
  - `components/design-system/countries-sheet-types.ts`
  - `components/design-system/explore-country-filter-chip-row.tsx`
  - `components/explorar/explore-places-filters-modal.tsx`
  - `lib/storage/explorePlacesFiltersPreference.ts`
  - contratos Explore sheets/filtros
- Fotos:
  - `docs/contracts/PHOTO_SHARING_CONSENT.md`
  - `lib/spot-images.ts`
  - `lib/spot-personal-images.ts`
  - migraciones `024`, `030`, `031`, `032`
- Perfil:
  - `docs/contracts/PROFILE_VNEXT_MENU_KPIS.md`
  - `lib/explore/account-desktop-query.ts`
  - `components/account/AccountExploreDesktopPanel.tsx`
  - `components/account/web/AccountHomePanel.web.tsx`

## 4) Riesgos de regresión y certeza técnica

### 4.1 Rename de etiqueta

- **Riesgo:** colisión de `slug` al renombrar (`café` -> `cafe`).
- **Probabilidad:** media.
- **Mitigación:** rename transaccional que recalcula `slug`, detecta duplicado y ofrece merge explícito o bloqueo.
- **Certeza:** suficiente para implementar en un loop propio pequeño.

### 4.2 Etiquetado masivo de spots

- **Riesgo:** selección fantasma al cambiar búsqueda/filtro y asignar tags a spots que ya no están visibles.
- **Probabilidad:** media.
- **Mitigación:** modo selección explícito, contador visible, acción bulk confirmada y limpieza de selección al cambiar pool/base query.
- **Certeza:** suficiente si el alcance se limita a resultados de `Lugares` del usuario.

### 4.3 Filtro multi-país

- **Riesgo:** parches parciales rompen persistencia, chips activos, KPI Lugares y `CountriesSheet`.
- **Probabilidad:** alta.
- **Mitigación:** reemplazar el modelo single-select de raíz; no intentar extender `CountriesSheetListDetail` con hacks.
- **Certeza:** insuficiente para parche rápido; requiere cambio de contrato y migración de snapshot local.

### 4.4 Privacidad por foto

- **Riesgo:** fuga de privacidad o pérdida de imágenes si se intenta mezclar tablas/buckets actuales sin identidad única por foto.
- **Probabilidad:** alta.
- **Mitigación:** introducir un modelo canónico de media por foto antes de exponer toggles por imagen.
- **Certeza:** **insuficiente certeza técnica para implementar de forma segura** sobre el modelo actual sin rediseño estructural.

## 5) Propuesta arquitectónica

## 5.1 Etiquetas v2

### A. Administración en perfil

- Agregar panel `Etiquetas` en perfil para:
  - listar etiquetas del usuario;
  - ver conteo de spots por etiqueta;
  - renombrar;
  - borrar.
- Este panel debe ser el home de administración global; el mapa/listados siguen siendo superficie de asignación contextual.

### B. Rename canónico

- Extender `lib/tags.ts` con `renameUserTag(tagId, nextName)`.
- Reglas:
  - recalcular `slug`;
  - si el `slug` coincide con otra etiqueta del usuario, **no** automezclar silenciosamente;
  - ofrecer bloqueo o flujo explícito de merge en una fase posterior.

### C. Asignación masiva

- Añadir `selection mode` en resultados de `Lugares` para spots del usuario.
- Modelo recomendado:
  - `selectedSpotIds: Set<string>`
  - barra bulk sticky con `Etiquetar`, `Quitar etiqueta`, `Cancelar`
- Persistencia: ninguna; la selección debe ser efímera.
- Operación bulk:
  - preferible RPC o helper batch idempotente para insertar varias filas en `pin_tags` evitando duplicados.

## 5.2 Filtro multi-país v2

- Reemplazar `countryDetail` por un modelo explícito:
  - `{ mode: "all" }`
  - `{ mode: "subset", countries: Array<{ key, label }> }`
- `Todos` significa ausencia de restricción; no debe convivir con subset.
- Cambios derivados:
  - `ExplorePlacesFiltersSnapshot` sube de versión;
  - `ExploreCountryFilterChipRow` pasa a multiselección;
  - la barra activa de filtros debe resumir `N países`;
  - `CountriesSheet` y KPI Lugares deben leer el mismo contrato.

## 5.3 Fotos v2 con visibilidad por imagen

- No recomiendo extender `profiles.share_photos_with_world` para resolver esto; ese campo puede seguir como **default de subida**, no como fuente final por foto.
- Propuesta estructural:
  - crear tabla canónica `spot_user_media` (nombre tentativo) con:
    - `id`
    - `spot_id`
    - `user_id`
    - `storage_bucket`
    - `storage_path`
    - `visibility` (`private` | `public`)
    - `sort_order`
    - `created_at`
    - `published_at` nullable
  - la UI renderiza desde esta tabla y decide URL pública o firmada según `visibility`.
- El cambio de privacidad por foto debe ejecutar:
  - actualización de metadata;
  - movimiento/copia de storage entre bucket privado y público;
  - resincronización de portada pública si la foto afectada era portada.
- `spot_images` y `spot_personal_images` quedarían como legado de transición o deberían migrarse a esta tabla antes de exponer edición por foto.

## 6) Qué sí cabe como siguiente loop y qué no

### Cabe en loops pequeños y seguros

1. Panel `Etiquetas` en perfil.
2. Rename de etiqueta.
3. Selección masiva de spots para asignar etiquetas, limitada a listados del usuario.

### Requiere loop estructural independiente

1. Filtro multi-país.
2. Privacidad por foto con mezcla público/privado.

## 7) Secuencia recomendada

1. Cerrar el bloque correctivo P0 del 2026-04-20 con QA real.
2. Ejecutar `Etiquetas v2.A`:
   - panel `Etiquetas` en perfil;
   - rename;
   - delete con conteos.
3. Ejecutar `Etiquetas v2.B`:
   - multi-selección de spots;
   - bulk tag assign/detach.
4. Ejecutar `Filtro multi-país v2` con contrato nuevo y migración de snapshot.
5. Revisar y mantener el texto contractual y de consentimiento para que quede explícito que `Compartir` = fotos públicas visibles para todos los usuarios de FLOWYA.

## 8) Decisión recomendada

- **Sí**: agregar menú `Etiquetas` en perfil; es una buena superficie de administración y encaja en la arquitectura actual.
- **No**: intentar resolver privacidad por foto reutilizando tal cual `spot_images` + `spot_personal_images`; eso sería un parche frágil con alto riesgo de fuga o desincronización.
- **No**: meter multi-país como arreglo incremental dentro del tipo `CountriesSheetListDetail`; conviene rediseñar el contrato de selección una sola vez.
