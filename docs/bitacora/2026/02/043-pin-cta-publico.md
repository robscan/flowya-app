# Bitácora — Pin CTA público (ajuste quirúrgico)

**Fecha:** 2026-02-08  
**Tipo:** Corrección / Producto

---

## Contexto

FLOWYA permite lectura pública. Las mutaciones están protegidas por RLS y por UI. En la alineación UI–RLS (bitácora 042) se ocultó el botón **Guardar pin** para usuarios no autenticados, junto con el resto de acciones mutantes.

## Ajuste

**Guardar pin** debe ser visible para usuarios **no autenticados** como **CTA de valor**: invita a guardar el lugar y, al tocar sin sesión, abre el modal de login. No ejecuta mutación sin auth.

- La lógica defensiva en `handleSavePin` (mapa y detalle) ya existe: si no hay usuario → `openAuthModal` y `return`; no se llama a `setPinStatus` ni a `removePin`.
- No se modifica esa lógica; solo se revierte la **ocultación** del botón.

## Cambios realizados

- **Mapa** (`app/(tabs)/index.web.tsx`): `onSavePin` se pasa siempre a `SpotCard` (revertido el condicional `isAuthUser ? ... : undefined`).
- **Detalle de spot** (`app/spot/[id].web.tsx`): `onSavePin={handleSavePin}` se pasa siempre (revertido el condicional `isAuthenticated ? ... : undefined`).

## Criterio de cierre

- El botón Guardar pin vuelve a ser visible para usuarios no autenticados.
- Al hacer clic sin auth → se abre el modal de login; no se ejecuta mutación.
- El resto del comportamiento (Editar, Eliminar spot, Feedback, RLS, soft delete) permanece idéntico.

## Alineación con estrategia

Guardar pin como CTA público (visible sin auth, mutación solo tras login) alinea con la estrategia de conversión: el usuario descubre valor (explorar, ver spots) y el primer gesto de “guardar” es el momento natural para pedir cuenta (modal de login), sin ocultar el CTA.
