# EXPLORE_SHEETS_BEHAVIOR_MATRIX — Matriz de comportamiento (sheets/overlays)

**Última actualización:** 2026-04-14  
**Status:** ACTIVE (documentación operativa)  
**Source of truth:** `lib/explore-map-chrome-layout.ts` + orquestación en `components/explorar/MapScreenVNext.tsx`

Relacionado: [EXPLORE_CHROME_SHELL.md](EXPLORE_CHROME_SHELL.md), [EXPLORE_SHEET.md](EXPLORE_SHEET.md), [explore/FILTER_RUNTIME_RULES.md](explore/FILTER_RUNTIME_RULES.md), [explore/SEARCH_RUNTIME_RULES.md](explore/SEARCH_RUNTIME_RULES.md)

## 1) Superficies (qué “existe” en runtime)

- **WelcomeSheet**: `ExploreWelcomeSheet` (solo cuando `pinFilter === "all"` y no hay otras superficies bloqueando).
- **CountriesSheet**: `CountriesSheet` (cuando `pinFilter ∈ {"saved","visited"}` y `countriesSheetOpen === true`).
- **SpotSheet/POI**: `SpotSheet` (cuando hay `selectedSpot` o `poiTapped`).
- **Search**: `SearchFloating` (web: `SearchOverlayWeb`, nativo: `SearchFloatingNative`), controlado por `searchV2Open`.
- **CreateSpotNameOverlay**: `CreateSpotNameOverlay`, controlado por `createSpotNameOverlayOpen`.
- **DesktopSidebar (web ≥1080)**: modo layout donde Welcome/Countries/Spot se anclan en columna izquierda.

> Nota: Este documento describe **qué se muestra** y **cuándo**. El “snap” (`peek|medium|expanded`) está documentado en [EXPLORE_CHROME_SHELL.md](EXPLORE_CHROME_SHELL.md) §5–7.

## 2) Variables de entrada (estado que decide la matriz)

La elegibilidad principal vive en `computeExploreMapChromeLayout`:

- `pinFilter`: `"all" | "saved" | "visited"`
- `searchV2Open`: boolean
- `countriesSheetOpen`: boolean
- `selectedSpot`: object | null
- `poiTapped`: object | null
- `createSpotNameOverlayOpen`: boolean
- `isGlobeEntryMotionSettled`: boolean
- `welcomeSidebarDismissed`: boolean (solo web sidebar ≥1080)
- `windowWidth`: para determinar `webExploreUsesDesktopSidebar(windowWidth)`

## 3) Matriz: superficie visible (alto nivel)

### 3.1 Reglas de bloqueo (prioridad)

Estas reglas evitan apilar superficies incompatibles:

- **Overlay bloqueante**: si `createSpotNameOverlayOpen === true` o `searchV2Open === true` ⇒ `isShellBlockedByOverlay === true`.
  - Consecuencia: el “chrome” de Explore se considera bloqueado; no se debe mostrar WelcomeSheet debajo si eso genera conflicto visual/gestual.
- **Selección Spot/POI**: si `selectedSpot != null` o `poiTapped != null` ⇒ `isSpotSheetVisible === true`.
  - En presencia de Search abierto, SpotSheet no se monta (ver [EXPLORE_SHEET.md](EXPLORE_SHEET.md) §1.1–1.2).

### 3.2 Determinación de Welcome (solo `pinFilter="all"`)

`showExploreWelcomeSheet` es true si y solo si:

- `pinFilter === "all"`
- `isGlobeEntryMotionSettled === true`
- `createSpotNameOverlayOpen === false`
- `searchV2Open === false`
- `countriesSheetOpen === false`
- `selectedSpot == null`
- `poiTapped == null`
- y además **no** está cerrado persistentemente en web sidebar:
  - si `welcomeSidebarDismissed === true` y `Platform.OS === "web"` y `webExploreUsesDesktopSidebar(windowWidth)` ⇒ **no** mostrar.

Fuente: `lib/explore-map-chrome-layout.ts` (`showExploreWelcomeSheetBase` + gate persistente).

### 3.3 Determinación de CountriesSheet (solo `pinFilter ∈ {saved,visited}`)

`CountriesSheet` es visible si:

- `countriesSheetOpen === true` (estado runtime del host)
- típicamente `pinFilter === "saved" | "visited"` (KPI mode)

La **auto-apertura** al entrar desde `all → saved/visited` con `count > 0` y la persistencia por filtro (`countriesSheetPersistRef`) se orquestan en `MapScreenVNext`. Referencia: [explore/FILTER_RUNTIME_RULES.md](explore/FILTER_RUNTIME_RULES.md) §1b–1c.

## 4) Matriz: carga inicial (web vs nativo)

### 4.1 `pinFilter` inicial (persistencia)

- **Web**: `pinFilter` puede leerse **sincrónicamente** desde storage; por lo tanto, el primer paint puede arrancar ya en `saved/visited`.
- **Nativo**: `pinFilter` arranca como `"all"` hasta hidratar `AsyncStorage`; luego puede transicionar a `saved/visited`.

Fuente: [explore/FILTER_RUNTIME_RULES.md](explore/FILTER_RUNTIME_RULES.md) §4.

### 4.2 Escenarios canónicos de arranque

#### A) Web arranca en `pinFilter="all"`

- **Si no hay overlays** y `isGlobeEntryMotionSettled === true` ⇒ WelcomeSheet visible.
- Si hay `welcomeSidebarDismissed` y web sidebar ≥1080 ⇒ WelcomeSheet suprimido.
- Si hay spot/poi seleccionado (deep link / restore) ⇒ SpotSheet visible y Welcome no aplica.
- Si Search se abre inmediatamente (por acción o restore) ⇒ overlay Search visible; Welcome no aplica.

#### B) Web arranca en `pinFilter="saved"|"visited"`

- Chrome entra a modo KPI.
- CountriesSheet puede aparecer si:
  - `countriesSheetOpen` restaurado como true por persistencia del filtro, o
  - lógica de auto-open lo activa (p. ej. transición desde all no aplica en “arranque frío”, pero persistencia sí).

#### C) Nativo arranca en `"all"` y luego hidrata a `"saved"|"visited"`

- Primer render puede ser elegible para Welcome (si `isGlobeEntryMotionSettled` y no overlays).
- Tras hidratación, el runtime puede abrir CountriesSheet según reglas (auto-open si `count > 0` al entrar al filtro, persistencia del sheet por filtro, etc.).

## 5) Matriz compacta (resultado esperado)

| Estado base | Resultado (superficie dominante) |
|------------|-----------------------------------|
| `searchV2Open=true` | Search (overlay/sheet) domina; no se muestra Welcome debajo; SpotSheet no se monta |
| `createSpotNameOverlayOpen=true` | CreateSpotNameOverlay domina (bloquea shell) |
| `selectedSpot!=null` o `poiTapped!=null` y `searchV2Open=false` | SpotSheet/POI domina |
| `pinFilter=all` + sin bloqueos + `isGlobeEntryMotionSettled=true` | WelcomeSheet |
| `pinFilter=saved|visited` + `countriesSheetOpen=true` | CountriesSheet |

## 6) Notas de QA (rápidas)

- Verificar en **web** que, al cancelar Search o cerrar Spot, se restaure CountriesSheet si estaba abierto antes y el contexto sigue siendo `saved/visited` (ver [FILTER_RUNTIME_RULES.md](explore/FILTER_RUNTIME_RULES.md) §1c).
- Verificar en **nativo** que la hidratación de `pinFilter` no sobrescribe preferencia con `"all"` (guardrail de storage-ready).

