# PROFILE_AUTH_CONTRACT_CURRENT — Cómo funciona hoy perfil/auth

Salida del **Prompt 4.5** (documentar perfil/auth en la app). Para que el Arquitecto redacte contratos sin suposiciones.

---

## 1) Entrypoints de auth

- **Icono de perfil sin sesión**  
  **Path:** `app/(tabs)/index.web.tsx`.  
  **Acción:** `handleProfilePress` llama a `supabase.auth.getUser()`. Si no hay `user` o es `user.is_anonymous`, se abre el modal con `openAuthModal({ message: AUTH_MODAL_MESSAGES.profile })`. Si hay sesión, se togglea el menú (mostrar opción Cerrar sesión).

- **Intentar guardar pin/spot sin sesión**  
  **Paths:**  
  - Mapa: `app/(tabs)/index.web.tsx` — handler que usa `handleSavePin` (tap en Por visitar/Visitado). Si `getCurrentUserId()` es null, se llama `openAuthModal({ message: AUTH_MODAL_MESSAGES.savePin, onSuccess: () => handleSavePin(spot) })`.  
  - Spot detail: `app/spot/[id].web.tsx` — `handleSavePin` igual: sin `userId` se abre modal con `onSuccess: handleSavePin`.  
  En ambos casos el modal se abre con mensaje “Crea una cuenta para guardar tus lugares” y, al terminar auth, se ejecuta `onSuccess` (reintentar guardar pin).

- **Logout**  
  **Path:** `app/(tabs)/index.web.tsx`.  
  **Flujo:** Tap en icono perfil (con sesión) → se muestra opción “Cerrar sesión” → tap abre `ConfirmModal` (confirmación). Al confirmar: `handleLogoutConfirm` llama a `supabase.auth.signOut()` y cierra el menú (`setShowLogoutOption(false)`). No hay redirect; el usuario sigue en la misma pantalla.

---

## 2) Estados del modal de auth

Definidos en `contexts/auth-modal.tsx`. Tipo: `AuthModalState = 'idle' | 'loading' | 'success' | 'error'`.

| Estado   | Qué lo dispara |
|----------|----------------|
| **idle** | Apertura del modal; también al borrar error (onChangeText del email). |
| **loading** | Tras enviar el formulario (handleSubmit): mientras se llama a `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: origin } })`. |
| **success** | Cuando `signInWithOtp` no devuelve error: se muestra “Revisa tu correo electrónico” y texto del magic link. |
| **error** | Email vacío al enviar → “Escribe tu correo”; o error de Supabase → `error.message` o “Algo falló”. |

---

## 3) Vuelta del magic link (redirect) y detección de sesión

- **Redirect:** `signInWithOtp` usa `emailRedirectTo: window.location.origin`. El usuario vuelve a la misma URL de la app (Supabase suele devolver con hash/fragment). No hay lógica explícita en la app que lea el hash; el cliente de Supabase restaura la sesión al inicializar/recibir eventos.

- **Detección de sesión:**  
  - **onAuthStateChange:** En `contexts/auth-modal.tsx`, `supabase.auth.onAuthStateChange((event, session) => { ... })`. Si `event === 'SIGNED_IN'` y hay `session?.user` y el modal está visible, se llama `runPendingAndClose()` (cierra modal, ejecuta `onSuccess` si existía).  
  - **Polling:** Cuando el modal está en estado `success` y visible, un `setInterval` cada 2 s llama a `supabase.auth.getSession()`. Si hay sesión, se ejecuta `runPendingAndClose()`. Así se cubre el caso de abrir el magic link en otra pestaña.

---

## 4) Qué se bloquea sin sesión (acciones que requieren login hoy)

- **Guardar / cambiar pin** (Por visitar, Visitado, o quitar pin): si no hay `user_id` (getCurrentUserId()), se abre el modal de auth; no se hace la mutación hasta tener sesión y, tras login, se re-ejecuta la acción vía `onSuccess`.  
- **Acceso al “perfil”** (icono): sin sesión no hay pantalla de perfil; se abre el modal para ingresar. Con sesión se muestra la opción de Cerrar sesión.  
- **Crear spot:** No está bloqueado por auth; el flujo Create Spot y subida a storage permiten anon (políticas storage y spots RLS lo permiten).  
- **Ver spots, abrir detalle, compartir, búsqueda:** No requieren sesión.

---

## 5) Archivos clave y constantes

| Qué | Path / valor |
|-----|----------------|
| Provider y modal de auth | `contexts/auth-modal.tsx` |
| Mensajes del modal | `AUTH_MODAL_MESSAGES` en `contexts/auth-modal.tsx`: `savePin: 'Crea una cuenta para guardar tus lugares'`, `profile: 'Ingresa a tu cuenta de FLOWYA'` |
| Cliente Supabase | `lib/supabase.ts` (createClient con EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY) |
| User id para pins | `lib/pins.ts`: `getCurrentUserId()` vía `supabase.auth.getUser()` |
| Uso en mapa (perfil, logout, save pin) | `app/(tabs)/index.web.tsx`: imports `useAuthModal`, `AUTH_MODAL_MESSAGES`; handleProfilePress, handleLogoutConfirm, handleSavePin |
| Uso en spot detail (save pin) | `app/spot/[id].web.tsx`: `useAuthModal`, `handleSavePin` con openAuthModal cuando no hay userId |
| Root layout (provider) | `app/_layout.tsx`: envuelve con `AuthModalProvider` |
| Confirmación de logout | `app/(tabs)/index.web.tsx`: estado `showLogoutConfirm`, `ConfirmModal`; texto/UX de confirmación en ese archivo |

**Constantes:**  
- `POLL_SESSION_INTERVAL_MS = 2000` en `contexts/auth-modal.tsx`.

---

Entrega en Markdown breve + bullets + paths exactos (arriba).
