# Bitácora — P0 Soft delete RLS: diagnóstico y fix

**Fecha:** 2026-02-14  
**Tipo:** P0 / Diagnóstico + Fix

---

## Problema

Al pulsar "Eliminar Spot" (soft delete con `spots.is_hidden = true`) aparece:

> "new row violates row-level security policy for table spots"

Contexto confirmado: el flujo usa solo UPDATE; en Supabase hay políticas permisivas (USING true / WITH CHECK true) para UPDATE; se probó permitir UPDATE a public y el error persistió.

---

## 1) Tres hipótesis (orden por probabilidad)

### H1 — JWT no se adjunta al request (más probable)

- **Idea:** El cliente Supabase usa la anon key y la sesión en memoria/storage puede no estar sincronizada con el request que hace `.update()`; PostgREST recibe la petición sin `Authorization: Bearer <jwt>` y la evalúa como anónimo. Si en BD hay (o hubo) políticas que distinguen `authenticated` vs anónimo, o si el rol efectivo es anónimo, RLS puede fallar.
- **Evidencia en repo:** [lib/supabase.ts](lib/supabase.ts): un solo `createClient(url, anonKey)`. [app/spot/[id].web.tsx](app/spot/[id].web.tsx): se llamaba `getSession()` antes del update pero no se re-aplicaba la sesión al cliente; el siguiente `.update()` podría usar estado desactualizado.

### H2 — Políticas en BD distintas a las del repo

- **Idea:** En el proyecto Supabase real las políticas de `spots` no coinciden con 008/010 (migraciones no aplicadas, políticas manuales restrictivas, o otra política que exige p. ej. `auth.uid() = user_id`). El WITH CHECK del UPDATE falla sobre la fila nueva.
- **Evidencia en repo:** [supabase/migrations/008_spots_rls_select.sql](supabase/migrations/008_spots_rls_select.sql) y [010_spots_update_authenticated_soft_delete.sql](../../../supabase/migrations/010_spots_update_authenticated_soft_delete.sql) definen UPDATE permisivo; si el error persiste con “UPDATE a public”, podría haber políticas adicionales en BD no versionadas en el repo.

### H3 — Request interpretado como INSERT o trigger que inserta

- **Idea:** PostgREST recibe INSERT en lugar de PATCH, o un trigger ON UPDATE en `spots` hace INSERT en otra tabla (o en `spots`) y falla RLS ahí.
- **Evidencia en repo:** No hay triggers en migraciones sobre `spots`. El flujo solo llama `.update()` en [app/spot/[id].web.tsx](app/spot/[id].web.tsx) (handleDeleteSpot). Menos probable si el mensaje dice explícitamente "table spots".

---

## 2) Plan de diagnóstico (solo cambios en repo)

1. **Comprobar sesión antes del UPDATE:** Tras `getSession()`, log en `__DEV__` de `hasSession`, `userId`, `spotId` y payload. Así se verifica que hay sesión y qué se envía.
2. **Registrar error completo en fallo:** En `__DEV__`, si el update falla, log de `error.message`, `error.code` y `error.details` para distinguir RLS de otros errores y ver si hay pista de INSERT vs UPDATE.
3. **Forzar uso del JWT en el siguiente request:** Llamar a `setSession({ access_token, refresh_token })` después de `getSession()` para que el cliente Supabase use explícitamente esa sesión en el `.update()` siguiente (verificación implícita: si el fix resuelve el error, refuerza H1).

---

## 3) Verificaciones ejecutadas en el repo

- Se añadieron logs temporales en `handleDeleteSpot` (solo en `__DEV__`): antes del update se loguea sesión, userId, spotId y payload; en error se loguea message, code y details.
- Se implementó el fix mínimo: después de `getSession()`, si hay sesión se llama a `setSession()` con los mismos tokens; el payload del update se limita a `{ is_hidden: true, updated_at }` en la variable `softDeletePayload`.

**Conclusión:** La hipótesis que se trata como causa raíz es **H1** (JWT no garantizado en el request). El fix aplicado asegura que el cliente use la sesión actual en el siguiente `.update()`, sin cambiar UX ni navegación.

---

## 4) Fix mínimo implementado

- **Archivo:** [app/spot/[id].web.tsx](app/spot/[id].web.tsx), función `handleDeleteSpot`.
- **Cambios:**
  - Tras `getUser()` y `getSession()`, si existe `session` se llama a `supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token ?? '' })` para que el siguiente `.update()` vaya con JWT.
  - Payload de soft delete acotado a `softDeletePayload = { is_hidden: true, updated_at }` y usado en `.update(softDeletePayload).eq('id', spot.id)`.
  - Logs de diagnóstico en `__DEV__` (antes del update y en error) para poder confirmar causa y quitar después.

---

## 5) Causa raíz (conclusión)

**Causa raíz asumida:** El request de UPDATE a `spots` no llevaba de forma fiable el JWT en el header (sesión no re-aplicada al cliente antes del update), por lo que RLS evaluaba la operación con rol/contexto incorrecto y devolvía "new row violates row-level security policy for table spots".

**Fix:** Re-aplicar la sesión con `setSession()` antes del `.update()` y restringir el payload a `is_hidden` y `updated_at`.

---

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| [app/spot/[id].web.tsx](app/spot/[id].web.tsx) | handleDeleteSpot: setSession tras getSession; payload en softDeletePayload; logs en __DEV__. |
| [docs/bitacora/2026/02/047-p0-soft-delete-rls-diagnostico-fix.md](docs/bitacora/2026/02/047-p0-soft-delete-rls-diagnostico-fix.md) | Esta bitácora. |

---

## Checklist manual (5 pasos)

1. **Ejecutar la app en desarrollo** y reproducir: usuario autenticado → detalle de un spot → "Eliminar Spot" → confirmar. Comprobar que no aparece el error RLS y que se muestra el toast de éxito y se navega atrás.
2. **Revisar consola (solo en __DEV__):** Ver el log `[soft-delete] before update` y confirmar que `hasSession === true` y que `userId` y `spotId` son los esperados. Si el update falla, revisar `[soft-delete] update failed` (code/details).
3. **Comprobar en Supabase:** En la tabla `spots`, el registro del spot debe seguir existiendo con `is_hidden = true` y `updated_at` actualizado; no debe haberse borrado la fila.
4. **Regresión:** Probar crear spot, editar spot y cambiar portada; deben seguir funcionando igual.
5. **Limpieza opcional:** Cuando el fix esté validado en producción, se pueden eliminar los bloques `if (__DEV__) { console.warn(...) }` de handleDeleteSpot.
