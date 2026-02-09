# Bitácora — UX Auth Gate en creación de spots

**Fecha:** 2026-02-08  
**Scope:** UX / Auth  
**Loop cerrado:** OL-009

---

## Contexto

Usuarios no autenticados podían recorrer todo el wizard de creación de spots
y encontrarse al final con un error técnico de RLS:

> `new row violates row-level security policy for table "spots"`

La seguridad era correcta (RLS), pero la experiencia era incorrecta.

---

## Objetivo

- Evitar que usuarios NO autenticados avancen en el flujo de creación.
- Reutilizar el modal de login existente (botón de perfil).
- Eliminar errores técnicos de backend visibles en UX.
- No tocar DB, RLS, SQL ni arquitectura.

---

## Implementación

### Estrategia

Defensa en dos capas:

1. **Entry points**
   - Search CTA “Crear nuevo spot”
   - Long-press en mapa (con y sin confirmación)
   - Antes de navegar a `/create-spot`, se verifica auth.
   - Si no hay usuario → se abre modal de login y no se navega.

2. **Pantalla `/create-spot`**
   - Al montar, se verifica auth.
   - Si no hay usuario:
     - se abre modal de login
     - no se renderiza el wizard
   - Suscripción a `onAuthStateChange`:
     - al hacer login → se habilita el wizard sin recargar.

---

## Archivos modificados

- `/Users/apple-1/flowya-app/app/(tabs)/index.web.tsx`
- `/Users/apple-1/flowya-app/app/create-spot/index.web.tsx`

---

## Verificación manual

- Usuario NO autenticado:
  - Intentar crear spot desde search, mapa o URL directa
  - Resultado: modal de login, no wizard
- Usuario autenticado:
  - Flujo normal de creación
  - El spot se guarda correctamente
  - `spots.user_id = auth.uid()`
- El error técnico de RLS ya no aparece en UI.

---

## Decisiones relevantes

- La seguridad permanece en RLS (fuente de verdad).
- El frontend solo previene UX defectuoso.
- No se enforcea ownership en DB (decisión consciente).
- El insert mantiene `user_id: user?.id ?? null`.

---

## Estado

✅ **DONE**  
El flujo de creación queda protegido desde UX, sin comprometer seguridad ni arquitectura.
