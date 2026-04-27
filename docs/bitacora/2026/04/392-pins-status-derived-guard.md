# 392 — Pins status derived guard

Fecha: 2026-04-26

## Cambio

- Se cerró la decisión de `pins.status`: queda como campo legacy derivado.
- La fuente de verdad V1 es `pins.saved` + `pins.visited`.
- Los estados V1 son exclusivos: `visited=true` implica `saved=false`.
- Se normalizó el runtime con `normalizePinState()`.
- Se preparó la migración `037_pins_status_derived_guard.sql` para Supabase.

## Evidencia

Consulta remota 2026-04-26:

- `to_visit`: 69 filas con `saved=true`, `visited=false`.
- `visited`: 156 filas con `saved=false`, `visited=true`.
- No se observaron combinaciones inconsistentes.

## Migración preparada

`supabase/migrations/037_pins_status_derived_guard.sql`:

- crea respaldo de filas potencialmente inconsistentes;
- crea trigger `pins_status_derived_guard`;
- deriva `status` desde `saved`/`visited`;
- acepta escrituras legacy que manden solo `status`;
- rechaza filas sin `saved=true` ni `visited=true`;
- no cambia RLS y no elimina datos.

## Aplicación remota

El usuario aplicó `037` manualmente en Supabase SQL Editor.

Verificación recibida:

- `pins_status_derived_guard`: `tgenabled=O`.
- `drift_rows=0`.

## Criterio

No conviene borrar `status` antes de V1 porque todavía existen consumidores legacy (`getPin`, `setPinStatus`, `ACTIVITY_SUMMARY`). El cierre seguro es mantenerlo como compatibilidad derivada y blindar drift en DB.

## Pendiente

- Retirar `getPin`/`setPinStatus` cuando se apague SpotDetail legacy.
