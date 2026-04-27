# 386 — Selection dominance para sheets contextuales + header canónico

**Fecha:** 2026-04-26  
**Rama:** `codex/p0-map-camera-bbox-guards`  
**Estado:** implementado en rama, pendiente de QA manual

## Contexto

QA detectó que, al estar en `Todos` con un SpotSheet abierto, cambiar a `Por visitar` o `Visitados` reemplazaba la consulta activa por CountriesSheet. Producto aclaró que WelcomeSheet y CountriesSheet son superficies motivacionales/de navegación contextual: deben ayudar, no interrumpir la consulta del usuario.

También se pidió retirar accesos directos flotantes sobre controles de mapa y empezar a reducir duplicidad entre cabeceras de WelcomeSheet y CountriesSheet.

## Decisión

- `selectedSpot` / `poiTapped` domina sobre WelcomeSheet y CountriesSheet.
- Si el usuario cambia de `Todos` a `Por visitar`/`Visitados` mientras consulta un spot/POI, el runtime mantiene el SpotSheet activo y difiere CountriesSheet hasta el cierre si el filtro activo tiene datos.
- WelcomeSheet y CountriesSheet no usan `X` de cierre en su cabecera base. Se desplazan por cambio de filtro, búsqueda, cuenta desktop, selección Spot/POI u overlay bloqueante.
- Los botones circulares flotantes de países/lugares/reapertura Welcome sobre controles del mapa quedan fuera del canon V1.
- Se crea `ExploreContextSheetHeader` como cabecera canónica compartida por Welcome/Countries y se registra en la vitrina de Design System.
- `Por visitar` / `Visitados` ya no usan banda inferior KPI/FLOWYA/Search como fallback. Con filtro KPI persistido y count > 0, CountriesSheet se abre como superficie base al hidratar.
- Selección cross-filter desde búsqueda fuerza el pin seleccionado visible en mapa con su estado real.
- Seleccionar país desde CountriesSheet mantiene mínimo `medium`; el vuelo programático del mapa no colapsa la lista a `peek`.

## Archivos principales

- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/CountriesSheet.tsx`
- `components/design-system/explore-welcome-sheet.tsx`
- `components/design-system/explore-context-sheet-header.tsx`
- `app/design-system.web.tsx`
- `components/design-system/ds-toc-nav.tsx`
- `lib/explore-map-chrome-layout.ts`
- `docs/contracts/explore/FILTER_RUNTIME_RULES.md`
- `docs/contracts/EXPLORE_CHROME_SHELL.md`
- `docs/contracts/EXPLORE_SHEETS_BEHAVIOR_MATRIX.md`
- `docs/contracts/explore/SELECTION_DOMINANCE_RULES.md`
- `docs/ops/OPEN_LOOPS.md`

## QA pendiente

1. En `Todos`, abrir un spot y cambiar a `Por visitar`: el SpotSheet debe seguir visible.
2. Repetir hacia `Visitados`: el SpotSheet debe seguir visible.
3. Cerrar el SpotSheet con filtro KPI activo y count > 0: CountriesSheet puede aparecer como contexto diferido.
4. Verificar que no aparezcan botones circulares flotantes de países/lugares o reapertura Welcome sobre MapControls.
5. Verificar Welcome/Countries en mobile y desktop sidebar: header consistente, minimal, sin X de cierre base.
6. Verificar `/design-system`: sección `Explore — ExploreContextSheetHeader` visible en el TOC y sin roturas visuales.
7. Refrescar navegador en `Visitados`/`Por visitar`: debe abrir CountriesSheet, no banda FLOWYA/Search/KPI inferior.
8. En `Por visitar`, buscar un spot `Visitado` y abrirlo: debe verse seleccionado en mapa sin auto-cambiar filtro.
9. Tocar país en CountriesSheet: debe verse `Lugares en {país}` en `medium` mientras el mapa vuela al país.

## Qué no resuelve

- No extrae todavía un shell común completo para todas las sheets Explore.
- No rediseña Search, ni abre Fluir/Recordar.
- No modifica DB, RLS ni Storage.
