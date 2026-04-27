# FILTER_RUNTIME_RULES

Reglas runtime de filtros de pines (`Todos`, `Por visitar`, `Visitados`).

**Chrome / banda inferior:** al cambiar entre `all` y `saved`/`visited`, el host del chrome de Explorar sigue [EXPLORE_CHROME_SHELL.md](../EXPLORE_CHROME_SHELL.md) (sheet bienvenida vs banda KPI; offsets centralizados en `computeExploreMapChromeLayout`). **Snap inferior compartido** (`peek` / `medium` / `expanded`) y **entrada KPI → CountriesSheet:** ver EXPLORE_CHROME_SHELL §5–7. **Fila FLOWYA / `ExploreMapStatusRow`:** [FLOWYA_STATUS_ROW_VISIBILITY.md](FLOWYA_STATUS_ROW_VISIBILITY.md).

**Fila superior de filtros en mapa (2026-04):** coexiste con `ExploreMapProfileButton`. Ancho útil tras reserva de perfil: `EXPLORE_MAP_LAYOUT.MAP_FILTER_PROFILE_RESERVE_X`. **Web viewport ≥ tablet (768px):** `MapPinFilterInline` layout **wide** (inline amplio). **Móvil y web &lt; 768px:** siempre `MapPinFilterInline` **compact** (sin `MapPinFilter` chip en mapa). Con **sidebar desktop**, el overlay de filtros se ancla solo a la columna del mapa (`left: desktopSidebarPixelWidth`) y el contenido queda centrado en esa columna.

## Scope

- Selección de filtro.
- Persistencia de preferencia de filtro.
- Badge de pendiente de lectura.
- Estado vacío y deshabilitado.
- Persistencia local de pendientes.

## Reglas canónicas

0. **Intención explícita (OL-WOW-F2-003)**
- Filtros comunicados como guía, no switch técnico: intención por filtro.
- `Todos`: "Explora y decide"; `Por visitar`: "Planifica lo próximo"; `Visitados`: "Recuerda lo vivido".
- Al seleccionar filtro en dropdown del mapa: toast con mensaje de intención.
- Matiz contextual 2026-03-01:
  - si el usuario viene desde `all`, el toast invita a actuar sobre el nuevo filtro;
  - si ya estaba en un filtro (`saved`/`visited`), el toast recuerda explícitamente el contexto actual.
- MapPinFilterInline (buscador): sin subtítulos para no saturar.
- MapPinFilter: a11y incluye intención; en futuro se evaluará comportamiento adaptativo.
- **Toast y sheet expandido (2026-04):** el mensaje de cambio de filtro **sí** se muestra aunque SpotSheet / países / bienvenida estén en `expanded`. Posición: [`SYSTEM_STATUS_TOAST.md`](../SYSTEM_STATUS_TOAST.md) §2.2–2.3 (borde inferior del viewport; no ocultar solo por sheet expandido). Única omisión explícita: `handlePinFilterChange` con `toastMessage: ""` (p. ej. pastilla visitados → abre sheet de países) para no duplicar intención.

1. **Filtros disponibles**
- `all`, `saved`, `visited`.
- Si `saved`/`visited` tienen `count=0`, opción deshabilitada y sin número.

1b. **Entrada a KPI desde Todos y sheet de países (2026-04)**
- Al pasar de **`all` → `saved`/`visited`** con **count > 0** en el filtro destino y **sin** selección activa (`selectedSpot == null` y `poiTapped == null`), el runtime **abre** `CountriesSheet` y aplica el **snap compartido** con el welcome (no solo la banda KPI).
- Si existe selección activa, **SpotSheet domina**: el cambio de filtro actualiza dataset/chips/mapa, pero **no reemplaza** la consulta del usuario por una sheet motivacional. El CountriesSheet se puede abrir al cerrar el spot si el filtro activo sigue siendo `saved`/`visited` y tiene datos.
- En recarga/hidratación con `pinFilter` persistido en **`saved`/`visited`** y **count > 0**, `CountriesSheet` debe abrirse como superficie base del filtro. La banda inferior KPI/FLOWYA/Search no es fallback válido para filtros KPI.
- Con **count = 0** en el filtro destino, **no** se fuerza abrir el sheet de países (evita sheet vacío confuso); el usuario puede abrirlo vía pastilla/KPI.
- Entre **`saved` ↔ `visited`**, la visibilidad y el estado del sheet siguen `countriesSheetPersistRef` y la regla de “sheet abierto en el filtro anterior” (ver comentario `useLayoutEffect` en `MapScreenVNext`).

1c. **KPI + CountriesSheet abierto + SpotSheet desde mapa (2026-04)**
- Con **`saved`/`visited`**, si el usuario tenía el **CountriesSheet** abierto (incl. drilldown de país / lista) y abre un **spot o POI** encima (mapa, pin, búsqueda, etc.), al **cerrar** el SpotSheet el runtime **restaura** el CountriesSheet con el mismo snap y vista de lista que tenía antes. No aplica si el spot se abrió **desde dentro** del CountriesSheet (lista): ahí el cierre del spot no debe volver a mostrar el sheet de países por error (`countriesSheetBeforeSpotSheetRef` se anula en ese flujo).
- Si el usuario abre un spot desde **Todos** y cambia a **Por visitar** o **Visitados** mientras lo consulta, al cerrar el SpotSheet se puede abrir `CountriesSheet` en la vista KPI inicial del filtro activo. Esto es un **deferred context sheet**, no un reemplazo de selección.

2. **Pending-first navigation (OL-WOW-F2-003)**
- Si hay badge pendiente en `saved` o `visited`, al entrar a ese filtro: seleccionar ese spot, abrir sheet `medium`, centrar mapa.
- Comportamiento estable y predecible; usuario evita buscar manualmente. Referencia: bitácora `175`.

3. **Pendientes de lectura**
- El estado pendiente es por filtro (no monovalor): `saved` y `visited` pueden coexistir.
- Si usuario está en `Todos` y muta estado desde sheet:
  - activar pendiente en filtro destino.
- Si usuario toca otro filtro distinto al pendiente:
  - no limpiar pendiente ajeno.
- Se limpia solo cuando:
  - usuario selecciona ese filtro, o
  - el count de ese filtro llega a `0`.

4. **Persistencia local de preferencia (`pinFilter`)**
- La última selección (`all` | `saved` | `visited`) se persiste por dispositivo usando `mapPinFilterPreference`.
- Web: lectura síncrona en boot.
- Nativo: hidratación asíncrona en mount.
- Guardrail: en nativo no escribir la preferencia antes de completar la hidratación inicial, para no sobrescribir con default `all`.
- APIs (`lib/storage/mapPinFilterPreference.ts`): `getMapPinFilterPreference()` (sync; web efectiva, nativo default hasta hidratar), `loadMapPinFilterPreferenceAsync()`, `setMapPinFilterPreference(next)` (best-effort, sin throw).
- Clave de storage: `flowya_map_pin_filter_preference`.

5. **Persistencia local de pendientes**
- Pendientes se guardan localmente y sobreviven recarga/sesión local.
- Persistencia por objeto completo `{ saved, visited }` para evitar sobrescritura parcial.
- APIs (`lib/storage/mapPinPendingBadges.ts`): `getMapPinPendingBadges()` / `loadMapPinPendingBadgesAsync()`, `setMapPinPendingBadges({ saved, visited })`.
- Clave de storage: `flowya_map_pin_pending_badges`.

6. **Acción de reset**
- En `saved/visited`, trigger muestra `X` para volver a `Todos`.
- En web no se permite `button` dentro de `button` (overlay táctil hermano).

7. **Dropdown positioning + visibilidad contextual (2026-03)**
- El trigger de filtro se ancla respecto al sheet activo para mantener continuidad visual (no flotar arbitrario).
- La apertura del menú debe resolverse dinámicamente (`up/down`) según espacio disponible por encima/debajo del trigger.
- El dropdown no debe renderizarse cuando:
  - `Search` está abierto,
  - `Create Spot Paso 0` está abierto,
  - la cámara está en transición programática y aún no se considera estable.

8. **Retardo de aparición post-cámara (2026-03)**
- Tras `flyTo/fitBounds/load`, el dropdown espera settle de cámara antes de reaparecer.
- Debe existir fallback timeout para evitar bloqueo permanente si el evento de settle no llega.
- La primera aparición puede usar delay corto para suavizar lectura; reapariciones subsecuentes no deben introducir latencia excesiva.

9. **Estado de spot explícito (SpotSheet, 2026-03-01)**
- El cambio de estado en sheet no debe depender de transición implícita secuencial.
- Deben existir dos acciones explícitas:
  - `Por visitar` (toggle on/off),
  - `Visitado` (toggle on/off).
- Al activar `Visitado`, prevalece sobre `Por visitar` (normalización de estado).
- Al desactivar el estado activo dentro de un filtro (`saved` o `visited`), el spot sale de esa lista y la vista permanece en el filtro actual.

10. **Sticky Context (2026-03-02, cierre definitivo)**
- Política canónica de transición de filtro: `sticky`.
- Al mutar estado (`default ↔ to_visit ↔ visited`), el filtro activo no cambia automáticamente.
- La navegación entre filtros es explícita por acción de usuario (pills/dropdown), no por side effects de guardado.
- Se permite feedback textual con CTA sugerido (`Ver Visitados`, `Ver Por visitar`, `Ver Todos`) sin auto-switch.

11. **Excepción temporal de visibilidad post-mutación**
- Runtime mantiene `recentlyMutatedSpotId`, `recentMutationUntil` y `recentMutationOriginFilter`.
- El spot mutado reciente se mantiene visible temporalmente (TTL canónico: `10s`) para evitar desaparición percibida.
- La excepción es de un solo spot (última mutación gana).
- Si el spot default está enlazado a POI Mapbox, la excepción no persiste fuera de selección activa.
- Fuente del TTL: `RECENT_MUTATION_TTL_MS = 10_000` en `core/explore/runtime/state.ts`.

12. **Sheet de contador de países (`CountriesSheet`, 2026-04)**
- **Accionables (burbuja «Países» del overlay, KPI «países» y KPI «lugares» en el sheet):** no usar **`peek`** como primera posición al abrir. Snapshot persistido en `peek` se trata como **`medium`**. KPI «países» (fila resumen) lleva el sheet a **`medium`** y vuelve a la vista de lista de países (cierra detalle / listado «todos los lugares»). KPI «lugares» y la burbuja de lugares del overlay abren en **`expanded`** con listado de lugares.
- **Cambio de filtro `Por visitar` ↔ `Visitados` con el sheet de países abierto:** se conserva el **mismo nivel** (`peek`/`medium`/`expanded`) del filtro que se deja, en lugar de restaurar solo el snapshot del filtro destino (evita saltar a un `expanded` guardado hace tiempo y refuerza sensación de **recarga** de la misma superficie). El sheet permanece **abierto** aunque el destino no tuviera `open: true` en persistencia (primera vez en ese filtro con sheet ya visible). Se limpia `countryDetail` / listado al cruzar filtros para datos coherentes con el nuevo bucket.
- **Cierre contextual (2026-04-26):** CountriesSheet y WelcomeSheet son superficies base/motivacionales. No llevan `X` de cierre en su cabecera canónica; se desplazan por cambio de filtro, búsqueda, selección Spot/POI, cuenta desktop u overlay bloqueante. Los accesos circulares flotantes sobre controles del mapa quedan fuera del canon.
- **País → lugares:** al seleccionar un país desde la lista/KPI, el sheet cambia a vista de lugares y conserva mínimo `medium`. Esta acción es **navegación contextual**, no filtro explícito: solo la ruta del sheet/listado queda acotada al país; el mapa vuela al envelope de sus spots sin ocultar pins de otros países, no muestra chip de país activo y no persiste filtro de país. Si el usuario abre `Filtrar` y selecciona un país, entonces sí es filtro explícito: puede acotar la visibilidad/listado, muestra chip y se persiste. El resaltado de área queda fuera de V1 hasta contar con geometría/control visual estable.
- **Mapa del contador de países:** tocar un país en el mini mapa de CountriesSheet es una acción para ver el área en el mapa principal; el sheet debe plegarse a `peek` fuera de desktop sidebar.
- **Control del usuario tras país → lugares:** el `fitBounds` programático puede protegerse solo contra eventos sintéticos inmediatos. El primer gesto real del usuario sobre el mapa debe colapsar la sheet a `peek`; no debe requerir dos interacciones.

## Troubleshooting

1. **Tras ir a `Todos` y volver a `saved`/`visited`, el sheet de contador de países no reaparece**
- Causa histórica: carrera entre restauración de persistencia al cambiar `pinFilter` y el efecto que escribe `{ open, state }` en `countriesSheetPersistRef` con estado obsoleto (`open: false` en el primer frame).
- Implementación: restauración en `useLayoutEffect` en `MapScreenVNext` (antes del `useEffect` de sync) para que el snapshot guardado al salir de `saved`/`visited` no se pise al volver desde `all`.

2. **En nativo siempre vuelve a `Todos` al reabrir**
- Verificar que se hidrate `mapPinFilterPreference` al montar.
- Confirmar que la escritura de preferencia no ocurra antes de terminar la hidratación inicial.
- Validar que `pinFilterStorageReady` pase a listo incluso si falla la lectura inicial de AsyncStorage (evita bloqueo perpetuo de sync).

3. **`saved`/`visited` aparece vacío tras deep link o post-edit**
- Comportamiento esperado: no hay auto-switch a `all`.
- Revisar la excepción temporal de visibilidad (`recentlyMutatedSpotId` + TTL).

4. **Badges pendientes se pisan entre filtros**
- Verificar persistencia como objeto completo `{ saved, visited }`, no escrituras parciales por clave.

5. **Filtro no persiste en web (modo privado / bloqueo de storage)**
- Comportamiento esperado: fallback en memoria cuando `localStorage` falla (`setItem` best-effort).
- La UI no debe depender de excepciones de persistencia para reflejar el filtro visible actual.

## Core puro recomendado

- `reducePendingBadges(prev, event) => next`
- `getFilterAvailability(counts) => { savedDisabled, visitedDisabled }`

## Adapter necesario

- `LocalStateAdapter.getPendingBadges()`
- `LocalStateAdapter.setPendingBadges()`

## Referencias

- `docs/contracts/SYSTEM_STATUS_TOAST.md`
- `docs/contracts/MAP_PINS_CONTRACT.md`
- `docs/bitacora/2026/02/095-pins-por-visitar-y-map-pin-filter-dropdown.md`
- `docs/bitacora/2026/02/175-map-pin-filter-pending-badge-position-y-focus-spot.md`
- `docs/bitacora/2026/02/177-map-pin-filter-multi-pending-badges.md`
- `docs/bitacora/2026/02/178-map-pin-filter-pending-badges-local-persistence.md`
- `docs/bitacora/2026/03/242-filtro-dropdown-y-retardo-hasta-settle-de-camara.md`
