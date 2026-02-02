# Bitácora 017 — Scope I: Autenticación mínima para pins

## Objetivo

Añadir un sistema de Sign up / Log in ultraliviano (Magic Link) solo para persistir datos del usuario (pins). FLOWYA sigue siendo usable sin cuenta; la cuenta se solicita solo cuando el usuario intenta guardar su primer pin.

## Archivos tocados

### Nuevos

- **contexts/auth-modal.tsx** — `AuthModalProvider`, `useAuthModal()`, y vista del modal: input email, CTA «Enviar enlace», estados idle / loading / success / error. Supabase `signInWithOtp` con `emailRedirectTo: window.location.origin`. Al detectar sesión (`onAuthStateChange` o polling mientras «Revisa tu correo»), se ejecuta `onSuccess` y se cierra el modal.
- **bitacora/017_scope_i_auth.md** — Esta bitácora.

### Modificados

- **app/_layout.tsx** — Eliminado `useAnonymousSession()`. Envuelto árbol en `AuthModalProvider`.
- **app/(tabs)/index.web.tsx** — En `handleSavePin`, si la acción es agregar/actualizar pin: se llama a `getCurrentUserId()`. Si es `null`, se abre el modal de auth con mensaje «Crea una cuenta para guardar tus lugares» y `onSuccess: () => handleSavePin(spot)` para reintentar tras login.
- **app/spot/[id].web.tsx** — Misma lógica: al guardar pin sin sesión, se abre el modal con `onSuccess: handleSavePin`.
- **app/design-system.web.tsx** — Nueva sección «Modal de auth (Scope I)»: documentación del sheet/modal y botón para abrirlo.

### Sin cambios relevantes

- **lib/pins.ts** — `getCurrentUserId()` ya devolvía `null` si no hay usuario; sin sesión anónima, al no estar logueado devuelve `null`.
- Create Spot, Share, RLS: no modificados.

## Decisiones de auth

- **Tipo**: Supabase Auth con Email + Magic Link (OTP). Sin password, sin social login, sin perfiles ni roles.
- **UX**: La app es usable sin cuenta. El modal de auth se muestra solo al intentar guardar un pin (agregar o cambiar estado) sin sesión. Quitar pin (visited → sin pin) requiere haber tenido sesión, por tanto no se muestra el modal en ese flujo.
- **Reintento**: Tras login exitoso se ejecuta el callback `onSuccess` (reintentar guardar pin) y se cierra el modal. Detección de sesión: `onAuthStateChange(SIGNED_IN)` y, mientras se muestra «Revisa tu correo», polling cada 2 s a `getSession()` por si el usuario abre el enlace en otra pestaña.
- **Persistencia**: La sesión se mantiene entre recargas (Supabase guarda en almacenamiento local). Logout no expuesto en UI en este scope.

## Qué NO se hizo

- Página de perfil.
- Settings.
- Bloquear Create Spot.
- Cambiar Share.
- RLS compleja adicional.
- Social login, password, onboarding largo, checkbox de términos.

## Design System

- **Sheet / modal de auth**: Una pantalla, un input (email), un CTA («Enviar enlace»). Estados: idle, loading, success («Revisa tu correo…»), error. Estilo FLOWYA (calmo, humano), colores y espaciado del tema.
- **API**: `useAuthModal()` → `openAuthModal({ message?, onSuccess? })`, `closeAuthModal()`.

## Requisitos Supabase

- En el proyecto: **Auth → Providers → Email** habilitado.
- **Auth → URL Configuration**: Site URL y Redirect URLs deben incluir el origen de la app para que el Magic Link redirija correctamente.
- Anonymous sign-ins ya no son necesarios para pins (Scope I reemplaza la sesión anónima del Scope D para usuarios que quieran persistir pins).

## Pendientes futuros

- Roles, perfiles, onboarding.
- Logout visible en UI (opcional).
- Mejoras de copy del modal.

## Criterio de cierre

- El usuario puede iniciar sesión con email (Magic Link).
- Puede guardar pins solo si está logueado; si no, se muestra el modal y tras login se reintenta la acción.
- El flujo es natural y no invasivo; la acción original se reintenta tras login.
- Consola limpia.
