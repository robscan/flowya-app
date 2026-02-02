# Bitácora 019 — Modal de auth: variantes por contexto

## Objetivo

Diferenciar el título del modal de auth según el contexto de apertura: guardar pin vs icono de perfil. Trazabilidad mediante objeto centralizado `AUTH_MODAL_MESSAGES`.

---

## 1) Objeto AUTH_MODAL_MESSAGES

### Archivos

- **contexts/auth-modal.tsx** — Nuevo objeto exportado `AUTH_MODAL_MESSAGES` con dos variantes:
  - `savePin`: «Crea una cuenta para guardar tus lugares» — usado al intentar guardar pin sin sesión (SpotCard, SpotDetail).
  - `profile`: «Ingresa a tu cuenta de FLOWYA» — usado al tocar icono de perfil sin sesión.

### Reglas

- Un solo punto de verdad para los títulos del modal.
- `openAuthModal({ message })` sigue aceptando string; los consumidores pasan `AUTH_MODAL_MESSAGES.savePin` o `AUTH_MODAL_MESSAGES.profile`.
- Default interno del modal: `AUTH_MODAL_MESSAGES.savePin`.

---

## 2) Consumidores

| Archivo | Uso |
|---------|-----|
| app/(tabs)/index.web.tsx | `handleProfilePress` → `AUTH_MODAL_MESSAGES.profile`; `handleSavePin` → `AUTH_MODAL_MESSAGES.savePin` |
| app/spot/[id].web.tsx | `handleSavePin` → `AUTH_MODAL_MESSAGES.savePin` |
| app/design-system.web.tsx | Botones showcase: ambos variantes |

---

## 3) Design System

- **app/design-system.web.tsx** — Sección «Modal de auth»: dos botones «savePin» y «profile» para ver ambas variantes.
- Descripción actualizada: menciona las dos variantes y el objeto `AUTH_MODAL_MESSAGES`.

---

## Resumen de archivos tocados (019)

| Archivo | Cambio |
|--------|--------|
| contexts/auth-modal.tsx | AUTH_MODAL_MESSAGES, default savePin |
| app/(tabs)/index.web.tsx | profile variant en handleProfilePress, savePin en handleSavePin |
| app/spot/[id].web.tsx | savePin variant en openAuthModal |
| app/design-system.web.tsx | Botones savePin/profile, descripción |
| bitacora/019_modal_auth_variantes.md | Esta bitácora |

---

## Criterio de cierre

- [x] Al tocar perfil sin sesión → modal con título «Ingresa a tu cuenta de FLOWYA».
- [x] Al guardar pin sin sesión → modal con título «Crea una cuenta para guardar tus lugares».
- [x] Títulos definidos en `AUTH_MODAL_MESSAGES` (trazable).
