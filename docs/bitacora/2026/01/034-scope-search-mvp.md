# Bitácora 034 — Scope SEARCH (post-freeze v0.33)

## Objetivo

Implementar un buscador MVP sobre el mapa, 100% UI/UX-driven, reutilizando patrones existentes, sin flows nuevos. Rama: `feature/search-mvp`.

## Cambios realizados

### 1. IconButton — Estado selected (Design System)

- **Archivo:** `components/design-system/icon-button.tsx`
- **Prop:** `selected?: boolean`
- **Comportamiento:** Cuando `selected === true`, el botón usa el mismo aspecto que pressed (bg primary, icono blanco). Permite indicar modo activo (ej. búsqueda) sin duplicar lógica.

### 2. SpotCardMapSelection — Opción hideActions

- **Archivo:** `components/design-system/spot-card.tsx`
- **Prop:** `hideActions?: boolean`
- **Comportamiento:** Si `hideActions === true`, no se muestran los botones flotantes guardar/compartir. Usado en la lista de resultados de búsqueda (card visualmente igual a la de selección de pin, sin acciones).

### 3. Mapa — Botón Buscar y modo búsqueda

- **Archivo:** `app/(tabs)/index.web.tsx`

**UI — Botón Buscar**

- Ubicación: arriba a la derecha, apilado verticalmente: **Buscar** (arriba), **Crear spot** (abajo).
- Al tocar Buscar: botón entra en estado `selected`, se activa `searchActive === true`.
- Al tocar de nuevo el botón o el fondo (mapa): se desactiva búsqueda.

**Estado “Modo búsqueda” (`searchActive === true`)**

- **Se ocultan:** botón de perfil (arriba izquierda), botón Crear spot, controles del mapa (zoom, ubicación, ver todo).
- **Se mantienen:** mapa visible pero bloqueado (backdrop transparente captura toques), label FLOWYA, filtros (Todos / Por visitar / Visitados), botón Buscar (selected).

**Campo de búsqueda**

- Debajo de los filtros, 100% ancho; sin contenedor envolvente (input y área de resultados son hijos directos del overlay de filtros).
- Placeholder: «Buscar lugares…».
- Filtrado: match simple **solo por título** (sin short_description, sin fuzzy ni ranking).
- Sin texto: se muestran por defecto los **10 spots más cercanos** (al usuario o al centro fallback del mapa); no se muestra «Crear nuevo spot».
- Con texto: búsqueda por título; «Crear nuevo spot» solo aparece cuando el usuario ha ingresado texto (al final de resultados o en el bloque «sin resultados»).

**Resultados**

- Área de resultados: ocupa todo el espacio visible disponible bajo el input (flex: 1, minHeight: 0); si hay más resultados que caben, se genera scroll dentro de esa área.
- **Sin texto de búsqueda:** lista predeterminada de los 10 spots más cercanos (orden por distancia Haversine desde `userCoords` o, si no hay ubicación, desde `FALLBACK_VIEW`). No se muestra «Crear nuevo spot».
- **Con texto y hay resultados:** lista filtrada por título; al final de la lista se muestra «Crear nuevo spot».
- **Con texto y no hay resultados:** mensaje «¿No encontraste lo que buscas?» y botón «Crear nuevo spot».
- Al seleccionar un resultado: se desactiva modo búsqueda, se ocultan input y lista, el mapa centra el spot y muestra SpotCardMapSelection (mismo flujo que al tocar un pin). El filtro activo se conserva.

### 4. Reglas técnicas respetadas

- No se duplica lógica de selección de pin ni de SpotCardMapSelection; el buscador solo orquesta UI y estado.
- `handleSearchResultSelect` hace `setSelectedSpot(spot)` + `setSearchActive(false)` + `mapInstance.flyTo`; el resto del comportamiento es el ya existente para un pin seleccionado.
- Input de búsqueda con `WebTouchManipulation` para evitar zoom por doble tap en web.
- Sin listeners nuevos en el mapa; sin `console.log` añadidos.

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `components/design-system/icon-button.tsx` | Prop `selected`, estilos y color de icono cuando selected |
| `components/design-system/spot-card.tsx` | Prop `hideActions`; prop `onCardPress` (tap → onCardPress en lugar de navegar al detalle); accesibilidad según onCardPress |
| `components/design-system/search-result-card.tsx` | Nuevo: SearchResultCard (SpotCardMapSelection con hideActions + onCardPress), SearchResultsShowcase |
| `components/design-system/index.ts` | Export SearchResultCard, SearchResultsShowcase, SearchResultCardProps |
| `app/design-system.web.tsx` | Sección «Search result card (listado de búsqueda)» con SearchResultsShowcase |
| `app/(tabs)/index.web.tsx` | Estado searchActive/searchQuery, searchResults, defaultSpots; botón Buscar, input + área resultados, backdrop; handlePinClick, handleSearchResultSelect, handleSelectedPinTap; selectedPinScreenPos + hit area; SearchResultCard; overlay alto 100%; exitSearchMode (tap fuera sin borrar texto), handleClearSearch + botón X en input (searchInputWrap, searchClearButton, searchInputRef); handleSearchResultSelect sin setSearchQuery; handleToggleSearch sin limpiar query |

## Validaciones obligatorias (antes de cerrar)

- [ ] Modo búsqueda entra y sale sin glitches.
- [ ] Scroll de resultados funciona en desktop y mobile web.
- [ ] Doble tap / zoom no reaparece en el input de búsqueda.
- [ ] Console limpia (sin logs nuevos).
- [ ] Comportamiento al seleccionar resultado idéntico a seleccionar un pin (centrado + SpotCardMapSelection).

## Criterio de cierre

- [x] Rama `feature/search-mvp` creada desde main.
- [x] Botón Buscar arriba a la derecha, apilado con Crear spot.
- [x] Modo búsqueda: oculta perfil, Crear spot y controles; mantiene mapa bloqueado, FLOWYA y filtros.
- [x] Campo búsqueda + resultados con SpotCard sin acciones; sin resultados → mensaje + Crear nuevo spot.
- [x] Selección de resultado reutiliza flujo de pin (setSelectedSpot + flyTo).
- [ ] Validaciones de la sección anterior pasadas en manual/QA.

---

## Ajustes posteriores (5)

1. **Sin contenedor envolvente:** Eliminado el `searchPanel` que envolvía el input y el listado. El input y el área de resultados son hijos directos del overlay de filtros cuando `searchActive`.
2. **«Crear nuevo spot» siempre visible:** Se muestra siempre al final: sin texto de búsqueda (solo el botón); con resultados (al final del scroll); sin resultados (junto a «¿No encontraste lo que buscas?»).
3. **Sin resultados si no hay texto:** `searchResults` devuelve `[]` cuando `searchQuery.trim()` está vacío; no se listan spots hasta que el usuario escribe.
4. **Área de resultados ocupa el espacio visible:** El contenedor de resultados (`searchResultsArea`) tiene `flex: 1` y `minHeight: 0`; el overlay en modo búsqueda usa `flexDirection: 'column'` y el área de resultados llena el espacio bajo el input; el scroll se genera dentro de ella.
5. **Búsqueda solo por título:** El filtro de resultados usa únicamente `title` (match con `includes` en minúsculas); se eliminó el match por `short_description`.

---

## Ajustes posteriores (2)

6. **«Crear nuevo spot» solo con texto:** La opción «Crear nuevo spot» solo se muestra cuando el usuario ha ingresado texto de búsqueda: al final de la lista de resultados o en el bloque «¿No encontraste lo que buscas?». Sin texto no aparece.
7. **Predeterminado: 10 spots más cercanos:** Cuando no hay texto, se cargan y muestran por defecto los 10 spots más cercanos (según `filteredSpots` y el filtro Todos / Por visitar / Visitados). La distancia se calcula con `distanceKm` (Haversine) desde `userCoords`; si no hay ubicación del usuario, se usa el centro `FALLBACK_VIEW` del mapa. Lista ordenada por distancia y limitada a 10 (`defaultSpots`).

---

## Ajustes posteriores (alto 100% y selección)

8. **Alto del listado 100% del disponible:** El contenedor del listado de búsqueda debe abarcar el 100% del alto disponible en pantalla. Reestructuración: en modo búsqueda el overlay de filtros pasa a ocupar toda la pantalla (`top: 0`, `bottom: 0` en `filterOverlaySearchActive`), con `paddingTop: FILTER_OVERLAY_TOP` para respetar el borde superior. Se elimina el límite `height: 60%`; con `flexDirection: 'column'` y `searchResultsArea` con `flex: 1` y `minHeight: 0`, el listado usa todo el espacio bajo filtros e input. Sin cambios en el resto del comportamiento.
9. **Selección de card = mismo flujo que pin:** Al seleccionar una card del listado: (1) salir de modo búsqueda, (2) centrar en el mapa el pin del spot (`flyTo`), (3) mostrar la SpotCardMapSelection igual que si el usuario hubiera tocado el pin. Orden de estado en `handleSearchResultSelect`: `setSearchActive(false)`, `setSearchQuery('')`, `setSelectedSpot(spot)`, luego `flyTo`. Así se evita que la card quede oculta por el panel de búsqueda y el resultado es idéntico a seleccionar el pin en el mapa.

---

## Ajustes posteriores (componente SearchResultCard y onCardPress)

10. **SearchResultCard (Design System):** Nuevo componente en `components/design-system/search-result-card.tsx`. Card del listado de resultados de búsqueda: misma base visual que SpotCardMapSelection con `hideActions`. Props: `spot`, `savePinState`, `onPress`. Al tocar se notifica `onPress` (ej. seleccionar en el mapa). Incluye **SearchResultsShowcase** para visualizar en la página Design System (`app/design-system.web.tsx`). En el mapa (`app/(tabs)/index.web.tsx`) el listado de búsqueda (defaultSpots y searchResults) usa `SearchResultCard` con `onPress={() => handleSearchResultSelect(spot)}` en lugar de Pressable + SpotCard.

11. **SpotCardMapSelection — onCardPress:** Nueva prop opcional `onCardPress?: () => void` en `spot-card.tsx`. Si se proporciona, el tap en la card (thumbnail, título, descripción) llama a `onCardPress` en lugar de navegar al detalle del spot. Permite que SearchResultCard tenga un único comportamiento al tocar: ejecutar `onPress` (seleccionar en mapa) sin abrir Spot Detail. Accesibilidad: cuando `onCardPress` está presente se usa etiqueta «Seleccionar [título]» y `role="button"`; si no, «Ver detalle de [título]» y `role="link"`.

---

## Ajustes posteriores (tap en pin ya seleccionado → spot detail)

12. **Lógica sin toggle:** Si el pin **ya está seleccionado**, al tocarlo el sistema debe enviar a Spot Detail; si no está seleccionado, se selecciona y se muestra la card. No se cuenta taps: la regla es solo «pin seleccionado → detail; pin no seleccionado → seleccionar».

13. **handlePinClick (Marker):** En cada Marker del mapa, `onClick` llama a `handlePinClick(spot)`: si `selectedSpot?.id === spot.id` → `saveFocusBeforeNavigate`, `blurActiveElement`, `router.push('/spot/[id]')`; si no → `setSelectedSpot(spot)`. Así, cuando el pin recibe el tap (sin backdrop encima), el comportamiento es el indicado.

14. **Hit area del pin seleccionado:** Con la card abierta, el backdrop (pantalla completa, zIndex 9) está por encima del mapa, por lo que el tap «en el pin» llega al backdrop y cerraba la card (efecto toggle). Solución: **hit area** transparente sobre el pin seleccionado, por encima del backdrop (zIndex 10). Estado `selectedPinScreenPos` (posición en píxeles con `mapInstance.project([lng, lat])`), actualizada al elegir spot y en `moveend` del mapa. Pressable de 48×48 px centrado en esa posición, `onPress` → `handleSelectedPinTap` (navegar a spot detail). Constante `SELECTED_PIN_HIT_RADIUS = 24`. Resultado: tap en el pin seleccionado → Spot Detail; tap en el resto del mapa (backdrop) → cerrar card.

---

## Ajustes posteriores (exit + persistencia + botón clear)

15. **Salir de modo búsqueda sin perder texto:** Cerrar la UI de búsqueda (tap fuera: fondo del mapa, zonas vacías del overlay) no debe borrar `searchQuery` ni resultados. Se introduce **exitSearchMode()** que solo hace `setSearchActive(false)`. El backdrop llama a `exitSearchMode` en lugar de `handleCloseSearch`. Al volver a tocar el botón Buscar, el input y los resultados reaparecen intactos (estado latente). **handleCloseSearch** se mantiene para cuando se necesita cerrar y limpiar (no usado en backdrop ni en selección de resultado).

16. **Selección de resultado mantiene texto:** Al seleccionar un resultado del listado, solo se ejecuta `setSearchActive(false)` (y `setSelectedSpot`, `flyTo`); ya no se llama a `setSearchQuery('')`, de modo que la búsqueda queda latente.

17. **Toggle del botón Buscar:** Al tocar de nuevo el botón Buscar ya no se limpia `searchQuery`; solo se hace toggle de `searchActive` para mostrar/ocultar la UI.

18. **Botón clear (X) dentro del input:** Se muestra solo cuando `searchQuery.length > 0`, dentro del input a la derecha. Al tocar la X: `setSearchQuery('')` (los resultados pasan a `defaultSpots` por lógica existente), no se sale de `searchActive`, y se mantiene el foco en el input (`searchInputRef.current?.focus()`). La X es el único mecanismo para cancelar explícitamente el texto de búsqueda. Implementación: wrapper `searchInputWrap` (position relative) alrededor del TextInput, Pressable con icono X (position absolute, right), estilos `searchClearButton`; `paddingRight` dinámico en el input cuando hay texto para no solaparse con la X. Ref `searchInputRef` para poder hacer focus tras clear.
