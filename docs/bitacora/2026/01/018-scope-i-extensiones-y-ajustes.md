# Bitácora 018 — Extensiones Scope I y ajustes (Toast, Build, Viewport, Copy)

## Objetivo

Documentar las extensiones del flujo de auth (botón de perfil, logout, copy post signup) y los ajustes de UI/build/viewport realizados tras el Scope I. Trazabilidad de todo lo tocado.

---

## 1) Botón de perfil (acceso al auth)

### Archivos

- **app/(tabs)/index.web.tsx** — Botón de icono (User) en esquina superior izquierda. `handleProfilePress`: si no hay usuario o es anónimo → abre auth modal; si está autenticado → toggle `showLogoutOption` (mostrar/ocultar botón X). Icono en color `colors.primary` cuando autenticado, `colors.text` cuando no.
- **app/design-system.web.tsx** — Sección «Modal de auth (Scope I)»: añadida documentación del botón de perfil (Scope I): ubicación, estados, comportamiento.

### Comportamiento

- **Sin sesión o anónimo**: al tocar perfil → se abre el modal de auth.
- **Autenticado**: al tocar perfil → se muestra toast «Ya estás dentro de tu cuenta» y se alterna la visibilidad del botón X (logout) debajo del perfil.
- **Botón X**: solo visible cuando `showLogoutOption && isAuthUser`. Al tocar → ventana de confirmación «¿Cerrar sesión?» (web: `window.confirm`, nativo: `Alert.alert`). Si confirma → `supabase.auth.signOut()` y se oculta la X. Icono X en color **stateError** (rojo).
- **Tap fuera**: backdrop transparente a pantalla completa (cuando se muestra la X) cierra la opción de logout al tocar fuera del perfil y de la X.

### Tema

- **constants/theme.ts** — Añadido `stateError`: light `#ff3b30`, dark `#ff453a`. Usado en el icono X de logout.

---

## 2) Toast: posición, tipo success, centrado

### Archivos

- **components/ui/toast.tsx** — Posición: de `bottom` a **top** (top: 72 web / 88 nativo). Contenedor centrado: wrapper con `alignItems: 'center'` y `paddingHorizontal`. Tipo **success**: `show(message, { type: 'success' })` → fondo `colors.stateSuccess`, texto `#1d1d1f` (negro). Sin tipo o `default`: estilo anterior.
- **app/(tabs)/index.web.tsx**, **app/spot/[id].web.tsx** — Todas las llamadas a `toast.show` de éxito pasan `{ type: 'success' }` (Link copiado, Ya estás dentro, Pin quitado, Por visitar/Visitado).

### Reglas

- Toast success: fondo stateSuccess, texto negro, siempre centrado horizontalmente.
- Sin botones nuevos; solo texto y posición.

---

## 3) Build web (Expo 54)

### Archivos

- **package.json** — Script `build`: de `expo export:web` (Webpack, deprecado) a **`expo export -p web`** (Metro). Salida en `dist/`.

### Motivo

- En SDK 54, `expo export:web` exige Webpack; el proyecto usa Metro. `expo export -p web` es el comando correcto para exportar web con Metro.

---

## 4) Viewport Safari iOS (100dvh)

### Archivos

- **styles/viewport-dvh.css** (nuevo) — Clase `.map-screen-root-dvh`: `height: 100vh` (fallback), `height: 100dvh`, `max-height: 100dvh`, `overflow: hidden`. Evita que el mapa se corte abajo en Safari iOS (donde 100vh incluye la barra del navegador).
- **app/(tabs)/index.web.tsx** — Import de `viewport-dvh.css`. Contenedor raíz del mapa: en web ya no usa `height`/`minHeight` en style; aplica `className="map-screen-root-dvh"`. Mapa sigue con `height: '100%'` heredando del padre.

### Reglas

- Sin hacks JS; solo CSS con fallback 100vh → 100dvh.
- Contenedor del mapa: overflow hidden, altura vía clase. Hijos sin vh directo.

---

## 5) Copy post signup (confirmación por email)

### Archivos

- **contexts/auth-modal.tsx** — Estado `success` (tras solicitar link): nuevo contenido. **Título**: «Revisa tu correo electrónico». **Texto principal**: «Te enviamos un enlace para entrar a FLOWYA. Abre el correo y haz clic en el enlace para continuar.» **Texto de apoyo**: «Si no lo ves en tu bandeja de entrada, revisa tu carpeta de Spam o Correo no deseado.» **Texto secundario**: «Puedes cerrar esta ventana.» Sin botones nuevos; mismo botón Cerrar. Tono claro, humano; sin términos técnicos.

### Reglas

- Solo cambio de copy; sin cambios de lógica ni comportamiento.
- Compatible web y mobile.

---

## Resumen de archivos tocados (018)

| Archivo | Cambio |
|--------|--------|
| app/(tabs)/index.web.tsx | Botón perfil, logout (X + backdrop), estado auth, viewport clase, toast success |
| app/spot/[id].web.tsx | toast.show con type: 'success' |
| app/design-system.web.tsx | Doc. botón de perfil |
| contexts/auth-modal.tsx | Copy post signup (estado success) |
| components/ui/toast.tsx | Posición top, centrado, tipo success (fondo + texto negro) |
| constants/theme.ts | stateError (rojo) |
| package.json | build: expo export -p web |
| styles/viewport-dvh.css | Nuevo: 100dvh + fallback 100vh |
| docs/bitacora/2026/01/017-scope-i-auth.md | Referencia a extensiones (pendientes cerrados) |
| docs/bitacora/2026/01/018-scope-i-extensiones-y-ajustes.md | Esta bitácora |

---

## Criterio de cierre

- Botón de perfil visible; acceso al auth y logout con confirmación; tap fuera cierra opción X.
- Toast en parte superior, centrado; success con fondo verde y texto negro.
- Build web exitoso con `npm run build`.
- Mapa sin corte en Safari iOS (100dvh).
- Copy post signup actualizado; consola limpia.
- Bitácora al día con trazabilidad.

---

**Bitácora 019** — Modal de auth: variantes por contexto (savePin vs profile). Ver `019_modal_auth_variantes.md`.
**Bitácora 020** — Modal de confirmación para logout. Ver `020_confirm_modal_logout.md`.
