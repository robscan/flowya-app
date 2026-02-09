# CURRENT_STATE — Flowya (operativo)

> Fuente de verdad del estado actual del proyecto.
> Snapshot operativo + memoria resumida.
> No es backlog ni planeación.
>
> 🔒 Regla: ningún chat/sprint se considera cerrado si este archivo no se actualiza.

---

## Ahora mismo

- **Scope activo:** ninguno (baseline estable).
- **Branch activa:** `main`.
- **Estado del repo:** `main` protegido, limpio y sincronizado.
- **Entorno:** Web mobile (Explore público).

---

## Sólido

- Explore (map-first) es público y estable.
- RLS activo en `spots`.
- Policies vigentes:
  - **SELECT:** público (`is_hidden = false`)
  - **INSERT:** solo usuarios autenticados
  - **UPDATE:** solo usuarios autenticados
  - **DELETE físico:** deshabilitado
- Soft delete activo vía `is_hidden`.
- Trazabilidad de creación:
  - `spots.user_id` existe
  - Los INSERTs envían `user_id = auth.uid()` desde la app
- UX de creación protegida:
  - Usuarios no autenticados **no acceden** al wizard
  - Se reutiliza el modal de login existente
  - No aparecen errores técnicos de RLS en UI
- **Alineación UI ↔ RLS (2026-02-08):**
  - Usuarios no autenticados **no ejecutan mutaciones**: la UI oculta Editar y Eliminar spot cuando no hay auth; Feedback exige auth antes de enviar.
  - **Guardar pin** permanece visible como CTA de conversión: sin auth abre modal de login; con auth ejecuta mutación. No se oculta por falta de auth.
  - Handlers mutantes comprueban auth en runtime (getUser antes de mutar); sin usuario → openAuthModal y return. Errores RLS se muestran (toast), no hay éxito falso.
  - Eliminación de spots = solo soft delete (`is_hidden = true`); no hay `DELETE` real sobre `spots`. Soft delete funciona con auth válido.
- Sistema retomable sin memoria de chat.
- Reglas de cierre y ejecución formalizadas.
- **Riesgos aceptados:** Supabase Database Advisor muestra WARN por SELECT públicos (p. ej. auth_allow_anonymous_sign_ins). En FLOWYA es decisión de producto (explore/sharing); no implica mutaciones abiertas. Ver DECISIONS.md. No modificar políticas para “corregir” warnings sin decisión explícita.

---

## Frágil / Atención

- Ownership **no enforceado** en DB (decisión consciente).
- Soft delete **solo reversible desde Supabase** (no desde UI).
- No hay panel de moderación (fuera de alcance actual).

---

## Historial relevante (memoria resumida)

- **OL-007 — RLS en `spots` (DONE)**
  - Eliminada escritura anónima.
  - SELECT público mantiene Explore.
  - DELETE físico deshabilitado.

- **Trazabilidad de spots (DONE)**
  - `user_id` agregado y poblado.
  - INSERTs envían `user_id` desde la app.

- **OL-009 — UX Auth Gate en creación de spots (DONE)**
  - Bloqueo en entry points (search, mapa).
  - Bloqueo al montar `/create-spot`.
  - Reutilización del modal de login existente.
  - Eliminado error técnico de RLS en UX.

- **Alineación UI ↔ RLS (DONE, 2026-02-08)**
  - Editar / Eliminar spot ocultos sin auth; Feedback solo con auth. Guardar pin visible siempre (CTA; sin auth → modal login).
  - Comprobaciones defensivas en runtime (getUser antes de mutar); sin usuario → openAuthModal. Toast de error ante fallo RLS; nunca éxito falso.
  - Soft delete como única vía de eliminación de spots; handleDeleteSpot abre modal si no auth.
  - Bitácoras: `042-ui-rls-alignment.md`, `043-pin-cta-publico.md`, `043-soft-delete-auth-alignment.md`.

---

## Guardrails activos

- `main` protegido: NO direct commit / NO direct push.
- Todo cambio va por **rama + PR** (incluido docs-only).
- `OPEN_LOOPS.md` solo se entrega cuando define alcance diario.
- No abrir Flow ni Recordar completos sin decisión explícita.
- Seguridad primero; UX después, sin romper Explore.

---

## Next step sugerido (no obligatorio)

- UX copy: mensaje humano previo al login (“Inicia sesión para crear spots”).
- Definir heurísticas simples de spam (volumen por `user_id`).
- Continuar con flows / producto.
