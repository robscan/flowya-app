# Plan: Auth copy orientado a guardar/marcar + claridad de magic link (sin OTP)

Fecha: 2026-03-06  
Estado: Implementado  
Prioridad: Media-Alta (confianza UX en acceso)

## Objetivo

Alinear el texto del modal de autenticación con el objetivo actual del usuario (guardar/marcar spots) y comunicar con claridad que el acceso se realiza mediante enlace al correo, sin contraseña.

## Alcance

### In scope

1. Actualizar mensajes de contexto (`AUTH_MODAL_MESSAGES`) para evitar sesgo a “crear spot” como narrativa principal.
2. Ajustar copy del estado inicial y de éxito para explicar:
- enlace seguro al correo,
- no requiere contraseña,
- uso del correo para validar acceso.
3. Mantener toda la lógica auth actual con `signInWithOtp` + magic link.

### Out of scope

1. Implementar login por código OTP.
2. Cambiar plantillas/auth providers o configuración de Supabase.
3. Cambios de DB, rutas o contratos de datos.

## Diseño de copy aplicado

- `savePin`: “Inicia sesión para guardar y marcar spots”.
- `createSpot`: “Inicia sesión para guardar este spot”.
- `editSpot`: “Inicia sesión para editar y guardar este spot”.
- `profile`: “Inicia sesión en FLOWYA”.

Estado inicial del modal:
- “Te enviaremos un enlace seguro a tu correo. No necesitas contraseña.”

Estado success:
- “Revisa tu correo”
- “Te enviamos un enlace seguro para entrar a FLOWYA.”
- “Solo usamos tu correo para validar tu acceso.”

CTA:
- “Enviar enlace seguro”.

## Criterios de aceptación

1. El modal deja de comunicar “crear” como intención principal para autenticarse.
2. El flujo comunica claramente enlace por correo + sin contraseña.
3. No se modifica la lógica de autenticación ni callbacks de éxito.
4. Mensajes permanecen simples y breves en todos los contextos (guardar, crear, editar, perfil).

## Rollback

Revertir este ajuste restaura copy anterior del auth modal sin afectar autenticación, datos ni rutas.
