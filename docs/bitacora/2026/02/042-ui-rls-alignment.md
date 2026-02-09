# Bitácora — Alineación UI con contrato RLS

**Fecha:** 2026-02-08  
**Scope:** Seguridad / UX / Frontend

---

## Problema detectado

La UI permitía a usuarios **no autenticados**:

- Ver botones de editar y eliminar spot.
- Entrar a pantallas de edición.
- Ejecutar handlers mutantes (editar spot, eliminar spot, guardar pin, enviar feedback).

Consecuencias:

- Errores RLS silenciosos.
- Toasts de "éxito" falsos (la DB no cambiaba).
- Desalineación entre el contrato de Supabase (mutaciones solo authenticated) y el frontend.

---

## Causa raíz

Desalineación **UI ↔ RLS**: el frontend no respetaba el contrato ya definido en Supabase. RLS estaba correcto; la capa de presentación y la lógica de handlers no condicionaban acciones mutantes al estado de autenticación.

---

## Decisiones tomadas

1. **Bloqueo UX/UI**
   - Si el usuario no está autenticado, no se muestran botones de acción mutante (Editar, Eliminar spot, Guardar pin, Enviar feedback).
   - No se permite ejecutar handlers mutantes sin auth.
   - Se reutiliza el mismo modal de login existente (`openAuthModal({ message: AUTH_MODAL_MESSAGES.profile })`).
   - No se crean modales nuevos ni se duplica lógica de auth.

2. **Bloqueo lógico (defensivo)**
   - En handlers mutantes (handleSaveEdit, handleDeleteSpot): comprobación de auth al inicio; si no hay usuario, toast de error y return.
   - Si RLS falla (error de Supabase), se muestra el error real al usuario (toast), nunca éxito falso.

3. **Coherencia de eliminación**
   - Eliminación de spots = única vía válida: soft delete (`update({ is_hidden: true })`). No existe `DELETE` real sobre la tabla `spots` en la app.

4. **Documentación**
   - Regla global y soft delete quedan explícitos en DECISIONS.md.
   - CURRENT_STATE.md refleja la alineación con RLS y los riesgos aceptados (warnings Supabase).

---

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `app/spot/[id].web.tsx` | Estado `isAuthenticated` (getUser + onAuthStateChange). Pasar `onEdit`, `onSaveEdit`, `onDeleteSpot`, `onSavePin` solo si auth. Defensiva y toast error en `handleSaveEdit` y `handleDeleteSpot`. |
| `components/design-system/spot-detail.tsx` | `onEdit` opcional; botón Editar solo cuando `onEdit` está definido. |
| `app/(tabs)/index.web.tsx` | `onSavePin={isAuthUser ? () => handleSavePin(selectedSpot) : undefined}` en SpotCard. |
| `components/ui/flowya-beta-modal.tsx` | Antes de enviar feedback: si no hay usuario, abrir modal de login y no llamar a la API. |
| `docs/ops/DECISIONS.md` | Nueva decisión: mutaciones requieren auth; soft delete; lectura pública; precisión sobre warnings Supabase (auth_allow_anonymous_sign_ins). |
| `docs/ops/CURRENT_STATE.md` | Párrafo de alineación UI–RLS, estado de seguridad, riesgos aceptados. |

---

## Verificación

- No existe `.delete()` activo sobre la tabla `spots` (solo sobre `pins` para quitar pin, y `map.delete` en cache).
- Usuarios no autenticados no ejecutan mutaciones; la UI oculta acciones mutantes.
- Errores RLS se muestran al usuario (toast error), no se silencian ni se muestra éxito falso.

---

*Documentación escrita por Cursor en ejecución del plan de alineación UI ↔ RLS.*
