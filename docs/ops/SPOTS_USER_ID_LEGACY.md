# Spots: user_id y compatibilidad legacy

**Fecha:** 2026-02-14

## Objetivo

- A partir de ahora, los **nuevos** spots tienen `user_id` asignado (creador autenticado).
- Los spots **legacy** con `user_id` NULL no se migran; siguen siendo editables/eliminables por cualquier usuario autenticado vía soft delete.

## Mecanismos

1. **Trigger `spots_set_user_id_trigger`** (migración 012)  
   - `BEFORE INSERT ON spots`: si `NEW.user_id` es NULL y `auth.uid()` no es NULL, asigna `NEW.user_id := auth.uid()`.  
   - Garantiza que en BD los inserts con sesión autenticada tengan siempre `user_id`.

2. **Cliente**  
   - Create Spot (pantalla dedicada) y creación desde borrador en mapa envían `user_id` cuando hay usuario autenticado.  
   - Si no se envía, el trigger lo rellena en el servidor.

3. **RLS**  
   - **UPDATE:** La política `spots_update_authenticated` (010) permite a cualquier usuario autenticado hacer UPDATE (p. ej. `is_hidden = true`) sobre **cualquier** fila, incluida con `user_id` NULL.  
   - No se exige `auth.uid() = user_id` para el soft delete; así los spots legacy sin dueño siguen siendo eliminables por quien esté logueado.

4. **INSERT**  
   - No se cambia la política actual (`spots_insert_all` con `WITH CHECK (true)`).  
   - Opcional a futuro: restringir INSERT a `authenticated` y `WITH CHECK (user_id = auth.uid())` cuando todo el flujo de creación pase por auth.

## Estrategia mínima legacy

- **No** se hace UPDATE masivo para rellenar `user_id` en filas existentes (evitar cambiar “ownership”).
- **Sí** se permite soft delete (UPDATE `is_hidden`) a cualquier usuario autenticado sobre cualquier spot (010).
- Los listados públicos filtran `is_hidden = false`; los spots ocultos dejan de aparecer en mapa/búsqueda/pins.

## Cómo probar

- Crear spot nuevo (auth) → en Supabase la fila debe tener `user_id` = tu `auth.uid()`.
- Eliminar spot (auth) → UPDATE `is_hidden = true` debe aplicarse; el spot desaparece de listados.
- Spots legacy con `user_id` NULL → mismo flujo de eliminación; no debe fallar RLS si 010 está aplicada.
