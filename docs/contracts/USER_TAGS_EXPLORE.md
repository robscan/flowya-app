# USER_TAGS_EXPLORE — Etiquetas personales en Explore (pins + búsqueda)

**Estado:** implementado (merge PR #106, 2026-03-22).  
**Loops:** `OL-EXPLORE-TAGS-001` (cerrado — ver bitácora `310`).  
**Decisión de producto:** bitácora `277` (tags personales; sin categorías Mapbox en v1).

**Fuentes de verdad en código:**

- Esquema y RLS: `supabase/migrations/020_user_tags_pin_tags.sql`, `021_user_tags_set_user_id_trigger.sql`
- Dominio cliente: `lib/tags.ts`
- Chip reutilizable: `components/design-system/tag-chip.tsx`
- Listados: `components/design-system/search-list-card.tsx` (`tagChips`, quick action `add_tag`)
- Superficie búsqueda: `components/search/SearchSurface.tsx` (fila de chips + modo edición)
- Mapa/orquestación: `components/explorar/MapScreenVNext.tsx`
- Sheet de spot: `components/explorar/SpotSheet.tsx` (`SpotSheetMetaRow`: distancia + chips + «Etiquetar»)

---

## 1) Modelo de datos

### 1.1 `user_tags`

- `id`, `user_id`, `name` (texto mostrado), `slug` (normalizado), `created_at`
- Unicidad: `(user_id, slug)`
- RLS: solo el dueño (`auth.uid() = user_id`) para SELECT/INSERT/UPDATE/DELETE

### 1.2 `pin_tags`

- Relación usuario–spot–etiqueta: `user_id`, `spot_id`, `tag_id`, `created_at`
- Unicidad: `(user_id, spot_id, tag_id)`
- RLS: solo el dueño; INSERT exige que el spot sea del usuario y la etiqueta también
- Trigger `pin_tags_set_user_id_trigger`: si `user_id` viene NULL en INSERT, se rellena con `auth.uid()`

### 1.3 Semántica

- Las etiquetas son **personales** (no hay tags globales compartidos entre usuarios en v1).
- Otro usuario no ve ni modifica etiquetas ajenas.

### 1.4 Conteo `(N)` en chips de filtro por etiqueta (búsqueda vacía)

- La **fila de chips de filtro por etiqueta** en el buscador solo se muestra en **Por visitar** y **Visitados** (usuario autenticado). En **Todos** no hay chips: el filtro por etiqueta no aplica a ese modo y al pasar a «Todos» se limpia `selectedTagFilterId` y el modo edición de chips.
- Objetivo UX: el número debe ser **coherente con las filas** que el usuario ve al activar ese chip en el mismo contexto (filtro de pin + query), no un total «global» de otra superficie.
- **Todos** + **query vacía** + lista vacía curada: `(N)` cuenta solo spots Flowya en las **mismas filas** que muestra el buscador: si hay secciones con ítems, solo esos ítems; si no, la lista plana `defaultItemsForEmpty`. **No** el total de spots con esa etiqueta en toda la cuenta. Implementación: `spotIdsForTagFilterCounts` + `countTagsInSpotIds`.
- **Por visitar** / **Visitados**: el pool de conteo es el de `filteredSpots` para ese filtro (alineado a la lista vacía de esos modos).
- **Query ≥ 3** o flujo KPI con `showFilteredResultsOnEmpty`: se usa el pool amplio de spots del filtro de pin (`filteredSpots` en Todos) hasta definir regla más fina.

---

## 2) Reglas de creación y normalización (cliente)

Implementación: `lib/tags.ts` → `normalizeTagSlug`, `createOrGetUserTag`.

| Regla | Comportamiento |
|--------|----------------|
| Entrada | `name` tras `trim()`; vacío → error «Tag vacío» |
| Slug | Minúsculas, NFD sin marcas diacríticas, solo `[a-z0-9]` separados por `-`, sin guiones extremos, **máx. 64 caracteres** |
| Slug vacío tras normalizar | error «Tag inválido» |
| Sesión | `createOrGetUserTag` exige usuario autenticado |
| Duplicados | Si ya existe `user_tags` con mismo `(user_id, slug)`, se **reutiliza** la fila (no duplicar nombre canónico) |
| Carrera 23505 | Tras insert concurrente, relectura por `slug` + `user_id` |

**Replicación nativa:** misma función de normalización en cliente; unicidad garantizada en BD.

---

## 3) Asociación a un spot

- `attachTagToSpot(spotId, tagId)` → INSERT en `pin_tags`
- `detachTagFromSpot(spotId, tagId)` → DELETE
- `deleteUserTag(tagId)` → borra `user_tags` (CASCADE en asociaciones según migración)

---

## 4) UI: `TagChip` (design system)

Props relevantes: `label`, `showHash` (default `true` → muestra `#nombre`), `onRemove`, `onPress`, `disabled`, `visualVariant` (`default` | `suggested`).

| Variante | Uso |
|----------|-----|
| `default` | Etiqueta en lista o modal; fondo `background`, texto `text` |
| `suggested` | Sugerencias antes de confirmar; fondo `stateSurfaceHover`, texto `textSecondary` |
| Con `onRemove` | Chip con X roja (`stateError`) al final — quitar etiqueta del spot |
| Con `onPress` sin `onRemove` | Añadir etiqueta existente desde sugerencias |

**No** usar `TagChip` para la fila de **filtro** del buscador: ahí los chips son `Pressable` + `Text` en `SearchSurface` (estados «Cualquiera», selección `tint`, modo edición, long-press).

---

## 5) Búsqueda: fila de chips (`SearchSurface`)

- La fila de chips de filtro por etiqueta (incluido chip **Cualquiera**) **solo** se monta cuando el filtro de pin es **Por visitar** o **Visitados** (`tagFilterOptions`/`onTagFilterChange` definidos en `MapScreenVNext` solo en esos modos).
- Chip **«Cualquiera»** (dentro de la fila de etiquetas): limpia filtro de etiqueta (`selectedTagFilterId === null`).
- Chips por etiqueta: `#nombre` y opcionalmente ` (count)` en contexto de recuentos.
- **Tap:** filtra por `tagId` o alterna off si ya estaba seleccionado.
- **Long-press (≈450 ms)** en chip de etiqueta: entra en **modo edición** (si hay `onTagFilterEnterEditMode`).
- **Modo edición:** chips de etiqueta muestran icono papelera; tap en papelera → `onRequestDeleteUserTag(id, name)`; botón **«Listo»** → `onTagFilterExitEditMode`.
- En modo edición, tap en «Cualquiera» y chips de filtro no cambian filtro (opacidad reducida).
- Orden y conteos: ver `countTagsInSpotIds` en `lib/tags.ts` (`includeZeroCounts` para mostrar chips con recuento 0 en pools filtrados).

---

## 6) Cards de resultado (`SearchListCard`)

- `tagChips`: array `{ id, label }` — se muestran como chips compactos en la fila de señales (junto a distancia, landmark, estado pin).
- Quick action `kind: 'add_tag'` — CTA «Etiquetar» alineada con listados; debe coordinarse con `suppressCardPress` (ventana ~650 ms) para no disparar `onPress` de la fila.

---

## 7) Spot sheet (`SpotSheet`)

- **No** duplicar la fila de chips de filtro del buscador en el sheet.
- `SpotSheetMetaRow`: distancia + chips `#tag` (tap → abre buscador con pin **Por visitar** o **Visitados** según el spot —`visited` → Visitados, si no → Por visitar—, etiqueta aplicada y sin modo edición de tags) + **«Etiquetar»** si aplica.
- Props: `sheetTagChips`, `onSheetTagChipPress`, `onSheetEtiquetarPress`.

---

## 8) Modal de asignación de etiquetas (runtime)

- Controlado en `MapScreenVNext` cuando `tagAssignSpot != null`.
- Muestra título del spot, chips actuales con `tagChip` + `onRemove`, input para crear/buscar, sugerencias con `TagChip` `visualVariant="suggested"`.
- Al guardar: `createOrGetUserTag` + `attachTagToSpot`; feedback por **System Status** (toast).

---

## 9) Coexistencia con `pinFilter` (Todos / Por visitar / Visitados)

- El filtro de **pins** (`MapPinFilterInline`) y el filtro de **etiqueta** son ortogonales: se documenta la intención en `docs/contracts/SEARCH_V2.md` y aquí.
- Al pasar a pin **Todos**, se limpia el filtro de etiqueta y el modo edición de chips (`MapScreenVNext`).

---

## 10) Criterios de aceptación (v1) — checklist

1. Usuario autenticado crea etiqueta y reutiliza sin duplicados semánticos (slug).
2. Cards y sheet muestran chips de etiquetas del usuario para ese spot.
3. Barra de chips en buscador permite filtrar y, en modo edición, eliminar etiqueta del inventario.
4. RLS impide lectura/escritura de tags de otros usuarios.
