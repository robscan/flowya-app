# 272 — Arquitectura de capas para pines default no enlazados + contraste de contadores en filtros (light)

Fecha: 2026-03-02  
Tipo: Map rendering architecture + UI contrast hardening  
Área: `lib/map-core/spots-layer.ts`, `components/design-system/map-pin-filter.tsx`, `components/design-system/map-pin-filter-inline.tsx`, `constants/theme.ts`, `components/explorar/MapScreenVNext.tsx`

## Contexto

Se detectaron dos problemas visuales:

- En zoom-out, algunos pines `default` no enlazados dejaban artefactos (anillos/bordes residuales) al ocultarse.
- En modo light, los contadores (`18`, `52`) del filtro dropdown/inline perdían contraste en estado inactivo por usar badge claro sobre superficies claras.

## Decisiones

### 1) Arquitectura canónica por capas (no por opacidad global)

En `spots-layer` se reemplaza la aproximación de una sola capa con opacidad por una separación semántica de capas:

- Círculos:
  - `default` no enlazado (no seleccionado) con `minzoom` explícito.
  - `default` no enlazado (seleccionado) siempre visible.
  - `to_visit`/`visited` siempre visibles.
- Símbolos `+`:
  - `default` no enlazado seleccionado/no seleccionado en capas separadas.
- Labels:
  - `default` no enlazado seleccionado/no seleccionado en capas separadas.
  - `to_visit`/`visited` en capa dedicada.

Resultado: desaparece la posibilidad de “ocultar fill pero dejar stroke”, porque ya no dependemos de opacidad condicional para el caso principal.

### 2) Regla de zoom tipo POI para `default` no enlazado

- Se mantiene umbral explícito para no saturar zoom-out:
  - `DEFAULT_UNLINKED_MIN_ZOOM = 13`.
- Los `default` seleccionados se mantienen visibles para no romper foco/intención del usuario.

### 3) Contraste de badges en filtros (dropdown + inline)

Se corrigen tokens por modo para contadores:

- Light:
  - badge background: `surfaceMuted`
  - badge text: `text`
  - badge border: `borderSubtle`
- Dark:
  - badge background: `surfaceOnMap`
  - badge text: `pin.default`
  - badge border sutil oscuro/claro de separación

Se agrega `borderWidth` al badge para que el borde sea consistente en ambos componentes.

## Implementación técnica

- `MapScreenVNext` pasa `linkedPlaceId` al layer map core para distinguir correctamente `default` no enlazado.
- `spots-layer` calcula `isUnlinkedDefault` por feature y aplica filtros de capa por estado/selección.
- `map-pin-filter` y `map-pin-filter-inline` ajustan colores de badge en función de `resolvedScheme`.

## Resultado esperado

- Zoom-out estable: sin anillos residuales en pines ocultos.
- Comportamiento más cercano a POIs de Mapbox para `default` no enlazados.
- Contadores de filtros claramente visibles en modo light (dropdown e inline), sin perder consistencia en dark.

## Sanidad

- `npm run lint -- --no-cache` OK.
