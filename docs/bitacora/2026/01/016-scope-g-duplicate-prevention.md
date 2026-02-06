# Bitácora 016 — Scope G: Prevención de duplicados al crear spots

## Objetivo

Evitar la creación de spots duplicados cuando el nombre es el mismo (normalizado) y la ubicación está cerca (radio configurable). Mostrar una alerta suave y no crear el spot. Incremental, sin romper flujos y con consola limpia.

## Regla de duplicado (congelada)

Un spot se considera duplicado si:

- **Título normalizado** coincide: case-insensitive, trim, sin acentos, espacios internos colapsados.
- **Distancia** entre coordenadas está dentro del radio (default **100 m**).

## Archivos tocados

### Nuevos

- **lib/spot-duplicate-check.ts** — `normalizeSpotTitle(title)`: lowercase, trim, NFD + quitar diacríticos, colapsar espacios. `checkDuplicateSpot(title, lat, lng, radiusMeters?)`: consulta por bbox (lat/lng ± delta), filtra por haversine ≤ radio y título normalizado; devuelve `{ duplicate: false }` o `{ duplicate: true, existingTitle }`. Fail-open: si la consulta falla, devuelve `{ duplicate: false }`.
- **docs/bitacora/2026/01/016-scope-g-duplicate-prevention.md** — Esta bitácora.

### Modificados

- **app/create-spot/index.web.tsx** — Antes del INSERT: `checkDuplicateSpot(titleToUse, location.latitude, location.longitude)`. Si `duplicate: true`, se muestra `Alert.alert` con título "Spot muy parecido", mensaje explicativo y botones: Cancelar, Cambiar nombre (setStep(2)), Mover ubicación (setStep(1)). No se inserta.
- **app/design-system.web.tsx** — Nueva sección "Alerta suave (Scope G)": patrón de mensaje claro, opciones Cancelar / Cambiar nombre / Mover ubicación, ejemplo de copy. En Map pins y MapLocationPicker: documentación de jerarquía visual Create Spot (MapPinCreating / MapPinExisting).
- **lib/spot-duplicate-check.ts** — Añadido `getSpotsNearby(lat, lng, radiusMeters?)`: devuelve spots existentes dentro del radio (para visualización en Create Spot). Tipo exportado `SpotNearby`.
- **components/design-system/map-pins.tsx** — Nuevos componentes **MapPinCreating** (primary, 20px, foco principal) y **MapPinExisting** (secondary, 10px, tenue). Exportados en MAP_PIN_SIZES.
- **components/design-system/map-location-picker.tsx** — Al tener ubicación seleccionada (`lngLat`): carga `getSpotsNearby(lat, lng)` y muestra (1) markers de spots existentes con MapPinExisting, (2) marker de la ubicación seleccionada con MapPinCreating (renderizado después para quedar encima).
- **components/design-system/index.ts** — Export de MapPinCreating y MapPinExisting.

## Decisiones

- **Radio elegido**: 100 m por defecto (`DEFAULT_DUPLICATE_RADIUS_METERS`). Configurable en la llamada a `checkDuplicateSpot`.
- **Consulta**: Sin índices nuevos. Se usa bbox (lat/lng ± delta con delta ≈ radio/111320 grados) para limitar filas; luego filtro en cliente con haversine y título normalizado.
- **Fail-open**: Si la consulta a Supabase falla (red, etc.), se permite la creación para no bloquear el flujo.
- **UX**: Alert nativo (Alert.alert) con copy humano: "Spot muy parecido", mensaje que cita el nombre existente y ofrece "Cambiar nombre" o "Mover ubicación". No errores técnicos ni bloqueos silenciosos.
- **Solo Create Spot**: No se aplica en Edit Spot, Share ni Pins.

## Implementación técnica

- **Normalización**: `normalizeSpotTitle` usa `String.prototype.normalize('NFD')` y elimina caracteres diacríticos (Unicode), luego toLowerCase y colapso de espacios. Reutilizable.
- **Distancia**: Haversine en JS con radio terrestre 6_371_000 m. Bbox delta = `radiusMeters * 2 / 111320` para no traer de más.
- **No migraciones**: Sin índices espaciales ni cambios en la DB; consulta con `.gte`/`.lte` en lat/lng.

## Restricciones respetadas

- NO crear índices nuevos.
- NO migraciones DB complejas.
- NO RLS adicional.
- NO bloquear Edit Spot.

## Prevención visual (Scope G — capa en Create Spot)

- **MapLocationPicker** muestra en el mapa: (A) ubicación seleccionada por el usuario (spot en creación) con **MapPinCreating** (color primary, 20px, foco principal, siempre encima); (B) spots existentes cercanos con **MapPinExisting** (color secondary, 10px, tono tenue).
- Datos: **getSpotsNearby(lat, lng)** en `lib/spot-duplicate-check.ts` — misma lógica por bbox + haversine, radio 1.5× el de duplicados (~150 m) para contexto. Solo visualización; no cambia reglas de duplicado ni bloquea creación.
- Design System: documentada la jerarquía visual (spot en creación vs existentes) y los componentes MapPinCreating / MapPinExisting.

## Pendientes (scopes futuros)

- Índice espacial (PostGIS, GiST) para consultas por proximidad más eficientes si la tabla crece.
- Posible ajuste de radio por tipo de lugar o por usuario.

## Criterio de cierre

- No se crean duplicados evidentes (mismo nombre normalizado + misma zona).
- El usuario entiende por qué no se crea (mensaje claro).
- Puede corregir sin frustración (Cambiar nombre o Mover ubicación).
- Consola limpia.
