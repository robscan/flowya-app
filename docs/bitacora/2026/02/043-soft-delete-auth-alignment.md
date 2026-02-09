# Bitácora — Soft delete y alineación auth en runtime

**Fecha:** 2026-02-08  
**Tipo:** Fix crítico / Alineación UI ↔ RLS

---

## Bug detectado

En la UI ocurría el error:

> `new row violates row-level security policy for table "spots"`

El **UPDATE** `is_hidden = true` (soft delete) funciona en SQL manual. El fallo venía de la **UI**: el handler mutante se ejecutaba sin garantizar un usuario autenticado en runtime, o el estado de auth no estaba sincronizado en el momento del update, por lo que RLS rechazaba la operación.

## Causa raíz

Desfase **auth en runtime ↔ RLS**: el contrato en Supabase exige usuario autenticado para mutaciones; si el handler se ejecuta con sesión no resuelta o desactualizada, RLS rechaza y la UI podía no reflejar correctamente el error (o mostrar éxito falso).

## Decisión

1. **Soft delete (handleDeleteSpot)**  
   - Antes de mutar: `getUser()`; si no hay usuario → `openAuthModal` y `return` (no ejecutar update).  
   - Ejecutar `update({ is_hidden: true })`.  
   - Si `error`: `toast.show(error.message, { type: 'error' })`, no navegar.  
   - Solo si no hay error: toast de éxito y `router.back()`.  
   - Nunca mostrar éxito si hubo error RLS.

2. **Editar / Eliminar spot**  
   - Mantener estado `isAuthenticated` (getUser al montar + onAuthStateChange).  
   - Pasar `onEdit`, `onSaveEdit`, `onDeleteSpot` a SpotDetail solo cuando `isAuthenticated === true`.  
   - No renderizar botones mutantes sin auth.

3. **Guardar pin**  
   - El botón sigue visible para todos (CTA de conversión).  
   - Sin auth → abrir modal de login; no ejecutar mutación.  
   - Con auth → ejecutar mutación.  
   - No ocultar el botón por falta de auth.

4. **Feedback**  
   - Antes de enviar: si no hay usuario → `openAuthModal` y `return`.  
   - Solo enviar con auth válido.

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `app/spot/[id].web.tsx` | handleDeleteSpot: sin usuario → openAuthModal (en lugar de toast) y return; dependencia openAuthModal en useCallback. |
| `docs/bitacora/2026/02/043-soft-delete-auth-alignment.md` | Esta bitácora. |
| `docs/ops/CURRENT_STATE.md` | Confirmación de coherencia (alineación auth runtime, soft delete, Guardar pin CTA). |

## Validaciones

- Eliminar spot como usuario autenticado: `is_hidden` pasa a true, el spot desaparece del mapa, toast correcto.
- Usuario no autenticado: ve Guardar pin; al tocar → modal de login; no se ejecuta mutación.
- No existe `.delete()` sobre la tabla `spots` en el repo.
- No hay éxitos falsos en la UI.

---

*Documentación escrita por Cursor.*
