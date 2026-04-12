# PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28

## Objetivo

Cerrar una capa mínima y útil de componentes responsivos en web para que FLOWYA pueda considerarse realmente utilizable como producto `web-first`, sin abrir un rediseño V3 ni migración a Radix/shadcn.

## Alcance

Superficies web a cerrar:

- búsqueda web
- SpotSheet y superficies tipo sheet
- países / counters / overlays del mapa
- auth modal
- create spot web
- edit spot web
- detail web
- cards/listados clave de resultados

## No alcance

- Explore V3
- refactor visual completo
- primitives nuevas Radix/shadcn
- rediseño desktop-heavy no alineado con mobile web
- componentes nativos

## Principios

- mantener `MapScreenVNext` y runtime actual
- priorizar mobile web primero, desktop web segundo
- evitar overflow horizontal, CTA fuera de viewport y layouts frágiles
- no meter variantes visuales nuevas si el problema es de layout
- cerrar superficies canónicas, no fixes aislados por pantalla

## Superficies y anclas reales del repo

### Búsqueda web

- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchSurface.tsx`
- `components/design-system/search-list-card.tsx`
- `components/design-system/search-result-card.tsx`

### Sheets / overlays

- `components/explorar/SpotSheet.tsx`
- `components/explorar/CountriesSheet.tsx`
- `components/explorar/spot-sheet/SpotSheetHeader.tsx`

### Auth / flows de entrada

- `contexts/auth-modal.tsx`

### Flujos web

- `app/create-spot/index.web.tsx`
- `app/spot/edit/[id].web.tsx`
- `app/spot/[id].web.tsx`

## Problemas a cerrar

- widths duras o inconsistentes entre mobile web y desktop web
- sheets demasiado anchos o mal alineados en desktop
- tarjetas/listados que colapsan mal en viewport estrecho
- CTA y footers que se salen del viewport con teclado móvil
- overlays que funcionan en una superficie pero no en otra

## Criterios responsivos mínimos

### Mobile web

Referencia:

- `360px` a `430px`

Debe cumplirse:

- sin overflow horizontal
- CTA primaria siempre alcanzable
- teclado no tapa campo principal ni CTA
- listados y quick actions siguen siendo táctiles

### Tablet / small laptop

Referencia:

- `768px` a `1024px`

Debe cumplirse:

- paneles y sheets con ancho controlado
- jerarquía visual estable
- no usar full-width si rompe legibilidad

### Desktop web

Referencia:

- `1280px+`

Debe cumplirse:

- overlays/sheets con ancho máximo consistente
- alineación deliberada, no estirada por accidente
- mapa sigue siendo superficie dominante

## Secuencia sugerida

### WR-01 — Inventario y contrato

- documentar superficies canónicas que deben ser responsivas
- definir anchos máximos, paddings y reglas comunes

### WR-02 — Search web responsiva

- cerrar `SearchOverlayWeb`
- cerrar cards/listados de resultados
- validar filtros, tags y keyboard-safe

### WR-03 — Sheets responsivos

- cerrar `SpotSheet`
- cerrar `CountriesSheet`
- expandir alcance antiguo de `OL-P3-001` (`max-width: 720px` + alineación) a una regla coherente entre sheets

### WR-04 — Auth y formularios web

- cerrar `auth-modal`
- cerrar `create-spot`
- cerrar `edit-spot`
- cerrar `spot detail`

### WR-05 — QA de cierre web

- smoke mobile web
- smoke tablet
- smoke desktop
- checklist de teclado, scroll, overlay, CTA y tap targets
- **Desktop ≥1080 (sidebar):** QA explícito de **MapControls** en `mapStage` (taps efectivos, sin capas fantasma), y revisión de **parpadeo / clip** al entrar o al cambiar ancho 400↔720 — canon [EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md](../../contracts/EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md). Seguimiento WR-05: docs/bitácora en PR #136; código transiciones: rama nueva desde `main` al ejecutar.

## Backlog técnico sugerido

- `BT-WEB-RESP-01` Definir helper/contrato de widths y paddings responsivos compartidos.
- `BT-WEB-RESP-02` Ajustar `SearchOverlayWeb` y `SearchSurface`.
- `BT-WEB-RESP-03` Ajustar `search-list-card` y `search-result-card`.
- `BT-WEB-RESP-04` Ajustar `SpotSheet` y `SpotSheetHeader`.
- `BT-WEB-RESP-05` Ajustar `CountriesSheet`.
- `BT-WEB-RESP-06` Ajustar `auth-modal`.
- `BT-WEB-RESP-07` Ajustar `create-spot`, `spot/edit`, `spot/detail` en web.
- `BT-WEB-RESP-08` Ejecutar QA multiviewport y congelar reglas.

## Riesgos

1. Tratar responsividad como polish y dejar rotas las superficies de entrada.
- Mitigación: incluirlo en cierre V1, no como follow-up cosmético.

2. Abrir V3 por accidente.
- Mitigación: prohibido introducir primitives nuevas o reescribir arquitectura UI.

3. Hacer fixes aislados y perder consistencia.
- Mitigación: helper/regla compartida de widths y paddings antes de tocar pantallas.

## Criterio de cierre

Se considera cerrado cuando:

1. El loop principal web funciona en mobile, tablet y desktop sin overflow ni CTA rotos.
2. Search, SpotSheet y CountriesSheet tienen reglas de ancho y alineación consistentes.
3. Auth/create/edit/detail web no colapsan con teclado o viewport estrecho.
4. El alcance web queda defendible como producto usable, no solo como runtime funcional.

## Relación con el roadmap V1

Este loop debe ejecutarse antes de declarar cerrada la V1 web-first y antes de monetización.

Secuencia recomendada:

1. estabilidad base web
2. auth / privacidad mínima
3. componentes responsivos web
4. contenido + `Recordar-lite`
5. métricas
6. monetización

## Evidencia reciente (OL-WEB-RESPONSIVE-001)

- **2026-04-11:** Bitácora [`337`](../bitacora/2026/04/337-explore-desktop-sidebar-clip-kpi-lugares-overflow.md) — clip en sidebar desktop al cambiar ancho KPI (400px) ↔ listado lugares (720px): columna estática, overflow y `minWidth` en cadena flex; contrato `EXPLORE_CHROME_SHELL.md` §8b.

---

## Estado: **cerrado** (2026-04-12)

Criterios del plan (WR-01–WR-05, auth/formularios, QA multiviewport) y trabajo desktop sidebar considerados cumplidos: mapa a ancho completo con `setPadding` (menos parpadeo que `resize` en animación), clip KPI/listado, mini-mapa países visitados con encuadre y gesto vertical. Declaración operativa: [`docs/ops/OPEN_LOOPS.md`](../OPEN_LOOPS.md) — loop activo siguiente **`OL-CONTENT-002`**.
