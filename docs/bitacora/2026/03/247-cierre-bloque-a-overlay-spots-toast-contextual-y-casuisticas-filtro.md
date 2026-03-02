# 247 — Cierre Bloque A: overlay spots, toast contextual y casuísticas de filtro

Fecha: 2026-03-01  
Tipo: cierre funcional para QA de Bloque A

## Objetivo

Cerrar pendientes operativos del Bloque A antes de pasar a QA:

- contador de spots del filtro activo sobre botón de países,
- toasts contextuales al cambiar filtro desde mapa y buscador,
- consistencia de selección/sheet cuando un spot deja de pertenecer al filtro activo.

## Cambios

### 1) Contador de spots sobre botón de países

Archivo: `components/explorar/MapScreenVNext.tsx`

- Se añadió badge de spots (`countriesPlacesCountForOverlay`) sobre el círculo de países.
- El badge es accionable y abre la lista de spots del filtro activo usando flujo canónico (`handleCountriesSpotsKpiPress`).
- Se mantiene separación visual: círculo principal = países; badge = spots.

### 2) Toast contextual por origen de filtro (sin depender de search abierto)

Archivo: `components/explorar/MapScreenVNext.tsx`

- `handlePinFilterChange` ahora emite toast contextual siempre que el filtro cambie:
  - desde `all`: invita a acción,
  - desde `saved/visited`: recuerda contexto actual.
- Se agrega guardrail `if (nextFilter === currentFilter) return` para evitar toasts redundantes.

### 3) Casuística: spot seleccionado deja de cumplir filtro activo

Archivo: `components/explorar/MapScreenVNext.tsx`

- Se añadió efecto de consistencia:
  - si filtro activo es `saved`/`visited` y el spot seleccionado pierde ese estado,
  - se limpia selección y sheet vuelve a `peek`.

Resultado: evita quedarse con un sheet abierto sobre un spot que ya no pertenece a la lista filtrada.

## Relación con bitácoras previas

- `245` mantiene cambios base de estado explícito y hardening.
- `246` documenta ajuste visual de iconos KPI en CountriesSheet.
- `247` completa pendientes de Bloque A para QA funcional.

## Sanidad local

- `npm run lint -- --no-cache` -> OK
