# Bitácora: Dirección persistente en Spot

**Fecha:** 2026-02-01

## Objetivo

- Evitar llamadas repetidas a reverse geocoding.
- Guardar una dirección completa y usable por humanos en `spots.address`.

## Cambios realizados

### 1. Base de datos

- **Migración:** `supabase/migrations/002_add_spots_address.sql`
- Añade a `spots`: `address TEXT` (nullable).
- Idempotente: `ADD COLUMN IF NOT EXISTS`.

### 2. Resolución de dirección

- **Lib:** `lib/mapbox-geocoding.ts`
- `resolveAddress(latitude, longitude)` → `Promise<string | null>`.
- Usa Mapbox Geocoding v6 Reverse: `GET https://api.mapbox.com/search/geocode/v6/reverse`.
- Token: `EXPO_PUBLIC_MAPBOX_TOKEN`.
- Formato: usa `full_address` si existe; si no, concatena `name` + `", "` + `place_formatted` (equivalente a Calle + número, CP Ciudad, Estado, País cuando los datos existen).
- Si no hay resultado o hay error, devuelve `null`.

**Uso:** Llamar **solo al crear un spot** (una vez por spot). No llamar al abrir Spot Detail ni al consultar.

### 3. Persistencia

- Al crear un spot (flujo futuro): llamar `resolveAddress(lat, lng)` una vez y guardar el string en `spots.address`.
- Si `resolveAddress` devuelve `null`, guardar `address = null`.
- No recalcular direcciones existentes.

### 4. Visualización (Spot Detail)

- La pantalla ya incluye `address` en el `select` de Supabase.
- Se muestra la sección "Ubicación" solo si `spot.address` existe.
- No se muestran latitud ni longitud al usuario.
- Si `address` es null, la sección "Ubicación" no se renderiza.

### 5. Reglas respetadas

- No se hace reverse geocoding al abrir Spot Detail.
- No se recalculan direcciones existentes.
- Solo se guarda un string; sin estructuras complejas.
- Diseño minimalista sin cambios.

## Integración futura: crear spot

Cuando exista el flujo de creación de spot:

1. Obtener coordenadas (ej. del mapa o formulario).
2. `const address = await resolveAddress(latitude, longitude);`
3. Insertar en `spots` incluyendo `address` (o `null` si la resolución falló).
