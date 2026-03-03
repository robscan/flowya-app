# PLAN — OL-EXPLORE-TAGS-001 (2026-03-03)

Estado: PLANIFICADO (secuencial, no paralelo)  
Dependencia: cierre de `OL-EXPLORE-SEARCH-BATCH-001` y `OL-CONTENT-001.A` (identity + ownership foundation)  
Decisión de producto cerrada:
- tags son **personales** (solo visibles/gestionables por el usuario dueño),
- se **omite** categorías Mapbox en esta fase.

---

## 1) Objetivo

Habilitar tags personales estilo “carpeta/grupo” integrados al listado de búsqueda para mejorar organización y filtrado de spots, con UX simple y sin saturación.

---

## 2) Scope v1

1. Crear tag personal (`#`) desde flujo de spot/listado.
2. Mostrar chips de tags personales en card de resultados.
3. Menú superior de chips para filtrar listado por tag.
4. Mostrar solo chips con resultados en el contexto actual.
5. Prioridad visual: tags del usuario primero.

---

## 3) No scope (v1)

- Categorías Mapbox como chips de filtro.
- Tags globales compartidos entre usuarios.
- Moderación/comunidad de tags públicos.
- Lógica avanzada multi-tag AND/OR en primera entrega.

---

## 4) Modelo de datos recomendado

**Personal-first** (evitar contaminación global):

- `user_tags`:
  - `id uuid pk`
  - `user_id uuid not null`
  - `name text not null` (original)
  - `slug text not null` (normalizado: lowercase/sin acentos)
  - `created_at`
  - unique `(user_id, slug)`

- `pin_tags` (relación usuario-spot-tag):
  - `id uuid pk`
  - `user_id uuid not null`
  - `spot_id uuid not null`
  - `tag_id uuid not null`
  - `created_at`
  - unique `(user_id, spot_id, tag_id)`

RLS:
- solo owner (`auth.uid() = user_id`) para SELECT/INSERT/DELETE.

Nota de acceso:
- Si no hay usuario registrado, operar sobre sesión anónima autenticada (mismo contrato owner-only).

---

## 5) UX/flujo v1

### 5.1 Crear tag (`#`)

- Trigger con icono `#` en contexto de spot/listado.
- Input corto + sugerencias de tags ya creados por el usuario.
- Al confirmar:
  - si `slug` existe: reutilizar tag existente,
  - si no existe: crear nuevo tag y asociarlo al spot.

### 5.2 Chips en card

- Mostrar máximo 2 chips por card (prioridad a tags del usuario más recientes/frecuentes).
- Evitar crecimiento vertical excesivo.

### 5.3 Menú superior de chips

- Renderizar solo chips con `count > 0` en resultados visibles/filtro activo.
- Orden:
  1. chips del usuario (propios),
  2. opción `Todos` para limpiar filtro.

---

## 6) Integración técnica sugerida

### EP-1 — DB + RLS

- migraciones de `user_tags` + `pin_tags`.
- índices de rendimiento para `user_id`, `spot_id`, `tag_id`.

### EP-2 — Lib de dominio

Agregar módulo `lib/tags.ts`:
- `listUserTags(userId)`
- `searchUserTags(userId, query)`
- `createOrGetUserTag(userId, input)`
- `attachTagToSpot(userId, spotId, tagId)`
- `detachTagFromSpot(userId, spotId, tagId)`
- `getTagCountsForSpotIds(userId, spotIds)`

### EP-3 — UI listado/card

- extender `SearchListCard` para chips de tags.
- extender `SearchSurface` para barra de chips de filtro.
- filtro de resultados por tag activo (sin romper pinFilter actual).

### EP-4 — Creador `#`

- componente liviano (popover/sheet corto) con:
  - input,
  - sugerencias,
  - alta/reuso de tag.

### EP-5 — Cierre documental

- actualizar contratos de búsqueda/filtro y estado.
- bitácora de cierre con evidencia QA.

---

## 7) Riesgos y mitigación

1. Duplicados semánticos (`#Food`, `#food`, `#fóod`).
- Mitigación: normalización + unique `(user_id, slug)`.

2. Saturación visual en header.
- Mitigación: top-N chips con resultados > 0, scroll horizontal, truncado.

3. Rendimiento en listados grandes.
- Mitigación: counts por consulta agregada + memo de chips visibles.

4. Confusión entre pinFilter y tagFilter.
- Mitigación: UI explícita de filtros activos + acción rápida “limpiar tag”.

5. Inconsistencia cross-platform.
- Mitigación: mismos contratos en `SearchSurface` (web/native adapters).

---

## 8) Criterios de aceptación

1. Usuario crea tag personal y lo reutiliza sin duplicados.
2. Card muestra chips personales asociados al spot.
3. Barra superior muestra solo chips con resultados.
4. Filtrar por chip altera listado sin romper `saved/visited`.
5. Otro usuario no ve ni modifica tags personales ajenos.

---

## 9) Orden recomendado de ejecución

1. EP-1 DB + RLS.
2. EP-2 lib dominio de tags.
3. EP-3 chips en card + filtro de chips en listado.
4. EP-4 creador `#` con sugerencias.
5. EP-5 QA + contratos + bitácora + cierre de loop.
