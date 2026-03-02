# SEARCH_V2 — Contrato mínimo (Explore vNext)

**Fuentes de verdad:**

* `docs/definitions/search/SEARCH_V2.md` (source of truth)
* `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md` (nuevo)
* `docs/ops/CURRENT_STATE.md`

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

- `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_POI_RESULTS`: habilita adapter externo POI en sin-resultados.
- `EXPO_PUBLIC_FF_SEARCH_MIXED_RANKING`: reserva para ranking mixto (interno + externo) por secciones.
- `EXPO_PUBLIC_FF_SEARCH_EXTERNAL_DEDUPE`: habilita deduplicación externa antes de render.

Estado actual (Fase A-B):

- Adapter `searchPlacesPOI` integrado para sin-resultados.
- Fuente principal externa: Search Box `/forward` (una llamada por query).
- Fallback estable a Geocoding v6.
- Guardrail 429: cooldown temporal de Search Box y fallback automático para evitar degradación total.
- UI/contrato de chooser no cambia.

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
