# 257 — Post-QA: Search quick actions, overlay descripción, cards y filtros intensos

Fecha: 2026-03-01
Tipo: post-QA hardening UX/UI + consistencia visual DS

## Contexto

Después de QA en local/web se detectaron issues residuales en buscador y filtros:

- Quick action de imagen fallando con toast genérico.
- Quick action de descripción abriendo y cerrando inmediatamente.
- Microcopy de descripción mencionaba “diario” (término aún no canon).
- Card seleccionada se veía visualmente cortada por ajuste de máscara.
- Placeholder de imagen con estilo punteado percibido como error.
- Filtros seleccionados (inline + mapa) en light sin intensidad suficiente de naranja/verde.

## Cambios aplicados

### 1) Quick action “Agregar imagen” — robustez en web
Archivo: `components/explorar/MapScreenVNext.tsx`

- Se endurece lectura de asset del picker:
  - primero intenta `asset.file` (Blob nativo de web)
  - fallback a `asset.uri` + `fetch`
- Se elimina dependencia rígida de `uri` para continuar flujo.
- Resultado: se evita fallo “No se pudo completar la carga de imagen” por variación de shape de asset en web.

### 2) Quick action “Descripción corta” — anti-cierre inmediato
Archivos:
- `components/design-system/search-list-card.tsx`
- `components/explorar/MapScreenVNext.tsx`

- Se refuerza supresión de `onPress` padre al tocar quick actions.
- Se añade guard temporal para cierre por backdrop al abrir overlay de descripción (`~350ms`), evitando el patrón “abre y se cierra en el mismo tap” por empalme de eventos.

### 3) Microcopy descripción corta (genérico)
Archivos:
- `components/design-system/search-list-card.tsx`
- `components/explorar/MapScreenVNext.tsx`

- CTA en card: `Escribe una nota personal breve.`
- Placeholder en editor rápido:
  - de: texto con referencia a “diario”
  - a: `Escribe una nota personal breve sobre {spot}.`

### 4) Card de resultados — máscara y placeholder
Archivo: `components/design-system/search-list-card.tsx`

- Se mantiene máscara de card para bordes redondeados (`overflow: hidden`).
- Se elimina estilo punteado del placeholder de imagen.
- Placeholder se simplifica a divisor derecho (`borderRightWidth`) para no competir con estado seleccionado.
- Se ajusta recorte visual del highlight sin romper la forma redondeada de la card.

### 5) Filtros seleccionados con color intenso (light + dark)
Archivos:
- `components/design-system/map-pin-filter-inline.tsx`
- `components/design-system/map-pin-filter.tsx`

- Se unifica estado seleccionado en ambos modos:
  - `saved / Por visitar` => `colors.stateToVisit` (naranja intenso)
  - `visited / Visitados` => `colors.stateSuccess` (verde intenso)
- Aplica tanto a filtro inline de buscador como al filtro principal del mapa.

## Resultado esperado

- Quick add image estable en web sin error genérico intermitente.
- Overlay de descripción rápida estable (sin auto-cierre inmediato por tap de apertura).
- Copy neutral, sin asumir nomenclatura futura del producto.
- Cards visualmente limpias: bordes redondeados correctos + placeholder sin borde “error”.
- Estados activos de filtros claramente distinguibles por color intenso en light y dark.

## Sanidad

- Validaciones de lint ejecutadas durante el bloque de cambios:
  - `npm run lint -- --no-cache` OK.
