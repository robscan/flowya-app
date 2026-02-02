# Bitácora 031 — FLOWYA Beta + Feedback (Modal canónico)

## Objetivo

Cerrar FLOWYA v0.x (beta) con un punto informativo y canal de feedback sin afectar flujos core (mapa, spots, auth).

## Qué se agregó

### 1. Botón / Label FLOWYA

- **Ubicación:** Esquina inferior izquierda del mapa, fijo
- **Texto:** FLOWYA con Heading 2 canónico (TypographyStyles.heading2)
- **Estilo:** Mismo sistema de botones de icono (backgroundElevated, border, shadow, pressed)
- **Acción:** Abre modal FlowyaBetaModal

### 2. FlowyaBetaModal (Design System)

Modal canónico reutilizando la base del modal de Auth:
- Misma estructura: backdrop, sheet, sombra
- Misma animación (fade)
- KeyboardAvoidingView para teclado en mobile

**Contenido:**
- **Header:** Título "FLOWYA (beta)" con Heading 2
- **Body:** Texto informativo (beta en evolución), autoría (Oscar Muñiz Blanco — @robscan), separador, instrucciones de feedback
- **Textarea:** Placeholder conversacional
- **Footer:** Botón Primary "Enviar feedback", Botón Secondary "Cerrar"

### 3. Envío de feedback

- **Cliente:** `lib/send-feedback.ts` — POST a `/api/feedback`
- **API:** `api/feedback.ts` — Vercel serverless, inserta en Supabase
- **Persistencia:** Tabla `feedback` en Supabase

**Payload:** `message`, `url`, `user_id`, `user_email`, `user_agent`

**Reglas:**
- Si falla: toast "No se pudo enviar ahora" (sin errores técnicos)
- Si éxito: cerrar modal, toast "Feedback enviado"

### Ajuste incremental: DB en lugar de email (MVP)

Resend se eliminó. El feedback se persiste en Supabase:

- **Migración 009:** Tabla `feedback` (id, message, user_id, user_email, url, user_agent, created_at)
- **API:** Inserta con Supabase client (anon key + RLS INSERT)
- **Cliente:** Envía message, url, user_id, user_email, user_agent

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| supabase/migrations/009_feedback_table.sql | Nuevo: tabla feedback |
| api/feedback.ts | Supabase insert (sin Resend) |
| lib/send-feedback.ts | Payload message, user_id, user_email, user_agent |
| components/ui/flowya-beta-modal.tsx | message, user_id, user_email |
| package.json | Eliminado resend |
| bitacora/031_flowya_beta_feedback_modal.md | Esta bitácora |

## Configuración requerida

- **EXPO_PUBLIC_SUPABASE_URL** y **EXPO_PUBLIC_SUPABASE_ANON_KEY** (ya existentes)
- Ejecutar migración: `supabase db push` o aplicar 009 manualmente

## Criterio de cierre

- [x] FLOWYA visible con jerarquía correcta (Heading 2)
- [x] Modal consistente con Auth
- [x] Feedback se guarda en tabla feedback (Supabase)
- [x] No se envían emails
- [x] Core intacto (mapa, spots, auth)
