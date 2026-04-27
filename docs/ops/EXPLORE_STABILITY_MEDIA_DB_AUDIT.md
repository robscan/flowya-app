# EXPLORE_STABILITY_MEDIA_DB_AUDIT

**Fecha:** 2026-04-26  
**Estado:** auditoría / plan seguro; sin implementación runtime  
**Alcance:** Explore map-first, mapa, sheets, navegación, media, Supabase, listados, filtros, búsqueda y capacidades futuras.

---

## 1. Estado actual

### Fuentes revisadas

- `docs/ops/OPEN_LOOPS.md`
- `docs/ops/governance/DECISIONS.md`
- `docs/ops/governance/GUARDRAILS.md`
- `docs/ops/strategy/SYSTEM_MAP.md`
- `docs/definitions/contracts/` (deprecado; solo `SPOT_FLOWS.md` mantiene señal histórica)
- `docs/contracts/`
- `docs/bitacora/` con foco en entradas 346, 347, 373, 374, 377 y cierres Explore recientes
- código real en `components/explorar/MapScreenVNext.tsx`, `hooks/useMapCore.ts`, `lib/places/areaFraming.ts`, `lib/spot-images.ts`, `lib/spot-image-upload.ts`, `lib/spot-personal-images.ts`, `hooks/useSpotGalleryUris.ts`, `app/spot/edit/[id].web.tsx`, `app/spot/edit/[id].tsx`
- migraciones Supabase `001` a `032`

### Fuentes obligatorias ausentes o movidas

- `docs/ops/CURRENT_STATE.md` no existe. `OPEN_LOOPS.md` declara explícitamente que fue retirado y que la fuente operativa actual es `OPEN_LOOPS` + bitácora.
- `docs/ops/SYSTEM_MAP.md`, `docs/ops/DECISIONS.md` y `docs/ops/GUARDRAILS.md` no existen en la ruta literal; existen como:
  - `docs/ops/strategy/SYSTEM_MAP.md`
  - `docs/ops/governance/DECISIONS.md`
  - `docs/ops/governance/GUARDRAILS.md`
- `docs/definitions/contracts/` está deprecado; el canon vigente es `docs/contracts/*`.

### Runtime real

- `MapScreenVNext` es el orquestador dominante: estado de spots, `selectedSpot`, `poiTapped`, filtros, tags, búsqueda, sheet state, media, bulk selection, deep links y handoff de edición viven juntos.
- `useMapCore` encapsula Mapbox: `flyTo`, `fitBounds`, `handleReframeSpot`, `programmaticMoveRef`, capa de spots y eventos `moveend`.
- La cámara se mueve por varios paths:
  - `focusCameraOnSpot()` usa `applyExploreCameraForPlace()` con `mapbox_bbox`/`mapbox_feature_type`.
  - `handleReframeSpot()` en `useMapCore` usa `applyPlaceReframeCycle()`.
  - filtros de países usan `computeLngLatBoundsFromSpots()` + `map.fitBounds()`.
  - `handlePinFilterChange()` evita reencuadre global salvo pending spot.
  - deep link/post-create usan `queueDeepLinkFocus()`.
- Media pública usa `spot_images.url` con URL pública completa del bucket `spot-covers`.
- Media privada usa `spot_personal_images.storage_path` + bucket privado `spot-personal` + signed URLs.
- Avatar de perfil ya usa el patrón más sano: `profiles.avatar_storage_path` y helper para construir URL pública.
- Etiquetas personales están en `user_tags` + `pin_tags`; bulk tagging parcial ya existe para asignar etiquetas, pero el modelo de selección no cubre aún acciones masivas generales.

### Respuestas explícitas de arquitectura

**Supabase Storage para V1:** sí conviene seguir usándolo en V1. Ya existe RLS/policies por owner, bucket público para contenido compartido y bucket privado para fotos personales. Cambiar proveedor ahora aumentaría riesgo sin resolver la causa raíz.

**URL completa vs path:** hoy se guarda URL completa en `spots.cover_image_url` y `spot_images.url`. Para V1 se puede tolerar como legacy; el canon recomendado es `image_path`/`storage_path` en DB y helper `getImageUrl()` para construir URL pública, URL firmada, CDN o thumbnail. Perfil ya usa `avatar_storage_path`, que es el patrón a imitar.

**¿Es correcto exponer URL pública de Supabase?** Sí solo para fotos marcadas públicas por consentimiento (`share_photos_with_world=true`). No debe ser el canon permanente de almacenamiento en DB. Para privadas, nunca URL pública: usar `spot_personal_images.storage_path` + signed URL.

**Buckets:**

- `spot-covers`: público, lectura abierta, escritura owner-only. V1: portada y galería pública.
- `spot-personal`: privado, owner-only, signed URLs. V1: fotos personales.
- `profile-avatars`: público, path en DB, escritura owner-only.

**Cache/versionado/thumbnails/CDN:** hoy hay cache local de `spot_images` con TTL 15s y cache bust manual en algunas superficies, pero no hay versión por fila ni thumbnails. Recomendación: guardar `storage_path`, `version`, `width`, `height`, `blurhash`, `thumb_path` y construir URL desde helper para poder cambiar a CDN/transforms sin tocar consumidores.

**Regla de UI tras upload:** todo upload debe actualizar de inmediato el estado local que consume esa imagen (`selectedSpot`, `spots`, hooks de galería, Search cache) y además invalidar cache (`invalidateSpotImagesCache`, hooks o query key futura). No basta con insertar en DB y esperar remount. El hero canónico debe resolver: override/optimista durante upload → fotos personales si existen en Visitados → galería pública → `cover_image_url` legacy. El CTA de “Subir fotos” es complementario cuando ya hay imagen pública, no sustituto.

**DB escalable:** `spots` debe quedarse con campos de acceso caliente y semántica estable: `id`, `title`, descripciones cortas, coords, owner, hidden, timestamps, portada derivada/cache, snapshot geográfico mínimo. Etiquetas, media, pins, categorías, contexto país/región, notas largas, historial y visibilidad por foto deben vivir en tablas relacionadas.

**Datos derivados vs persistidos:** de Mapbox conviene guardar snapshot mínimo al crear/editar (`linked_place_id`, `maki`, `feature_type`, bbox saneado, address, country/region/city si se acuerda). Datos externos dinámicos como clima actual, requisitos de visa o alertas no deben quedar embebidos en `spots`; se enriquecen por tablas/versiones propias.

**Buscador + filtros + seleccionar:** propuesta canónica V1: botón Search siempre visible arriba derecha solo si no colisiona con Search abierto/Create/Account; filtros como superficie secundaria común; selección como modo efímero del listado activo con `X`, `Seleccionar todo`, contador y acciones. El contenido de filas debe ser idéntico entre Search, CountriesSheet y sidebar; solo cambia contenedor.

---

## 2. Riesgos

### P0 / estabilidad

1. **Cámara puede saltar a país/ciudad incorrectos por `mapbox_bbox` envenenado.**  
   `applyExploreCameraForPlace()` confía en `spot.mapbox_bbox` si `shouldFitBoundsForPlace()` lo considera válido. En edición web, `handleSave()` preserva bbox previo si el usuario cambia ubicación sin nuevo bbox, y solo escribe `mapbox_bbox` cuando Mapbox lo trae. Si el spot cambia a coordenadas nuevas pero conserva bbox viejo, el primer reencuadre puede ir a una entidad anterior o ambigua.

2. **Explore puede volver sin pins después de editar por carrera de foco/refetch.**  
   Al volver desde edit, `router.replace(getMapSpotDeepLink(id))` dispara deep link; simultáneamente `useFocusEffect` aplica `mergeSpotFromDbById()` o `refetchSpots()` con ventana de 8s. Si el foco reciente intenta merge de un `selectedSpot` obsoleto mientras el deep link trae otro estado, puede haber selección visible pero lista/capa aún no reconciliada.

3. **`mapbox_bbox` y `latitude/longitude` no tienen invariant común.**  
   No hay validación canónica que exija que el centro del bbox esté cerca del punto del spot. Ya existe una heurística anti-océano para países, pero no para reencuadre de un spot individual.

4. **El flujo POI no guardado + fotos podía quedarse en busy si el picker no se abría.**  
   Mitigación aplicada 2026-04-26: `handlePoiAddPhotos` inicia el picker web dentro del gesto del usuario después del gate mínimo de auth, igual que el fix previo de `handleQuickAddImageFromSearch` (bitácora 377). Sigue pendiente QA manual en web móvil y no se declara paridad nativa de galería múltiple.

5. **Subir muchas fotos puede trabar la app.**  
   Los uploads se hacen en serie con optimización local por archivo, sin cola compartida, cancelación, límite de concurrencia explícito ni scheduler de UI. Esto reduce riesgo de saturar Storage, pero bloquea percepción y deja un handler largo con varios awaits.

### Arquitectura / deuda

1. **`DATA_MODEL_CURRENT.md` está atrasado.**  
   La introspección base es de 2026-02-25 y no incluye de forma canónica `profiles`, `spot_images`, `spot_personal_images`, `user_tags`, `pin_tags`, `mapbox_bbox`, `mapbox_feature_type`, `pins.saved`, `pins.visited`, etc. `OPEN_LOOPS` ya declara `OL-DATA-MODEL-INTROSPECTION-001`.

2. **Media pública guarda URL completa, no path.**  
   `spot_images.url` y `spots.cover_image_url` guardan URLs completas de Supabase. Esto acopla DB al dominio/proveedor y complica CDN, transforms, thumbnails y migración de bucket. Perfil ya resolvió el mismo problema con `avatar_storage_path`.

3. **No hay entidad canónica única de media.**  
   Hoy existen `spot_images` para público y `spot_personal_images` para privado. La preferencia `share_photos_with_world` funciona como default global, pero no permite privacidad por foto sin rediseño.

4. **Listados tienen contenido compartido parcialmente, pero la composición sigue duplicada.**  
   `SearchResultCard` es común, `ExplorePlacesListSectionTitleRow` es común, pero la construcción de quick actions, selection mode, distance, tagChips y empty state está duplicada entre `CountriesSheet` y `SearchSurface` desde `MapScreenVNext`.

5. **Búsqueda en `saved/visited` mezcla recomendaciones externas en código pese al contrato.**  
   `SEARCH_RUNTIME_RULES.md` dice que `Por visitar`/`Visitados` no deben mostrar recomendaciones externas ni CTA crear. El runtime actual usa `mergeLikeAllMode` para `all | saved | visited`; aunque luego pasa `placeSuggestions=[]` en props, la intención del código no está blindada por un helper puro.

---

## 3. Bugs / hipótesis

### Mapa, sheet y navegación

**Bug A: después de guardar Edit Spot, vuelven sheet/mapa pero no cargan pins.**  
Hipótesis verificable:

- `app/spot/edit/[id].web.tsx` guarda y hace `router.replace(getMapSpotDeepLink(spot.id))`.
- `MapScreenVNext` recibe `spotId` y `sheet`, hace fetch del spot, `setSelectedSpot`, `setSheetState`, `queueDeepLinkFocus`, y agrega el spot si no está en `spots`.
- En paralelo, `useFocusEffect` puede ejecutar `mergeSpotFromDbById(selectedSpot.id)` o `refetchSpots()` según ventana de 8s.
- Si `refetchSpots()` devuelve `[]` por sesión no lista, cambio de cuenta, error silenciado o carrera auth, `setSpots([])` puede dejar la capa sin pins hasta siguiente refetch.

Prueba: instrumentar `refetchSpots`, `mergeSpotFromDbById`, `deepLink applySpot`, longitud de `displayedSpots`, `map.getSource("flowya-spots")` y auth uid durante volver desde edit.

**Bug B: al cerrar sheet de spot editado cambia a otro país.**  
Hipótesis verificable:

- El cierre de `SpotSheet` limpia `selectedSpot`, restaura `CountriesSheet` si existía snapshot, pero no debe mover cámara por sí mismo.
- El salto probablemente viene antes: `focusCameraOnSpot()` o `handleReframeSpot()` usando bbox viejo o ambiguo; al cerrar se revela el viewport ya movido.
- Otra posibilidad: restaurar `CountriesSheet` reinyecta `countryFilter` previo y algún fitBounds de país pendiente aplica después.

Prueba: loguear `selectedSpot.latitude/longitude`, `mapbox_bbox`, `mapbox_feature_type`, `countriesSheetBeforeSpotSheetRef`, `pendingCountryFitBoundsRef` y origen de cada `fitBounds`/`flyTo`.

**Bug C: mapa se bloquea tras navegación, zoom, edición o uso intenso.**  
Hipótesis verificable:

- Hay muchas superficies con timers/animations/refs: filter wait, globe entry, sidebar resize, Search overlay, gallery uploads.
- `programmaticMoveRef` se resetea 200ms después de `moveend`; cadenas cercanas de `flyTo`/`fitBounds` pueden clasificar mal gestos, colapsar sheets o retrasar overlays.
- Mapbox source/layers se crean una vez con `setupSpotsLayer()` y se actualizan por `updateSpotsLayerData()`. Si un style reload deja source ausente, el update retorna y no reestablece capa hasta que cambie dependencia que dispare setup.

Prueba: stress test con navegación edit→explore, zoom rápido, cambio filtro, Search abierto/cerrado, subida de fotos; observar errores Mapbox, existencia de source/layers y `viewportNonce`.

**Bug E: cambiar filtro con SpotSheet activo reemplaza la consulta por CountriesSheet.**  
Corregido en rama 2026-04-26:

- `selectedSpot` / `poiTapped` domina sobre WelcomeSheet y CountriesSheet.
- El auto-open `all → saved/visited` se bloquea durante selección activa y se difiere hasta cerrar el SpotSheet si el filtro activo mantiene datos.
- Welcome/Countries comparten `ExploreContextSheetHeader` sin `X` de cierre base.
- Los accesos circulares flotantes de países/lugares/reapertura Welcome sobre controles de mapa salen del canon.
- `saved/visited` abren CountriesSheet como superficie base al hidratar con count > 0; la banda inferior KPI/FLOWYA/Search ya no es fallback.
- Una selección desde búsqueda fuera del filtro activo se fuerza visible en mapa con su estado real.
- La navegación país→lugares mantiene `medium`; el `fitBounds` programático no colapsa a `peek`.

Prueba: abrir spot desde `Todos`, cambiar a `Por visitar` y `Visitados`; la consulta debe permanecer. Al cerrar, CountriesSheet puede aparecer como contexto diferido si hay count > 0. Ver bitácora `386`.

**Bug D: “Gran Parque La Plancha” encuadra Mérida y luego Nueva Orleans.**  
Hipótesis verificable:

- La búsqueda externa puede devolver resultado local por bbox/proximity y luego fallback global si `results.length === 0` con bbox. Para nombres ambiguos, `searchPlaces` o POI puede traer una entidad homónima.
- Si un spot persistido tiene `mapbox_bbox` de ciudad/región o de un resultado incorrecto, `applyPlaceReframeCycle()` alterna contextual vs zoom amplio sobre el punto del spot, produciendo sensación de dos destinos.
- Si `mapbox_bbox` no contiene el punto `latitude/longitude`, primer paso usa bbox incorrecto y segundo paso usa punto correcto o viceversa.

Prueba: inspeccionar fila DB del spot: `latitude`, `longitude`, `mapbox_bbox`, `mapbox_feature_type`, `linked_place_id`, `linked_maki`; validar que el bbox contiene el punto y está dentro de un radio razonable.

**Bug E: spots con coordenadas incorrectas o ambiguas.**  
Hipótesis verificable:

- Tap de mapa toma coordenadas del feature renderizado (`geometry.coordinates`) y no necesariamente del tap del usuario. Para labels de ciudad/parque puede ser centroid/label anchor.
- Create desde no results usa centro del mapa.
- Edit location puede persistir coordenadas de `selectedPlace` o draft; si no hay `selectedPlace`, linking se resuelve por título+coords.

Prueba: comparar origen de creación (`map_tap`, `search_suggestion`, draft) vs coordenadas guardadas. Hoy no hay columna `source` ni snapshot de `place` en DB; debe marcarse como OPEN LOOP.

---

## 4. Contratos

### Contratos existentes que se respetan

- `GUARDRAILS.md`: Explore es map-first; no abrir Fluir ni Recordar completo.
- `MAP_RUNTIME_RULES.md`: cámara por intención; evitar `fitBounds` global automático; deep link/post-create no debe resetear filtro.
- `FILTER_RUNTIME_RULES.md`: política sticky; mutaciones no cambian filtro automáticamente; excepción temporal de visibilidad.
- `EXPLORE_SHEETS_BEHAVIOR_MATRIX.md`: Search/Create/Spot/Countries no deben apilarse de forma incompatible.
- `PHOTO_SHARING_CONSENT.md`: ON = fotos públicas en `spot_images`/`spot-covers`; OFF = privadas en `spot_personal_images`/`spot-personal`.
- `USER_TAGS_EXPLORE.md`: etiquetas personales owner-only; bulk tagging ya existe como extensión.
- `DEC-006`: mutaciones requieren auth; soft delete; lectura pública intencional.

### Contratos que necesitan endurecimiento

1. **Contrato de cámara de spot persistido.**
   - `mapbox_bbox` solo puede usarse si contiene o intersecta razonablemente el punto del spot.
   - Si bbox y punto divergen, gana el punto.
   - Al editar coordenadas sin nuevo bbox, se debe limpiar bbox/tipo o recalcularlos.

2. **Contrato de handoff Edit → Explore.**
   - Un regreso desde edit debe tener una sola intención: seleccionar spot actualizado, mantener sheet y reconciliar pins.
   - Durante ese handoff no debe ejecutarse un refetch que vacíe el mapa por auth aún no hidratado.

3. **Contrato de media.**
   - V1 pública puede seguir en Supabase Storage, pero el canon nuevo debe ser `storage_path` + helper `getImageUrl()`.
   - Toda mutación de galería debe invalidar caché y actualizar estado local del consumidor antes o junto con DB refresh.

4. **Contrato de listados.**
   - Un único modelo `ExplorePlaceListItem`/`ExplorePlaceRowModel` debe alimentar Search, CountriesSheet y futuras listas.
   - El contenedor puede variar; contenido, estados, selección y acciones deben salir de un presenter común.

---

## 5. OPEN LOOPS

La integración prudente con `docs/ops/OPEN_LOOPS.md` evita abrir loops paralelos cuando el alcance ya existe como deuda, cierre reciente o dependencia.

### Integración con OL existente

| Punto del plan | Estado en OL | Tratamiento recomendado |
|---|---|---|
| Introspección DB | Ya existe `OL-DATA-MODEL-INTROSPECTION-001`. | No abrir OL nuevo. Ejecutarlo antes de migraciones de `spots`, media o contexto geográfico. |
| Privacidad por foto | Ya documentada en análisis 2026-04-20; depende de introspección. | Mantener como dependencia estructural posterior a canon media. No parchear sobre tablas actuales. |
| Etiquetas v2, rename, bulk tagging, multi-país | Ya evaluado y parcialmente ejecutado en PR #158 / bitácora 376. | No duplicar. El plan actual solo añade acciones masivas no-tag y canoniza selección/listados. |
| Filtros, chips, modal/sidebar, CountriesSheet | Muchos OL cerrados 2026-04-18. | Tratar como baseline. Solo ajustar regresiones o gaps explícitos: `Filtrar` en `Todos`, empty states y selección integrada. |
| Search/toolbar | `OL-SEARCHV2-002` sigue postergado; search overlay y entry layout ya tienen cierres recientes. Bug QA 2026-04-26: `Plancha`/`plancha` no recupera “Gran Parque La Pancha”, aunque `Gran parque` sí; captura muestra typo `placha` con resultados externos irrelevantes. | No reabrir SearchV2 completo. Crear micro-scope V1 para botón search arriba derecha, convivencia con filtros/selección y canon de recuperación de intención: tokens parciales, errores leves, acentos/case y prioridad de spots propios plausibles. |
| Galería web pública | `OL-CONTENT-002` cerrado web; media v2 fue retirado como secuencia inmediata. | No abrir media v2 grande. Hacer fix P0 de picker/refresh y preparar canon path-first sin migración destructiva. |
| Datos clima/unidades | Ya existe `OL-CONTENT-CLIMATE-UNITS-001`. | Integrarlo como un módulo del contexto territorial, no como campos sueltos en `spots`. |
| País/región/ciudad curados | Parcialmente mencionado en búsqueda futura y clima, pero no existe modelo integrado visa/transporte/salud/dinero/emergencias. | Abrir solo después de introspección como `OL-GEO-CONTEXT-BATCH-001` o incorporarlo a plan DB si producto lo aprueba. |
| Cámara/bbox y handoff edit→Explore | No hay OL operativo específico; hay bitácoras sobre fitBounds país/deep link. | Tratar como bloque correctivo P0 dentro del gate de saneamiento, no como feature nueva. |
| Origen de coordenadas | No existe contrato actual para `coordinate_source`, `place_snapshot`, `created_from`. | Incluir en diseño DB post-introspección. |

### OPEN LOOPS derivados sin duplicar

1. **P0 cámara/bbox de spot individual.** Falta contrato que valide consistencia entre `latitude/longitude` y `mapbox_bbox`.
2. **Origen de coordenadas.** Falta `coordinate_source`, `place_snapshot` o `created_from`; no asumir si un spot vino de búsqueda, tap de mapa, POI externo o import futuro.
3. **Media path migration.** Falta plan para pasar `spot_images.url` y `spots.cover_image_url` desde URL completa a path/cache derivada.
4. **Thumbnails/transforms.** Falta tabla/contrato para variantes (`original`, `thumb`, `cover`) y estrategia CDN.
5. **Acciones masivas no-tag.** Bulk selection existe para etiquetas, pero no para visitado/por visitar/ocultar/compartir.
6. **Botón de búsqueda fijo.** Falta política de colisión para search arriba derecha con filtros, selección, Create y sheets.
7. **Canon de recuperación de intención en búsqueda.** El usuario puede escribir solo parte del nombre, equivocarse levemente, omitir acentos o cambiar mayúsculas/minúsculas. La búsqueda debe ayudar a encontrar el candidato local plausible antes de mostrar ruido externo. Caso semilla: `Plancha`/`plancha` debe recuperar “Gran Parque La Pancha”; typo cercano `placha` no debe priorizar resultados externos si existe candidato local plausible. Hipótesis: matching local por frase/prefijo o scoring no pondera tokens internos del título y Mapbox externo gana demasiado pronto.
8. **Metadata nativa de fotos.** Falta decisión Expo/nativo para EXIF GPS, permisos y privacidad.
9. **Contexto territorial integrado.** Falta modelo para visa, transporte, salud, dinero, clima y emergencias por país/región/ciudad.

### Qué significa introspección

En este proyecto, **introspección** significa obtener evidencia directa del esquema real de Supabase objetivo, no inferirlo solo desde migraciones locales o tipos generados. Debe responder: qué tablas existen, columnas, tipos, nullability, defaults, constraints, índices, foreign keys, policies RLS, buckets Storage, objetos RPC/triggers y grants efectivos.

La introspección es necesaria porque `DATA_MODEL_CURRENT.md` declara verificación SQL de 2026-02-25 y luego solo ampliaciones parciales. Desde entonces entraron perfiles, tags, imágenes públicas/personales, preferencias de fotos, campos Mapbox y policies nuevas. Sin introspección, cualquier migración sobre `spots` o media puede duplicar columnas, romper RLS o consolidar una suposición falsa.

### Qué necesito de Supabase antes de ejecutar migraciones

1. **Esquema público actual:** export SQL o resultados de `information_schema.columns` para `spots`, `pins`, `profiles`, `spot_images`, `spot_personal_images`, `user_tags`, `pin_tags`, `feedback` y cualquier tabla nueva.
2. **Constraints e índices:** primary keys, foreign keys, unique constraints, checks, defaults e índices actuales.
3. **RLS y policies:** policies por tabla, `alter table ... enable row level security`, grants y funciones usadas por policies.
4. **Storage:** buckets existentes, si son públicos/privados, policies de `storage.objects`, límites y naming actual de paths.
5. **Triggers/functions/RPC:** funciones como `hide_spot`, triggers de `user_id`, sync de perfiles o helpers usados por la app.
6. **Tipos generados:** archivo actual de tipos Supabase si existe (`database.types.ts`, `supabase.types.ts` o equivalente).
7. **Muestra anónima de datos:** 5-10 filas por tabla crítica, sin emails ni datos personales, para ver si hay URLs completas, paths, `bbox` viejos, nulos y variantes reales.
8. **Ambiente objetivo:** confirmar si se diseñará contra local, staging o producción, y si el esquema remoto tiene migraciones aplicadas fuera del repo.

No necesito llaves privadas en el documento. Para introspección basta salida SQL pegada/exportada, tipos generados o acceso controlado al dashboard/SQL Editor si tú decides compartirlo.

---

## 6. Decisiones tomadas

Estas decisiones son de auditoría, no cambios de producto aplicados:

1. No implementar runtime en este paso.
2. Tratar como P0 todo salto de país/cámara incorrecta y cualquier retorno desde edit que deje pins ausentes.
3. Mantener Supabase Storage para V1; no introducir proveedor nuevo antes de estabilizar contratos.
4. No exponer privacidad por foto hasta crear media canónica por imagen.
5. No abrir Fluir ni Recordar; todo plan queda dentro de Explore map-first.
6. No asumir que `DATA_MODEL_CURRENT.md` es completo; usar migraciones como evidencia y pedir introspección.

---

## 7. Decisiones abiertas

1. ¿El nuevo canon de media se llamará `spot_media`, `spot_user_media` o migrará `spot_images` in-place?
2. ¿Se migrará `spots.cover_image_url` a `cover_image_path` o se mantendrá como cache derivada temporal?
3. ¿Se permite que spots públicos de otros usuarios aparezcan en Explore con acciones limitadas, o V1 debe filtrar a owner para listados personales?
4. ¿Mapbox categories/Maki se guardan solo como snapshot del lugar o evolucionan a categorías propias de producto?
5. ¿El botón de búsqueda arriba derecha reemplaza o convive con el launcher inferior/chrome?
6. ¿La lectura EXIF GPS se implementa con Expo MediaLibrary/ImagePicker o requiere módulo nativo propio?
7. ¿Los datos de país/región serán contenido editorial propio, proveedor externo, o híbrido?
8. ¿El contexto territorial tendrá revisión editorial/manual antes de publicarse, o se permitirá importar lotes automáticamente con estado `draft`?
9. ¿Qué nivel de precisión se necesita en V1: país completo, región/estado, ciudad, o solo país + ciudades principales?

---

## 8. Plan por fases

### Fase 0 — Instrumentación y reproducción controlada

- Añadir logs dev-only o métricas internas para cada intención de cámara: `source`, spot id, coords, bbox, feature type, método (`flyTo|fitBounds`), filtro activo.
- Registrar handoff edit→explore: params, selectedSpot id, resultado de `mergeSpotFromDbById`, resultado de `refetchSpots`, conteo de `displayedSpots`.
- Crear fixture/manual QA para “Gran Parque La Plancha” y spots con bbox no contenedor.
- DoD: poder decir qué operación movió cámara y por qué.

### Fase 1 — Corrección P0 de cámara y handoff

- **Avance aplicado 2026-04-26 (bitácora `380`):** se creó helper puro `sanitizeCameraBBoxForPoint()` y se conectó a cámara, creación desde POI y Edit Spot web. También se añadió `resolveCameraFramingForPointName()` para intentar reparar bbox por título + proximidad al crear o re-guardar desde Edit Spot. La regla V1 queda: `mapbox_bbox` solo controla cámara o se persiste si contiene el punto real (`latitude/longitude`).
- **Backfill preparado 2026-04-26 (bitácora `383`):** `034_spots_invalid_mapbox_bbox_cleanup.sql` queda listo, pero no aplicado remoto. Limpia solo metadata derivada (`mapbox_bbox`, `mapbox_feature_type`) de filas cuyo bbox es inválido/no contiene el punto, y antes guarda respaldo en `spots_mapbox_bbox_cleanup_034_backup` con RLS habilitado.
- Crear helper puro `sanitizeSpotCameraFraming(spot)` o continuar usando `sanitizeCameraBBoxForPoint()`:
  - valida bbox finito;
  - verifica que bbox contiene el punto;
  - evita span máximo global en V1 para no romper países/regiones válidos que contienen el punto;
  - si falla, ignora bbox y usa `flyTo` al punto.
- Para parque/atracción/área POI sin bbox confiable:
  - intentar recuperar bbox por título + proximidad;
  - si Mapbox no devuelve geometría confiable, usar fallback runtime de zoom contextual;
  - no persistir bbox sintético como si fuera Mapbox.
- En Edit Spot web:
  - si cambia `latitude/longitude`, limpiar `mapbox_bbox` y `mapbox_feature_type` antes de reconstruir metadata.
  - si hay selectedPlace, persistir bbox solo si pasa validación.
  - si se presiona Guardar sin cambiar ubicación y el bbox actual falta/no contiene el punto, intentar reparación por título + proximidad; si falla, limpiar bbox.
- En Explore:
  - durante deep link `spotId/sheet`, evitar que un refetch reciente vacíe `spots` si auth aún no está estable.
  - unificar `applySpot` y `mergeSpotFromDbById` con la misma normalización.
- Corregido 2026-04-26: cambio de filtro con SpotSheet/POI activo ya no reemplaza la consulta por CountriesSheet; queda como QA de dominancia de selección.
- DoD: editar coordenadas, guardar, volver, pins visibles y cámara al spot correcto.

### Fase 2 — Media V1 estable sin migración destructiva

- Crear helper `getPublicSpotImageUrl(input)` que acepte URL legacy o path.
- Crear helper `getSpotPersonalImageSignedUrl(path)` con cache/renovación controlada.
- Invalidar caché de `spot_images` después de `syncCoverFromGallery`, `addSpotImageRow`, `removeSpotImage`, `reorderSpotImages`.
- Corregido 2026-04-26: `handlePoiAddPhotos` abre picker web dentro del gesto, conserva archivos preseleccionados si aparece modal de duplicado y no espera consentimiento/duplicate check antes de lanzar el `input`.
- Corregido 2026-04-26: upload público desde quick add refresca `heroOverrideUris` y metadatos locales de búsqueda después de `syncCoverFromGallery`, sin esperar remount.
- Corregido 2026-04-26: `SpotSheet` ya no reemplaza portada pública por CTA en Visitados; usa portada/galería pública como fallback y muestra CTA complementario para subir fotos.
- Añadido 2026-04-26: barra de progreso mínima por archivos procesados sobre el hero/galería durante uploads desde spot existente.
- Pendiente: cola de subida con límite/concurrencia real y progreso byte-level solo si el uploader lo soporta.
- DoD: subir fotos desde sheet/POI actualiza hero/listado sin reload; cancelar picker no deja busy; 12 fotos no bloquean navegación.

### Fase 3 — Canon UI listados y selección

- Extraer presenter común:
  - `buildExploreSpotListRowModel(spot, context)`
  - quick actions compartidas
  - selection state compartido
  - tag chips compartidos
  - distance/subtitle compartidos
- CountriesSheet y SearchSurface consumen el mismo row model.
- Reemplazar `Cancelar` texto por control claro con `X` en modo selección.
- Mostrar `Seleccionar todo`.
- Integrar selección en búsqueda + filtros + CountriesSheet con el mismo store efímero.
- Mostrar `Filtrar` también en `Todos` si el producto decide que país/etiquetas pueden preparar la exploración general; si etiquetas siguen limitadas a `saved/visited`, el CTA en `Todos` debe abrir filtros de país y explicar que etiquetas aplican a listas personales.
- Empty states:
  - si `Por visitar` o `Visitados` no tienen spots, mostrar toast contextual no bloqueante y empty state accionable;
  - si no hay etiquetas, mostrar CTA para crear/editar etiqueta desde el flujo de asignación o perfil `Etiquetas`.
- DoD: mismo spot se ve y actúa igual en mobile, desktop sidebar, buscador y filtros.

### Fase 4 — Acciones masivas V1

- V1:
  - marcar visitado;
  - desmarcar visitado;
  - marcar por visitar;
  - desmarcar por visitar;
  - agregar etiqueta;
  - quitar etiqueta;
  - ocultar con soft delete;
  - compartir selección como enlaces o resumen básico si producto lo confirma.
- Futuro:
  - crear ruta/Flow-lite;
  - orden manual;
  - export/share avanzado.
- DoD: operaciones idempotentes, toast por resultado, rollback parcial documentado, nunca hard delete.

### Fase 5 — Modelo DB/media escalable

- Ejecutar introspección real de Supabase y actualizar `DATA_MODEL_CURRENT.md`.
- Proponer migraciones:
  - en `spots`, solo campos de snapshot y acceso caliente: `coordinate_source`, `created_from`, `mapbox_place_id`, `mapbox_feature_type`, `mapbox_bbox` saneado, `country_code`, `region_code`, `city_name`, `place_snapshot` limitado si se aprueba.
  - `spot_media` o `spot_user_media` con `storage_bucket`, `storage_path`, `visibility`, `sort_order`, `width`, `height`, `blurhash`, `created_by`.
  - índices en `spots(user_id)`, `spots(is_hidden)`, `spots(latitude, longitude)` o PostGIS si se habilita.
- Regla de escalabilidad:
  - `spots` no debe guardar visa, transporte, salud, dinero, clima, emergencias ni textos largos territoriales.
  - esos datos deben vivir en tablas de contexto geográfico versionadas y consultarse por `country_code`, `region_code` o `city_id`.
- DoD: contrato DB actualizado, migración reversible/no destructiva, RLS revisada.

### Fase 6 — Contexto territorial batch-first

- Crear modelo territorial separado:
  - `geo_countries` (`iso2`, `iso3`, nombre, centroide, bbox, moneda principal, lado de conducción, status editorial).
  - `geo_regions` (`country_code`, código región, nombre, bbox/centroide, timezone opcional).
  - `geo_cities` (`country_code`, `region_code`, nombre, centroide, población/ranking opcional, aliases).
  - `geo_context_versions` para versionar lotes, fuente, fecha, estado (`draft|reviewed|published|archived`).
  - módulos por dominio: `geo_visa_rules`, `geo_transport_options`, `geo_health_advisories`, `geo_money_context`, `geo_climate_normals`, `geo_emergency_contacts`.
- Poblar por procesos por lotes:
  - importar países/regiones/ciudades base desde dataset confiable y auditable.
  - enriquecer visa/transporte/salud/dinero/clima/emergencias en jobs separados por dominio.
  - publicar solo snapshots revisados; la app consume la última versión `published`.
- Datos duros recomendados V1:
  - **País:** moneda/divisa, lado de conducción, teléfonos de emergencia, resumen de transporte, visa por nacionalidad objetivo si se define, vacunas/enfermedades relevantes, clima estacional general.
  - **Región/estado:** clima más específico, transporte interurbano, riesgos sanitarios regionales, emergencias regionales si existen.
  - **Ciudad:** aeropuertos, movilidad local (`uber`, `indrive`, taxi, transporte público), zonas/avisos breves, clima urbano si agrega valor.
- Datos dinámicos o sensibles:
  - clima actual, alertas de seguridad, requisitos de visa vigentes y salud deben tener `source`, `last_verified_at`, `valid_from`, `valid_to` y disclaimer editorial.
  - no mostrarlos como verdad absoluta si no hay frescura verificable.
- UI:
  - mostrar módulos como cards progresivas en sheet de país/ciudad o detalle contextual, no como overlay permanente sobre el mapa.
  - priorizar 3-5 datos útiles por contexto; el resto a detalle expandible.
- DoD: datos territoriales consultables sin inflar `spots`, import reproducible, versionado visible en DB y UI preparada para datos faltantes.

### Fase 7 — Nativo/futuro fotos

- Expo first:
  - investigar `expo-image-picker` / `expo-media-library` para permisos y metadata disponible.
  - confirmar si EXIF GPS está disponible de forma consistente en iOS/Android.
- Nativo si Expo no basta:
  - módulo mínimo para leer EXIF GPS localmente, sin subir metadata sin consentimiento.
- DoD: permisos claros, privacidad explícita, UI no sobrecargada.

---

## 9. Micro-scopes

### MS-1 P0 cámara / bbox

- Archivos: `lib/places/cameraBBox.ts`, `lib/places/areaFraming.ts`, `components/explorar/MapScreenVNext.tsx`, `app/spot/edit/[id].web.tsx`, `tests/camera-bbox.test.mjs`.
- Entrega aplicada: sanitizador + resolvedor por título/proximidad + fallback contextual para parques/atracciones + tests unitarios + protección de escritura/lectura + migración de backfill no destructivo preparada. Pendiente: QA manual La Plancha/Mérida y decisión explícita para aplicar o descartar `034` en remoto.
- No tocar: diseño visual de sheets.

### MS-2 P0 handoff Edit → Explore

- Archivos: `MapScreenVNext`, `lib/explore-deeplink.ts`, edit web/native.
- Entrega: protocolo único de retorno y reconciliación.
- No tocar: rutas de detalle público `/spot/[id]`.

### MS-3 Picker y media refresh

- Archivos: `MapScreenVNext`, `lib/spot-images.ts`, hooks de galería.
- Entrega aplicada parcial: picker POI web dentro del gesto; refresh inmediato de galería pública en hero/listado/search local tras quick add; compatibilidad con modal de duplicado sin perder los archivos ya elegidos.
- Pendiente: QA manual web móvil, cola/limite de concurrencia para muchas fotos, paridad nativa de galería múltiple y canon path-first.
- No tocar: privacidad por foto.

### MS-4 Presenter de listados

- Archivos: crear `lib/explore/build-spot-list-row-model.ts`, adaptar Search/Countries.
- Entrega: mismo modelo para cards y acciones.
- No tocar: layout macro desktop.

### MS-4B Search intent recovery canon

Plan: [`PLAN_SEARCH_INTENT_RECOVERY_V1_2026-04-26.md`](plans/PLAN_SEARCH_INTENT_RECOVERY_V1_2026-04-26.md).

- Archivos: `components/search/SearchSurface.tsx`, `components/explorar/MapScreenVNext.tsx`, helpers de búsqueda local si existen.
- Entrega: canon de ranking local que recupere spots propios por token parcial, case-insensitive, accent-insensitive y typo leve. Caso semilla: “Gran Parque La Pancha” recuperable por `Plancha`/`plancha`; typo cercano `placha` no debe priorizar resultados externos si existe candidato local plausible.
- Reglas V1:
  - normalizar acentos, espacios y case;
  - ponderar tokens internos del título, no solo prefijo/frase completa;
  - permitir fuzzy leve para términos suficientemente largos;
  - priorizar spots propios/locales plausibles sobre resultados Mapbox externos cuando el score local supere umbral;
  - no ocultar resultados externos útiles si no hay candidato local plausible.
- Hipótesis verificable: el buscador local usa coincidencia por frase/prefijo o scoring insuficiente para tokens internos; el fallback Mapbox externo ocupa los slots antes que candidatos locales parciales.
- No tocar: rediseño SearchV2 completo, costos/API, filtros visuales macro.

### MS-5 Bulk actions V1

- Archivos: `ExploreBulkTagSelectionBar` o nuevo `ExploreBulkSelectionBar`, `MapScreenVNext`, `lib/pins.ts`, `lib/tags.ts`.
- Entrega: estado selección + acciones masivas seguras.
- No tocar: Flow-lite/rutas.

### MS-6 DB introspection

- Archivos: `docs/contracts/DATA_MODEL_CURRENT.md`, migraciones nuevas solo si se aprueban.
- Entrega: contrato actualizado con evidencia de Supabase real, inventario de Storage/RLS y decisión explícita de qué campos entran en `spots`.

### MS-6B Backfill bbox incoherente

- Archivos: `supabase/migrations/034_spots_invalid_mapbox_bbox_cleanup.sql`, `docs/contracts/MAP_FRAMING_UX.md`.
- Entrega preparada: migración con backup RLS y limpieza de metadata derivada incoherente.
- No aplicado remoto todavía.
- DoD al aplicar: conteo previo/posterior de bbox inválidos = 0, backup contiene las filas tocadas, app sigue usando punto/fallback para spots sin bbox.
- No tocar: RLS sin checklist.

### MS-7 Geo context batch

- Archivos: nuevo contrato `docs/contracts/GEO_CONTEXT_CANON.md`, migraciones solo tras MS-6.
- Entrega: modelo país/región/ciudad + módulos visa/transporte/salud/dinero/clima/emergencias + estrategia de import por lotes.
- No tocar: `spots` como contenedor de textos territoriales.

---

## 10. DoD

- No hay salto de país tras editar/cerrar sheet.
- `Encuadrar spot` usa bbox solo si es coherente con el punto.
- Volver desde edit muestra pins y selección sin reload manual.
- Subida pública/privada actualiza hero/lista inmediatamente.
- Cancelar image picker no deja loader ni bloquea acciones.
- Listados mobile/desktop/search/filtros comparten row model.
- Selección múltiple tiene entrada, X/cancel, seleccionar todo y limpieza al cambiar pool.
- Filtros `Por visitar`/`Visitados` con cero resultados muestran toast/empty state sin abrir sheet confuso.
- `Todos` muestra entrada clara a Filtrar si producto decide que filtros de país/tags aplican o explica por qué no.
- Ningún cambio rompe RLS, soft delete ni lectura pública decidida.
- `spots` solo recibe campos de identidad geográfica/snapshot mínimo; contexto territorial vive en tablas versionadas.
- La primera carga batch de país/región/ciudad es reproducible, auditable y puede publicarse por versiones.

---

## 11. Pruebas

### Unitarias

- `sanitizeSpotCameraFraming()`:
  - bbox contiene punto;
  - bbox lejos del punto;
  - bbox enorme;
  - bbox invertido;
  - sin bbox.
- `buildExploreSpotListRowModel()`:
  - visited vs saved;
  - con/sin imagen;
  - selection mode;
  - tags;
  - owner/no owner.
- media helpers:
  - URL legacy;
  - path público;
  - path privado signed;
  - cache invalidation.
- geo context:
  - normalización `country_code`/`region_code`/`city_id`;
  - lectura de versión `published`;
  - fallback ciudad faltante → región/país;
  - módulos territoriales fuera de `spots`.

### Integración / E2E manual

- Editar título solamente y volver a Explore.
- Editar ubicación a otra ciudad y volver.
- Editar ubicación de spot con bbox previo y confirmar que no salta.
- Buscar “Gran Parque La Plancha”, guardar, reencuadrar dos veces.
- Seleccionar POI no guardado, “Guardar y subir mis fotos”, cancelar picker.
- Subir 1, 3 y 12 fotos públicas; verificar hero/lista/search.
- En Visitados sin fotos personales, verificar que aparece portada/galería pública y CTA complementario “Subir fotos”.
- Subir fotos privadas en Visitados; verificar que las fotos personales priorizan el hero para el usuario autenticado y que la portada pública sigue siendo fallback si no hay personales.
- Abrir spot desde `Todos`, cambiar a `Por visitar`/`Visitados` y verificar que no se reemplaza por CountriesSheet hasta cerrar la consulta.
- Refrescar navegador en `Visitados`/`Por visitar`; verificar CountriesSheet, no banda inferior FLOWYA/Search/KPI.
- En `Por visitar`, buscar y abrir un spot `Visitado`; verificar pin seleccionado visible en mapa sin auto-switch de filtro.
- Abrir `Lugares` general y detalle de país desde CountriesSheet; verificar `Filtrar` arriba derecha, sin buscador inline en el cuerpo, chips activos bajo header si aplican, y en país sin chip país duplicado.
- Tocar país en CountriesSheet; verificar `{país}` visible en `medium`, `Filtrar` arriba derecha, sin buscador inline, sin chip país duplicado y sin ocultar pins de otros países en el mapa principal. El resaltado visual de país queda diferido fuera de V1.
- Verificar semántica navegación vs filtro: país tocado desde ranking/listado no muestra chip país en mapa ni persiste; país elegido desde `Filtrar` sí muestra chip y persiste.
- Tocar país en el mini-mapa del contador: el sheet debe plegarse a `peek`; luego país→lugares debe colapsar al primer gesto real de mapa.
- Verificar canon header: menor aire superior borde→handle y separación táctil suficiente entre header y fila `LUGARES EN EL MAPA` / `Seleccionar`.
- Cambiar filtro con CountriesSheet abierto, abrir spot, cerrar spot, restaurar sheet.
- Activar selección en CountriesSheet y Search; seleccionar todo; asignar etiqueta; cancelar con X.
- Cargar lote territorial `draft`, revisar, publicar versión y verificar consumo por país/ciudad sin tocar filas de `spots`.

### Regresión visual

- Web mobile, tablet, desktop sidebar ≥1080.
- Nativo iOS/Android para edit básico, picker y retorno.
- Tema claro/oscuro.

---

## 12. Archivos afectados

### Diagnóstico actual

- `components/explorar/MapScreenVNext.tsx`
- `hooks/useMapCore.ts`
- `lib/places/areaFraming.ts`
- `lib/explore/map-screen-orchestration.ts`
- `lib/explore/fetch-visible-spots-with-pins.ts`
- `lib/explore/spots-map-select.ts`
- `app/spot/edit/[id].web.tsx`
- `app/spot/edit/[id].tsx`
- `lib/spot-images.ts`
- `lib/spot-image-upload.ts`
- `lib/spot-personal-images.ts`
- `lib/spot-personal-image-upload.ts`
- `hooks/useSpotGalleryUris.ts`
- `hooks/useSpotPersonalGalleryUris.ts`
- `components/search/SearchSurface.tsx`
- `components/explorar/CountriesSheet.tsx`
- `components/design-system/search-result-card.tsx`
- `components/explorar/explore-bulk-tag-selection-bar.tsx`
- `supabase/migrations/001_create_spots_and_pins.sql`
- `supabase/migrations/011_pins_saved_visited.sql`
- `supabase/migrations/012_spots_set_user_id_on_insert.sql`
- `supabase/migrations/018_spots_owner_write_guardrails.sql`
- `supabase/migrations/019_spots_mapbox_camera_framing.sql`
- `supabase/migrations/020_user_tags_pin_tags.sql`
- `supabase/migrations/024_spot_images.sql`
- `supabase/migrations/025_storage_spot_gallery_owner.sql`
- `supabase/migrations/026_profiles_private_owner_rls.sql`
- `supabase/migrations/027_profile_avatar_storage.sql`
- `supabase/migrations/030_profiles_photo_sharing_pref.sql`
- `supabase/migrations/031_spot_personal_images_private.sql`
- `supabase/migrations/032_storage_spot_personal_private.sql`

### Probables implementación futura

- nuevo `lib/places/spotCameraFraming.ts`
- nuevo `lib/explore/spot-list-row-model.ts`
- nuevo contrato `docs/contracts/SPOT_MEDIA_CANON.md`
- nuevo contrato `docs/contracts/GEO_CONTEXT_CANON.md`
- actualización `docs/contracts/DATA_MODEL_CURRENT.md`
- migraciones nuevas de media/geografía solo tras introspección.

---

## 13. Qué NO tocar

- No abrir Fluir ni Recordar.
- No hard delete de spots.
- No relajar RLS.
- No eliminar lectura pública decidida sin ADR.
- No migrar media destructivamente.
- No cambiar proveedor de Storage antes de estabilizar V1.
- No duplicar componentes por breakpoint.
- No resolver privacidad por foto con parche sobre `spot_images` + `spot_personal_images`.
- No cambiar diseño macro map-first.
- No añadir datos país/región en `spots` como campos sueltos sin modelo.
- No asumir que Supabase remoto coincide con migraciones locales hasta introspección.

---

## Recomendación ejecutiva

Orden recomendado:

1. **P0 cámara/handoff:** bbox coherente, retorno edit→Explore, pins visibles.
2. **P0 media picker/refresh:** POI fotos sin bloqueo, invalidación de galería, feedback inmediato.
3. **Canon listados/selección:** presenter común y selection mode general.
4. **Bulk V1:** estados, etiquetas y soft delete.
5. **DB/media canon:** introspección + migración path-first.
6. **Geo context batch:** país/región/ciudad + visa/transporte/salud/dinero/clima/emergencias fuera de `spots`.
7. **Futuro nativo fotos:** EXIF GPS, crear desde galería, permisos y privacidad.

La mejora más segura es empezar por invariants de cámara y handoff, porque esos bugs erosionan la confianza principal del producto: mapa como verdad estable.
