# 287 — Auth copy: guardar/marcar + claridad de enlace seguro sin contraseña

Fecha: 2026-03-06  
Tipo: Fix UX/copy (sin cambios de lógica auth)  
Área: `auth-modal`, `explore/create/edit gating`

## Contexto

El modal de autenticación mantenía copy de una etapa anterior centrada en “crear spot”.  
La intención actual de producto en el gate de sesión es facilitar guardar/marcar spots y transmitir confianza en el acceso por correo.

## Cambios aplicados

1. `AUTH_MODAL_MESSAGES` actualizado:
- `savePin`: “Inicia sesión para guardar y marcar spots”
- `createSpot`: “Inicia sesión para guardar este spot”
- `editSpot`: “Inicia sesión para editar y guardar este spot”
- `profile`: “Inicia sesión en FLOWYA”

2. Copy del modal (estado inicial):
- “Te enviaremos un enlace seguro a tu correo. No necesitas contraseña.”

3. Copy del modal (estado success):
- título simplificado: “Revisa tu correo”
- mensaje principal: “Te enviamos un enlace seguro para entrar a FLOWYA.”
- mensaje de confianza: “Solo usamos tu correo para validar tu acceso.”

4. CTA:
- “Enviar enlace” -> “Enviar enlace seguro”.

## Evidencia

- `contexts/auth-modal.tsx`
- `docs/ops/plans/PLAN_AUTH_COPY_SAVE_MARK_MAGIC_LINK_CLARITY_2026-03-06.md`

## Validación mínima

- `npm run lint -- --no-cache contexts/auth-modal.tsx components/explorar/MapScreenVNext.tsx app/create-spot/index.web.tsx 'app/spot/[id].web.tsx' app/spot/edit/[id].web.tsx`

Resultado esperado:
- sin errores bloqueantes en archivos tocados.

## Nota de rollback

Revertir este fix restaura el copy previo del modal.  
No hay impacto en autenticación técnica, persistencia ni contratos.
