# SEARCH_V2 — Contrato mínimo (Explore vNext)

**Fuentes de verdad:**

* `docs/definitions/search/SEARCH_V2.md` (source of truth)
* `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md` (nuevo)
* `docs/contracts/USER_TAGS_EXPLORE.md` (etiquetas personales + búsqueda + sheet)
* `docs/contracts/SYSTEM_STATUS_TOAST.md` (toast / System Status — anclaje Explore)
* `docs/ops/OPEN_LOOPS.md` (estado operativo; no existe snapshot `CURRENT_STATE.md`)

---

## 1) Entry/Exit del modo búsqueda en Explore vNext

* **Entry:** Usuario abre búsqueda desde BottomDock (SearchPill del DS, label "Buscar spots") o equivalente.
* **Exit:** Cerrar búsqueda (botón close) o selección que lleva a spot/mapa (al seleccionar un item, el mapa centra y el SpotSheet se abre en MEDIUM).

---

## 2) Persistencia del texto y reglas de limpiar

* **Query:** Persistida en `useSearchControllerV2` (`query`, `setQuery`). Threshold de caracteres (p.ej. 3) aplicado en controller para ejecutar búsqueda.
* **Clear "X":** Limpia texto y resultados del controller.

  * En Create Spot paso 1: **selectedPlace se mantiene** (el pin no se quita). (Fuente: defs/search/SEARCH_V2.md + bitácora 031)

---

## 3) Guardrails (qué NO hace)

* **No “auto-crear desde texto”:** Prohibido que un CTA “Crear <query>” dispare geocoding y termine creando una calle homónima o un match textual inesperado.

  * Crear desde Mapbox/place **solo** por selección explícita de un resultado con coordenadas.
  * “Crear spot nuevo” es UGC y usa contexto del mapa (centro del mapa / ubicación), sin resolver texto.
* **“Sin resultados”:** cuando `query >= threshold` y `results.length === 0`, aplicar el contrato `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`.
* **No duplicar DS:** UI de búsqueda usa componentes canónicos del design system; no crear variantes one-off para Search.

---

## 4) Web vs Native (implementación permitida)

* **Native:** Search vive en sheet/overlay nativo según implementación estable.
* **Web:** Se permite overlay si es **keyboard-safe** y sin espacio blanco/scroll roto.

  * Si se detecta regresión: preferir volver a layout de sheet estable (rollback = revert del PR).

* **Superficie del panel por filtro:** con `pinFilter` `saved` o `visited`, el fondo (y borde en nativo) del contenedor del buscador debe usar los tokens `countriesPanel*` alineados con `CountriesSheet`, vía `getSearchPanelSurfaceColors` en `lib/search/searchPanelSurface.ts`. Con `all`, fondo `searchPanelAllBackground` (gris tenue). Detalle: `docs/definitions/search/SEARCH_V2.md`.

---

## 5) “Sin resultados” (comportamiento canónico)

Cuando `query >= threshold` y `results.length === 0`, el buscador debe seguir el contrato:

* `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md` (nuevo).

Regla adicional por filtro activo:

- Si filtro es `saved` (`Por visitar`) o `visited` (`Visitados`):
  - no renderizar recomendaciones externas,
  - no renderizar CTA `Crear spot aquí`,
  - mostrar mensaje centrado orientando a cambiar a `Todos`.
- Si filtro es `all` (`Todos`): comportamiento normal de recomendaciones + chooser.

Reglas QA agregadas (2026-02-25):

- Selección explícita de POI externo en chooser/search: no bloquear creación por anti-duplicado.
- Si el filtro activo (`saved`/`visited`) queda sin resultados visibles en viewport, reencuadrar al conjunto del filtro en el mundo.
- Si el filtro activo sí tiene resultados visibles en viewport, mantener cámara actual (sin saltos).

---

## 6) Flags de migración Search V2 POI-first

Track B usa flags de rollout seguro:

- `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_POI_RESULTS`: habilita adapter externo POI para fetch de resultados externos en `query >= 3` con filtro `all` (y en chooser de sin-resultados cuando aplica).
- `EXPO_PUBLIC_FF_SEARCH_MIXED_RANKING`: reserva para ranking mixto (interno + externo) por secciones.
- `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_DEDUPE`: habilita deduplicación externa antes de render.

Estado actual (Fase A-B):

- Adapter `searchPlacesPOI` integrado para resultados externos de búsqueda textual (`query >= 3`, filtro `all`).
- Fuente principal externa: Search Box `/forward` (una llamada por query).
- Fallback estable a Geocoding v6.
- Guardrail 429: cooldown temporal de Search Box y fallback automático para evitar degradación total.
- Flujo operativo: intento local con `bbox/proximity` del viewport y, si no hay match, reintento global sin `bbox`.
- UI/contrato de chooser de sin-resultados no cambia.

Estado actual (Fase C):

- Con `EXPO_PUBLIC_FF_SEARCH_MIXED_RANKING=true`, Search muestra sección externa adicional (POI/direcciones) junto a resultados de spots internos.
- Orden operativo: spots internos primero; sección externa como complemento.
- Dedupe interno/externo activo por `linked_place_id` y proximidad+nombre (si `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_DEDUPE=true`).
- Ranking de intents externo activo en sugerencias (`poi_landmark > poi > place > address`).
- Intents operativas en adapter externo:
  - `landmark` (monumentos/atracciones),
  - `geo` (topónimos/lugares),
  - `recommendation` (resto).
- Precedencia obligatoria: `landmark > geo > recommendation`.
- Guardrail de ranking `landmark`:
  - priorizar match exacto + cobertura completa de tokens,
  - normalizar variantes/typos frecuentes de query para scoring (ej. `Eifel`),
  - degradar resultados comerciales o de dirección cuando compiten con candidatos landmark.
- En `landmark`, no usar sesgo local (`bbox/proximity`) para evitar que resultados cercanos al usuario dominen sobre el landmark canónico.

Estado actual (Fase D parcial):

- Create-from-search usa snapshot mínimo externo ya alineado con create-from-POI (`linked_place_id`, `linked_place_kind`, `linked_maki`, `lat/lng`, `name`).
- Guardrail: IDs sintéticos de fallback no se persisten como `linked_place_id`.

Estado actual (Fase E parcial):

- Rollout por flags en secuencia controlada: adapter -> dedupe -> ranking mixto.
- Métricas runtime de Search disponibles para QA/no-go en `globalThis.__flowyaSearchMetrics` (sin backend obligatorio en esta fase).

## 7) UX de filtros (dropdown) — pendientes QA

- Si el usuario está en `Todos` y cambia estado de un spot desde sheet a `Por visitar`/`Visitados`, el dropdown puede mostrar badge de "pendiente de lectura".
- El badge se limpia al abrir/aplicar el filtro destino.
- Opciones de filtro sin resultados deben verse deshabilitadas y sin contador.

## 8) Quick edit en resultados (visitados)

- En filtro `visited`, cuando un spot no tiene `description_short`, Search puede mostrar CTA inline para agregar descripción corta.
- El editor rápido de descripción debe cumplir keyboard-safe:
  - superficie visible en zona superior (safe area),
  - un solo owner de teclado por contexto (si entra Paso 0, Search/quick edit cierran),
  - placeholder contextual con nombre del spot (no texto genérico).

## 9) Contrato de card en `visited` (información y acciones)

### 9.1 Prioridad de contenido

En `visited`, la card no debe priorizar dirección como subtítulo por defecto.

Regla:
- Si existe `description_short` -> mostrar `description_short`.
- Si falta `description_short` -> no mostrar dirección como fallback primario; mostrar CTA inline de completitud.

Objetivo:
- Mejor lectura editorial del spot visitado.
- Reducir ruido de dirección postal cuando el usuario espera contexto personal del lugar.

### 9.2 Acciones in-card obligatorias (cuando falta metadata)

- Si falta `cover_image_url`: mostrar acción `Agregar imagen` en el slot de media.
- Si falta `description_short`: mostrar acción `Agregar una descripción corta.` en el slot de subtítulo.

Ambas acciones deben poder dispararse desde Search sin romper contexto del listado/filtro.

Regla web:
- no anidar controles interactivos tipo `button` dentro de otro `button` para evitar hydration errors en RN Web.
- si la card principal es accionable, las quick actions internas deben manejar propagación de eventos de forma explícita.

### 9.3 Continuidad de flujo

- Tras guardar imagen o descripción, Search debe reflejar el cambio (patch local + refresh coherente) sin sacar al usuario del contexto actual.
- `Agregar imagen` debe abrir picker y persistir sin navegación adicional; si falla, feedback de error por toast y continuidad en lista.

---

## 10) Empty-state con query vacía (`all`) — pipeline canónico

Cuando Search está abierto con `query === ""` y `pinFilter === "all"`, la prioridad de fuentes es:

1. **Cold start bootstrap** (si está activo): secciones globales de descubrimiento.
2. **Local-first sin costo API extra**:
   - spots en zona (`defaultSpotsForEmpty`, radio `SPOTS_ZONA_RADIUS_KM`, top 10),
   - landmarks/POI visibles del viewport (`collectVisibleLandmarks` sobre `queryRenderedFeatures`).
3. **Fallback "Lugares populares en Flowya"** cuando hay pocos resultados locales:
   - criterio: `localCount < 4`,
   - sección única con merge estable + dedupe por id (orden: `flowyaNotVisited` -> `porVisitar` -> `deLaZona`),
   - límite visual: 10 items.

Guardrails del fallback Flowya:

- Se calcula solo cuando se cumple: Search abierto + query vacía + filtro `all` + sin cold start + sin country drilldown activo.
- Si el fetch falla o devuelve vacío, el fallback no rompe UI: la sección simplemente no se renderiza.
- No se muestran spots ocultos (`is_hidden=true`) porque el RPC ya los excluye.

---

## 11) Interfaz pública: `get_most_visited_spots` (Supabase RPC)

Contrato operativo actual:

- Nombre: `public.get_most_visited_spots(p_limit int DEFAULT 10)`.
- Rango efectivo de `p_limit`: `1..50` (clamp server-side).
- Respuesta: columnas públicas de spot + `visit_count`.
- Privacidad mínima: umbral `HAVING COUNT(*) >= 3` (k-anonymity).
- Seguridad: `SECURITY DEFINER`, sin exponer `user_id`.

Uso en cliente:

- `lib/search/flowyaPopularSpots.ts` (`fetchMostVisitedSpots(limit = 10)`).
- `MapScreenVNext` lo usa solo para empty-state en `all` con query vacía y pocos resultados locales.

---

## 12) Etiquetas personales (user tags / pin tags)

- **Ámbito:** etiquetas **por usuario** (owner-only), integradas en listados de búsqueda, cards, fila de chips en `SearchSurface`, sheet de spot y modal de asignación.
- **No** sustituyen categorías Mapbox; **no** hay tags globales compartidos en v1.
- **Filtro de etiqueta** y **filtro de pin** (`Todos` / `Por visitar` / `Visitados`) son conceptos ortogonales; la UX debe evitar ambigüedad (chips de etiqueta bajo el filtro de pin; limpieza de etiqueta al cambiar pin filter según implementación en `MapScreenVNext`).
- **Contrato detallado** (creación, slug, RLS, `TagChip` vs chips de filtro, sheet, modal): `docs/contracts/USER_TAGS_EXPLORE.md`.
- **Feedback** de crear/eliminar/asignar: `useSystemStatus` — ver `docs/contracts/SYSTEM_STATUS_TOAST.md` (anclaje inferior en Explore; con buscador abierto **sin** offset de altura del sheet).

---

## 13) Troubleshooting rápido (Search empty-state)

- No aparece "Lugares populares en Flowya":
  - verificar condiciones de entrada (Search abierto, query vacía, filtro `all`, sin cold start, sin country drilldown),
  - verificar que `localCount < 4` (si hay suficientes locales, no se muestra por diseño),
  - revisar que el RPC tenga datos con `visit_count >= 3` (k-anonymity puede dejar vacío en entornos con poco tráfico).
- Resultados externos inconsistentes con viewport:
  - confirmar que en `query >= 3` se usa intento con `bbox/proximity` y luego fallback global si el intento local devuelve 0.
- Duplicados entre spots internos y externos:
  - validar `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_DEDUPE=true`.
