# Bitácora 014 — Scope D: Persistencia y visualización de pins por usuario

## Objetivo

Permitir que un usuario guarde un spot como pin, cambie su estado (to_visit / visited) y vea el estado reflejado de forma consistente en SpotCard, SpotDetail y mapa. Persistencia en Supabase, sin romper flujos existentes, consola limpia.

## Archivos tocados

### Nuevos

- **supabase/migrations/006_pins_unique_rls.sql** — Índice único `(user_id, spot_id)` en `pins`, RLS habilitado, políticas SELECT/INSERT/UPDATE propias (`auth.uid() = user_id`).
- **lib/pins.ts** — API de pins: `getCurrentUserId()`, `getPin(spotId)`, `getPinsForSpots(spotIds)`, `setPinStatus(spotId, status)`, `nextPinStatus(current)`.

### Modificados

- **app/_layout.tsx** — Hook `useAnonymousSession()`: si no hay sesión, `signInAnonymously()` para tener `user_id` estable por dispositivo (Scope D, sin auth complejo).
- **app/(tabs)/index.web.tsx** — `refetchSpots`: tras cargar spots, carga pins del usuario y fusiona `pinStatus` en cada spot. `handleSavePin(spot)`: `setPinStatus(spot.id, nextPinStatus)`, actualiza estado local (spots y selectedSpot). SpotCard recibe `onSavePin={() => handleSavePin(selectedSpot)}`.
- **app/spot/[id].web.tsx** — Al cargar spot, se carga también `getPin(id)` y se asigna `pinStatus` al spot. `handleSavePin`: persiste con `setPinStatus` y actualiza `spot` con el nuevo estado. SpotDetail recibe `onSavePin={handleSavePin}`.
- **app/design-system.web.tsx** — Subsección "Botón de pin (Scope D)": documentación de estados (idle / toVisit / visited) y uso del color; ejemplos ya existentes (default, toVisit, visited).

## Decisiones

- **Auth**: Sesión anónima al arranque (`signInAnonymously`) para tener un `user_id` estable por dispositivo. No hay login UI ni auth complejo; RLS en `pins` usa `auth.uid()`.
- **Un pin por (user_id, spot_id)**: Índice único y upsert con `onConflict: ['user_id', 'spot_id']` para evitar duplicados.
- **Transición de estado**: Sin pin → crear con `to_visit`. Con `to_visit` → cambiar a `visited`. Con `visited` → toggle a `to_visit` (ciclo completo).
- **Errores**: Si `setPinStatus` falla, se devuelve `null` y la pantalla mantiene el estado previo; no se muestran mensajes técnicos ni se rompe la UI.
- **Carga**: Mapa y Spot detail cargan pins junto con los datos del spot para estado inicial consistente y sin flicker.

## Design System

- Botón de pin: mismo icono (Pin). Estados por color: idle = neutral, toVisit = `stateToVisit`, visited = `stateSuccess`. La lógica de transición se maneja en pantalla; el componente solo representa el estado recibido.
- Map pins (MapPinSpot): ya soportaban `status` default / to_visit / visited; solo se alimentan con `pinStatus` cargado desde `pins`.

## Requisito de Supabase

- En el proyecto Supabase, habilitar **Auth → Providers → Anonymous sign-ins** para que `signInAnonymously()` funcione.

## Pendientes (scopes futuros)

- Listas avanzadas, filtros, social, analytics: no incluidos en Scope D.
- Posible extensión: eliminar pin (quitar relación) en lugar de solo cambiar estado.

## Criterio de cierre

- El usuario puede guardar un spot como pin.
- El estado se persiste correctamente en `pins`.
- El estado se ve igual en mapa, card y detail.
- No hay duplicados (un pin por user_id + spot_id).
- UI consistente con el Design System.
- Consola limpia (cero errores/warnings persistentes).
