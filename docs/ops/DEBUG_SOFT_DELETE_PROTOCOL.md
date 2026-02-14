# Protocolo de prueba: Soft delete (Eliminar spot) en web

**Objetivo:** Diagnosticar con evidencia por qué el UPDATE `is_hidden=true` no se ejecuta o no se aplica en Supabase cuando se elimina desde la UI, aun cuando `refreshSession` reporta `hasSession: true`.

---

## Paso A — Confirmar si hay request real (Network)

1. Abrir DevTools → pestaña **Network**.
2. Activar **Preserve log**.
3. Filtrar por `rest/v1/spots` o por el dominio de Supabase.
4. Ejecutar flujo: **Editar spot** → **Eliminar** → **Confirmar**.

**Resultado esperado:**

- Debe aparecer un **PATCH** (o POST) contra `.../rest/v1/spots?id=eq.<spotId>` o similar.
- Revisar **Request Headers**: `Authorization: Bearer ...`.
- Anotar **status code** y **response body** si existe.

**Interpretación:**

- Si **NO** hay request en Network → el update no se está ejecutando o se usa otro fetch/cliente.

---

## Paso B — Instrumentación DEV-only: Flight Recorder del soft-delete

Checkpoints en el handler (solo `__DEV__`):

| Checkpoint | Descripción |
|------------|-------------|
| **[SD-00]** | Antes de `refreshSession`: spotId, path actual, supabaseUrl (longitud), clientTag `editSpotWeb`. |
| **[SD-10]** | Después de `refreshSession`: hasSession, refreshError, longitud de `access_token` (getSession). |
| **[SD-15]** | Después de `setSession` (si se llamó). |
| **[SD-20]** | Justo antes del update: "ABOUT TO UPDATE", payload `{ is_hidden, updated_at }`. |
| **[SD-30]** | Resultado del update: error (message/code/details), data (id, is_hidden). |
| **[SD-EX]** | Cualquier excepción en try/catch (getUser, refreshSession, setSession, update, outer). |

Los logs se envían a consola y, si está configurado, al ingest de debug (NDJSON).  
**Crítico:** El update está en `await` y todo el handler está en try/catch que loguea [SD-EX].

---

## Paso C — Interceptor de fetch (DEV, web)

- Se parchea `globalThis.fetch` solo en `__DEV__` y en web.
- Para URLs que contengan `supabase` o `rest/v1/` (excluyendo el endpoint de debug):
  - Se loguea: **método**, **path** (resumido), **hasAuth** (boolean), **authLength**.
  - Al resolver la respuesta: **status**, **statusText**.
- Permite comprobar si el request sale y si lleva Authorization, sin depender solo de supabase-js.

---

## Paso D — Matriz de diagnóstico (decisión por evidencia)

| Observación | Conclusión | Acción |
|-------------|------------|--------|
| No hay request en Network | El handler no llega al update (early return, error silencioso, modal cierra, navegación interrumpe). | Revisar logs [SD-00]…[SD-20]; localizar la salida temprana. |
| Hay request pero **sin** Authorization | El update sale como anónimo (JWT no adjunto) → 401/403 probable. | Otro cliente sin sesión o storage; unificar cliente / asegurar persistencia de sesión en web. |
| Request **con** Authorization y respuesta 401/403 | RLS/claims/policies. | Revisar RLS de UPDATE en `spots` y que el token sea de rol `authenticated`. |
| Respuesta 200/204 OK pero la DB no cambia | Query mal formado (id equivocado), o `eq("id", spotId)` no se aplica. | Loggear URL final y filtro; confirmar que spotId coincide. |

---

## Hipótesis probadas por la instrumentación

- **H1:** `setSession()` cuelga o no termina → no llegamos a [SD-15] ni [SD-20].
- **H2:** Alguna excepción no capturada (getUser, refreshSession, setSession) → ver [SD-EX].
- **H3:** El request sale sin Authorization o con status 401/403 → ver [SD-FETCH] request/response.
- **H4:** Dos instancias de cliente Supabase (una sin sesión) → un solo cliente en `lib/supabase.ts`; el tag `editSpotWeb` identifica uso desde esta pantalla.
- **H5:** Algo externo cancela el flujo (unmount, navegación) → [SD-EX] outer catch o ausencia de [SD-30].

---

## Solución adoptada: RPC hide_spot (migración 014)

Si las políticas RLS de UPDATE en `spots` bloquean el soft delete (403 "new row violates row-level security policy"), la app usa la función **hide_spot** en lugar del UPDATE directo:

- **Migración 014** (`014_spots_hide_spot_rpc.sql`): crea `public.hide_spot(p_spot_id uuid)` con SECURITY DEFINER, que hace `UPDATE spots SET is_hidden = true, updated_at = now() WHERE id = p_spot_id` en el servidor (sin depender de RLS en la tabla). Solo el rol `authenticated` puede ejecutarla.
- La pantalla de edición llama `supabase.rpc('hide_spot', { p_spot_id: spotId })` en lugar de `supabase.from('spots').update(...)`.

**Aplicar:** Ejecutar en Supabase SQL Editor el contenido de `supabase/migrations/014_spots_hide_spot_rpc.sql`.

---

## Cómo reproducir

1. Asegurar que la app web está en modo desarrollo (`__DEV__`).
2. Opcional: borrar `.cursor/debug.log` para una corrida limpia.
3. Ir a un spot → **Editar** → **Eliminar spot** → **Confirmar**.
4. Revisar consola (y, si aplica, `.cursor/debug.log`) para [SD-00], [SD-10], [SD-15], [SD-20], [SD-30], [SD-EX] y [SD-FETCH].
5. Revisar Network: presencia de PATCH a `rest/v1/spots`, headers y status.
