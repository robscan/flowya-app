# EXPLORE_SHEETS_BEHAVIOR_MATRIX — Matriz de comportamiento (sheets/overlays)

**Última actualización:** 2026-04-26
**Status:** ACTIVE (documentación operativa)
**Source of truth:** `lib/explore-map-chrome-layout.ts` + orquestación en `components/explorar/MapScreenVNext.tsx`

Relacionado: [EXPLORE_CHROME_SHELL.md](EXPLORE_CHROME_SHELL.md), [EXPLORE_SHEET.md](EXPLORE_SHEET.md), [explore/FILTER_RUNTIME_RULES.md](explore/FILTER_RUNTIME_RULES.md), [explore/SEARCH_RUNTIME_RULES.md](explore/SEARCH_RUNTIME_RULES.md)

## 1) Superficies (qué “existe” en runtime)

- **WelcomeSheet**: `ExploreWelcomeSheet` (solo cuando `pinFilter === "all"` y no hay otras superficies bloqueando).
- **CountriesSheet**: `CountriesSheet` (cuando `pinFilter ∈ {"saved","visited"}` y `countriesSheetOpen === true`).
- **SpotSheet/POI**: `SpotSheet` (cuando hay `selectedSpot` o `poiTapped`).
- **Search**: `SearchFloating` (web: `SearchOverlayWeb`, nativo: `SearchFloatingNative`), controlado por `searchV2Open`.
- **CreateSpotNameOverlay**: `CreateSpotNameOverlay`, controlado por `createSpotNameOverlayOpen`.
- **AccountDesktopPanel**: `AccountExploreDesktopPanel` (web ≥1080, `?account=profile|details|privacy|tags|language`).
- **DesktopSidebar (web ≥1080)**: modo layout donde Account/Welcome/Countries/Spot se anclan en columna izquierda.

> Nota: Este documento describe **qué se muestra** y **cuándo**. El “snap” (`peek|medium|expanded`) está documentado en [EXPLORE_CHROME_SHELL.md](EXPLORE_CHROME_SHELL.md) §5–7.

## 2) Variables de entrada (estado que decide la matriz)

La elegibilidad principal vive en `computeExploreMapChromeLayout`:

- `pinFilter`: `"all" | "saved" | "visited"`
- `searchV2Open`: boolean
- `countriesSheetOpen`: boolean
- `selectedSpot`: object | null
- `poiTapped`: object | null
- `createSpotNameOverlayOpen`: boolean
- `accountDesktopExploreOpen`: boolean
- `isGlobeEntryMotionSettled`: boolean
- `windowWidth`: para determinar `webExploreUsesDesktopSidebar(windowWidth)`

## 3) Matriz: superficie visible (alto nivel)

### 3.1 Reglas de bloqueo (prioridad)

Estas reglas evitan apilar superficies incompatibles:

- **Overlay bloqueante**: si `createSpotNameOverlayOpen === true` o `searchV2Open === true` ⇒ `isShellBlockedByOverlay === true`.
  - Consecuencia: el “chrome” de Explore se considera bloqueado; no se debe mostrar WelcomeSheet debajo si eso genera conflicto visual/gestual.
- **Cuenta embebida desktop**: si `accountDesktopExploreOpen === true` en web sidebar ≥1080, la columna lateral prioriza `AccountExploreDesktopPanel` sobre Welcome/Countries/Spot hasta limpiar `?account=`.
- **Selección Spot/POI**: si `selectedSpot != null` o `poiTapped != null` ⇒ `isSpotSheetVisible === true`.
  - En presencia de Search abierto, SpotSheet no se monta (ver [EXPLORE_SHEET.md](EXPLORE_SHEET.md) §1.1–1.2).
  - WelcomeSheet y CountriesSheet no deben reemplazar una consulta activa. Si un cambio de filtro hace elegible CountriesSheet, se difiere hasta cerrar la selección.

### 3.2 Determinación de Welcome (solo `pinFilter="all"`)

`showExploreWelcomeSheet` es true si y solo si:

- `pinFilter === "all"`
- `isGlobeEntryMotionSettled === true`
- `createSpotNameOverlayOpen === false`
- `searchV2Open === false`
- `countriesSheetOpen === false`
- `selectedSpot == null`
- `poiTapped == null`

Fuente: `lib/explore-map-chrome-layout.ts` (`showExploreWelcomeSheet`).

### 3.3 Determinación de CountriesSheet (solo `pinFilter ∈ {saved,visited}`)

`CountriesSheet` es visible si:

- `countriesSheetOpen === true` (estado runtime del host)
- típicamente `pinFilter === "saved" | "visited"` (KPI mode)
- `selectedSpot == null`
- `poiTapped == null`

La **auto-apertura** al entrar desde `all → saved/visited` con `count > 0`, la apertura tras recarga/hidratación con filtro KPI persistido y la persistencia por filtro (`countriesSheetPersistRef`) se orquestan en `MapScreenVNext`. Referencia: [explore/FILTER_RUNTIME_RULES.md](explore/FILTER_RUNTIME_RULES.md) §1b–1c.

### 3.4 Filtro de país del dataset (`explorePlacesCountryFilter`)

- Desde 2026-04-20, el alcance de país para `Lugares` ya no reutiliza `CountriesSheetListDetail`.
- Contrato de datos:
  - `{ kind: "all_places" }`
  - `{ kind: "country_subset", countries: Array<{ key, label }> }`
- `countriesSheetListView` sigue resolviendo solo la ruta del sheet (`null` / `all_places` / `country`), mientras `explorePlacesCountryFilter` gobierna:
  - dataset del mapa;
  - chips activos;
  - persistencia local;
  - modal de filtros.
- Tap en bucket de país del KPI puede forzar un subconjunto de un solo país, pero el modal de filtros puede volver a `Todos` o a un subset de varios países sin reescribir la navegación del sheet como si fuera una sola fuente de verdad.

## 4) Matriz: carga inicial (web vs nativo)

### 4.1 `pinFilter` inicial (persistencia)

- **Web**: `pinFilter` puede leerse **sincrónicamente** desde storage; por lo tanto, el primer paint puede arrancar ya en `saved/visited`.
- **Nativo**: `pinFilter` arranca como `"all"` hasta hidratar `AsyncStorage`; luego puede transicionar a `saved/visited`.

Fuente: [explore/FILTER_RUNTIME_RULES.md](explore/FILTER_RUNTIME_RULES.md) §4.

### 4.2 Escenarios canónicos de arranque

#### A) Web arranca en `pinFilter="all"`

- **Si no hay overlays** y `isGlobeEntryMotionSettled === true` ⇒ WelcomeSheet visible.
- Si hay spot/poi seleccionado (deep link / restore) ⇒ SpotSheet visible y Welcome no aplica.
- Si Search se abre inmediatamente (por acción o restore) ⇒ overlay Search visible; Welcome no aplica.

#### B) Web arranca en `pinFilter="saved"|"visited"`

- Con count > 0, CountriesSheet debe aparecer como superficie base del filtro una vez hidratados filtro/cámara/datos mínimos.
- La banda inferior KPI/FLOWYA/Search no debe mostrarse como fallback de arranque.
- Si hay spot/poi seleccionado, Search, Account o Create overlay, CountriesSheet se difiere.

#### C) Nativo arranca en `"all"` y luego hidrata a `"saved"|"visited"`

- Primer render puede ser elegible para Welcome (si `isGlobeEntryMotionSettled` y no overlays).
- Tras hidratación, el runtime puede abrir CountriesSheet según reglas (auto-open si `count > 0` al entrar al filtro, persistencia del sheet por filtro, etc.).

## 5) Matriz compacta (resultado esperado)

| Estado base | Resultado (superficie dominante) |
|------------|-----------------------------------|
| `searchV2Open=true` | Search (overlay/sheet) domina; no se muestra Welcome debajo; SpotSheet no se monta |
| `createSpotNameOverlayOpen=true` | CreateSpotNameOverlay domina (bloquea shell) |
| `accountDesktopExploreOpen=true` en web ≥1080 | AccountDesktopPanel domina la columna lateral |
| `selectedSpot!=null` o `poiTapped!=null` y `searchV2Open=false` | SpotSheet/POI domina |
| `pinFilter=all` + sin bloqueos + `isGlobeEntryMotionSettled=true` | WelcomeSheet |
| `pinFilter=saved|visited` + count > 0 + sin selección activa | CountriesSheet |

## 6) Notas de QA (rápidas)

- Verificar en **web** que, al cancelar Search o cerrar Spot, se restaure CountriesSheet si estaba abierto antes y el contexto sigue siendo `saved/visited` (ver [FILTER_RUNTIME_RULES.md](explore/FILTER_RUNTIME_RULES.md) §1c).
- Verificar que, con SpotSheet abierto desde `Todos`, cambiar a `Por visitar` o `Visitados` no reemplace el spot por CountriesSheet; al cerrar el spot puede aparecer CountriesSheet si el filtro activo tiene datos.
- Verificar que un refresh del navegador en `Por visitar`/`Visitados` no muestra banda inferior KPI/FLOWYA/Search; debe abrir CountriesSheet.
- Verificar búsqueda cross-filter: en `Por visitar`, abrir un spot `Visitado` desde búsqueda debe mostrar su pin seleccionado en mapa sin cambiar automáticamente el filtro.
- Verificar país → lugares: tocar país mantiene sheet en `medium` con lista visible mientras el mapa vuela al país.
- En detalle de país y en `Lugares` general, la cabecera debe ser mínima y orientada a exploración: `Filtrar` vive arriba derecha en el header, no como toolbar del cuerpo; no hay buscador inline porque el buscador full-screen es la superficie para búsqueda deliberada. En detalle de país, el país es el título y no se duplica como chip. Seleccionar país desde contador/listado es foco contextual: el sheet lista ese país y el mapa vuela a sus lugares, pero no oculta pins por país ni deja filtros invisibles. El fitBounds país→lugares puede reservar padding inferior **moderado y acotado** para que el área/pins se aprecien por encima del sheet sin abrir demasiado el globo ni exponer horizonte/espacio exterior. El resaltado visual de país queda diferido fuera de V1.
- Semántica país: seleccionar país desde ranking/listado es navegación contextual de sheet + foco visual en mapa, no filtro explícito. Tocar país desde el mini-mapa es navegación de mapa. Ninguno debe mostrarse como chip activo ni persistirse como filtro; seleccionar país dentro de `Filtrar` sí crea filtro explícito.
- El mini-mapa de CountriesSheet es navegación de mapa: al tocar un país, fuera de desktop sidebar, CountriesSheet debe plegarse a `peek`.
- Después de país → lugares, el primer gesto real sobre el mapa debe colapsar el sheet a `peek`; el guard contra eventos programáticos debe ser corto y no bloquear la intención del usuario.
- Header canon: el área superior debe compactar borde→handle y reservar separación táctil suficiente entre header y primera cabecera de sección (`Seleccionar`).
- Verificar en **nativo** que la hidratación de `pinFilter` no sobrescribe preferencia con `"all"` (guardrail de storage-ready).
- Excepción UX (2026-04-21): al seleccionar un país desde el KPI/listado de países, `CountriesSheet` **mantiene** `state="medium"` (no auto-`expanded`) para que el usuario perciba cambio de mapa y actualización del listado.
- Paridad UX (2026-04-20): en **Por visitar / Visitados** (owner), el CTA terciario de entrada a selección masiva de etiquetas vive en la **misma fila** que el título de la **primera** sección con ítems, tanto en `CountriesSheet` como en `SearchSurface` (`placesListFirstSectionHeaderRight`); tipografía/layout canónicos en `components/explorar/explore-places-list-section-title-row.tsx`.
