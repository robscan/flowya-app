# 245 — Bloque A: estado explícito en SpotSheet, toasts contextuales y hardening quick actions

Fecha: 2026-03-01  
Tipo: implementación UX/runtime + documentación operativa

## Objetivo

Ejecutar el arranque del plan `PLAN_UX_MAPA_BUSCADOR_CONTADOR_DIARIO_2026-03-01.md` sobre el bloque de mayor impacto inmediato:

- claridad de estados (`Por visitar` / `Visitado`) en SpotSheet,
- mensajes contextuales por filtro,
- estabilidad de acciones rápidas en resultados de `visitados`,
- prevenir desaparición de spots Flowya en `Todos`,
- hardening web en mini-mapa de países.

## Cambios implementados

### 1) SpotSheet: estado explícito con 2 toggles

Archivo: `components/explorar/SpotSheet.tsx`

- `MediumBodyContent` deja de usar transición implícita secuencial.
- Se renderizan siempre dos pills accionables:
  - `Por visitar` (toggle on/off)
  - `Visitado` (toggle on/off)
- Cuando un estado está activo, la misma pill permite desactivarlo con copy explícito (`×`).
- Se extendió la firma de `onSavePin` para soportar acciones explícitas:
  - `to_visit`, `visited`, `clear_to_visit`, `clear_visited`.

Resultado UX: el usuario puede quitar un estado sin que el sistema lo promueva automáticamente al otro.

### 2) Persistencia canónica de estado de pin en una sola operación

Archivo: `lib/pins.ts`

- Nuevo helper: `setPinState(spotId, { saved, visited })`.
- Regla canónica aplicada en helper:
  - si `visited=true`, `saved` se normaliza a `false`.
- Persistencia por `upsert` único para evitar estados intermedios.
- Si ambos flags quedan `false`, se elimina el pin del usuario.

### 3) MapScreen: transición explícita + casuística de filtros

Archivo: `components/explorar/MapScreenVNext.tsx`

- `handleSavePin` ahora interpreta acciones explícitas (`set/clear`) y usa `setPinState`.
- Se mantiene lógica de continuidad:
  - badges pendientes,
  - pulse/switch de filtro según transición,
  - foco del spot cuando aplica.
- Toast final se alinea al outcome real:
  - `Agregado a Por visitar`
  - `¡Marcado como visitado!`
  - `Listo, ya no está en tu lista`

### 4) Toasts por contexto de filtro

Archivo: `components/explorar/MapScreenVNext.tsx`

- `handlePinFilterChange` diferencia mensajes según origen:
  - desde `all`: invita a actuar en el filtro destino,
  - desde `saved/visited`: recuerda explícitamente el contexto actual.

### 5) Quick actions de Search (visitados): hardening web

Archivo: `components/design-system/search-list-card.tsx`

- Las acciones inline (`Agregar imagen`, `Agregar una descripción corta`) dejan de usar `Pressable` anidado dentro del contenedor principal clickable.
- Se reemplaza por superficie con manejo explícito de propagación para evitar `button` nested en RN Web.

Resultado: se evita el error de hidratación por `button` dentro de `button` y se mantiene la interacción contextual.

### 6) Fix picker de imagen (quick add)

Archivo: `components/explorar/MapScreenVNext.tsx`

- `launchImageLibraryAsync` migra a `mediaTypes: ImagePicker.MediaTypeOptions.Images`.
- Se estandariza uso de API tipada de Expo para reducir fallos de selección en web.

### 7) Visibilidad de spots Flowya sin filtro activo

Archivo: `components/explorar/MapScreenVNext.tsx`

- Regla `hideLinkedUnsaved` se restringe a filtros activos (`saved`/`visited`).
- En `all`, los spots Flowya `linked+unsaved` permanecen visibles (estado inactivo).

### 8) Mini-mapa de países (web): prevención de zoom accidental

Archivo: `components/explorar/CountriesMapPreview.web.tsx`

- Guardas UI para no perder contexto en navegador:
  - `touchAction: none`
  - `userSelect: none`
  - bloqueo de `ctrl+wheel` dentro del contenedor.

## Documentación actualizada

- `docs/ops/OPEN_LOOPS.md`
- `docs/ops/CURRENT_STATE.md`
- `docs/contracts/MAP_PINS_CONTRACT.md`
- `docs/contracts/explore/FILTER_RUNTIME_RULES.md`
- `docs/contracts/SEARCH_V2.md`
- `docs/ops/plans/PLAN_UX_MAPA_BUSCADOR_CONTADOR_DIARIO_2026-03-01.md` (nuevo)

## Sanidad local

- `npm run lint -- --no-cache` -> OK

Nota: `npx tsc --noEmit` reporta errores existentes en base (fuera del scope de este bloque), por lo que se usa lint como gate local de este ajuste.
