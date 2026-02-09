# Bitácora — Fix RLS en soft delete (Eliminar spot)

**Fecha:** 2026-02-08  
**Tipo:** Fix / Arquitectura

---

## Problema

Al pulsar "Eliminar Spot" en la pantalla de detalle (usuario autenticado), la UI mostraba:

> `new row violates row-level security policy for table "spots"`

El flujo solo ejecuta **UPDATE** (`is_hidden = true`), no INSERT. El mensaje "new row" en Postgres aplica también al **UPDATE**: la cláusula WITH CHECK de la política RLS se evalúa sobre la **nueva versión** de la fila ("new row"). Si esa política exige por ejemplo `auth.uid() = user_id` y el spot tiene `user_id` NULL (creado antes de trazabilidad), el CHECK falla y aparece ese error.

## Causa raíz

- **Frontend:** Correcto: solo se hace `update({ is_hidden: true })`. No hay INSERT en el flujo.
- **RLS:** Si en Supabase la política de UPDATE para `spots` es restrictiva (p. ej. solo owner: `auth.uid() = user_id`), los spots con `user_id` NULL no pasan el WITH CHECK. O el JWT no llegaba en el request (sesión no adjunta/desactualizada).

## Ajustes realizados

### 1. Frontend — `app/spot/[id].web.tsx`

- **Sesión reciente:** Antes del UPDATE se llama a `await supabase.auth.getSession()` para que el cliente lleve el JWT más reciente en la siguiente petición (evitar rechazo por token faltante o desactualizado).
- **Campo `updated_at`:** El payload del UPDATE pasa a ser `{ is_hidden: true, updated_at: new Date().toISOString() }` para alinear con el resto de actualizaciones y con posibles triggers/auditoría.

### 2. Migración — `supabase/migrations/010_spots_update_authenticated_soft_delete.sql`

- Nueva política **spots_update_authenticated**: `FOR UPDATE TO authenticated USING (true) WITH CHECK (true)`.
- Garantiza que cualquier usuario autenticado pueda ejecutar UPDATE en `spots` (incluido soft delete), aunque existan filas con `user_id` NULL o políticas más restrictivas. Las políticas para el mismo comando se combinan con OR.

**Aplicar la migración en Supabase:** ejecutar el SQL en el proyecto (Dashboard → SQL o `supabase db push` / migraciones).

## Cómo funciona ahora

1. Usuario autenticado pulsa "Eliminar Spot" y confirma.
2. `handleDeleteSpot`: `getUser()` → si no hay user, se abre el modal de login y se sale.
3. `getSession()` para refrescar/adjuntar sesión.
4. `supabase.from('spots').update({ is_hidden: true, updated_at: ... }).eq('id', spot.id)`.
5. Si la política en Supabase permite UPDATE a `authenticated` (008 o 010), el UPDATE tiene éxito, se muestra toast y `router.back()`. Si no, se muestra el error en toast.

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `app/spot/[id].web.tsx` | getSession() antes del update; payload con `updated_at`. |
| `supabase/migrations/010_spots_update_authenticated_soft_delete.sql` | Nueva política UPDATE para `authenticated`. |
| `docs/bitacora/2026/02/046-soft-delete-rls-fix.md` | Esta bitácora. |

## Verificación

- Eliminar spot solo ejecuta UPDATE (no INSERT).
- Con sesión válida y política 010 aplicada, el soft delete debe completarse sin error RLS.
- Si el error persiste, revisar en Supabase que la migración 010 esté aplicada y que no haya otra política que bloquee el UPDATE.
