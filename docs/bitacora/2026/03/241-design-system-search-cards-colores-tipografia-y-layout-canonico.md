# 241 — Design System: colores canónicos + tipografía + layout de Search cards

Fecha: 2026-03-01  
Tipo: consolidación UX/UI / Design System / documentación canónica

## Contexto

En el ciclo reciente de Explore se aplicaron varios ajustes visuales en búsqueda y contador de países:

- Canonización de colores por modo/filtro.
- Afines tipográficos en cards de resultados.
- Reestructura del layout de cards con imagen y estados vacíos de metadata (imagen/descripcion).

Estos cambios ya estaban implementados en runtime, pero faltaba dejar traza unificada en bitácora para evitar drift en siguientes iteraciones.

## Objetivo

Dejar documentado de forma explícita qué quedó canónico en DS para:

1. Color system (light/dark) de países y filtros.
2. Tamaños y jerarquía de texto en resultados de búsqueda.
3. Layout de `SearchListCard` para mejorar densidad, legibilidad y acciones rápidas.

## Cambios canónicos consolidados

### 1) Colores canónicos de países/filtros en `theme`

Archivo: `constants/theme.ts`

Se consolidaron familias semánticas por filtro (`to_visit` / `visited`) y por modo (`light` / `dark`):

- Panel/sheet de países:
  - `countriesPanelToVisit*`
  - `countriesPanelVisited*`
- Mapa preview de países:
  - `countriesMapCountry*ToVisit`
  - `countriesMapCountry*Visited`
- Botón/contador de países:
  - `countriesCounterToVisit*`
  - `countriesCounterVisited*`

Resultado: cualquier ajuste futuro de tono/contraste se hace desde fuente única (`theme`) y propaga a runtime.

### 2) Aplicación de color canónico en componentes DS/runtime

Archivos:

- `components/design-system/map-pin-filter.tsx`
- `components/design-system/map-pin-filter-inline.tsx`
- `components/design-system/search-list-card.tsx`
- `components/explorar/CountriesSheet.tsx`
- `components/explorar/MapScreenVNext.tsx`

Regla aplicada:

- Filtros y chips de estado consumen tokens canónicos de `Colors`.
- Se eliminó dependencia de hardcodes dispersos para fondos de estado en resultados.
- Badge de conteo del filtro mantiene círculo oscuro de alto contraste (decisión UX explícita).

### 3) Ajustes de tipografía en card de resultados (`SearchListCard`)

Archivo: `components/design-system/search-list-card.tsx`

Quedó definido:

- Título más compacto: `fontSize: 15`, `fontWeight: 600`.
- Subtítulo más compacto: `fontSize: 13`, `lineHeight: 18`.
- CTA inline de descripción: `fontSize: 12`.
- Texto de placeholder de imagen y chips ajustado a escala pequeña para no competir con título.

Objetivo: mejorar escaneo vertical en listas largas sin perder legibilidad.

### 4) Ajustes de layout de card de resultados (`SearchListCard`)

Archivo: `components/design-system/search-list-card.tsx`

Se estableció layout canónico:

- Si hay imagen:
  - imagen integrada al borde izquierdo, sin padding superior/inferior/izquierdo de card.
  - bloque de texto con mayor separación respecto a media (`gap` mayor).
- Si no hay imagen:
  - placeholder accionable "Agregar imagen" integrado en el slot de media.
- Si no hay `description_short` en visitados:
  - CTA inline "Agregar una descripción corta." en el slot de subtítulo.
- Altura de card adaptable al contenido (sin truncado rígido del subtítulo).

Resultado: card más flexible y consistente para casos con/ sin media y con textos largos.

## Impacto UX

1. Mayor coherencia visual entre filtros de mapa, chips de resultados y sheet de países.
2. Mejor lectura de resultados por densidad tipográfica y jerarquía más clara.
3. Acciones de completitud de contenido (imagen/descripcion) integradas en el flujo natural de la card.

## Referencias técnicas

- `constants/theme.ts`
- `components/design-system/search-list-card.tsx`
- `components/design-system/search-result-card.tsx`
- `components/design-system/map-pin-filter.tsx`
- `components/design-system/map-pin-filter-inline.tsx`
- `components/explorar/CountriesSheet.tsx`
- `components/explorar/MapScreenVNext.tsx`

## Estado

- Ajustes implementados y consolidados en documentación.
- Se establece esta entrada como referencia para futuras decisiones de tono/escala en Search DS.
