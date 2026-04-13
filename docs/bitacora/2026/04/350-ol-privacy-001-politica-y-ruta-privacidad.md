# 350 — OL-PRIVACY-001: política de privacidad pública y ruta `/privacy`

**Fecha:** 2026-04-12  
**Tipo:** Cierre de loop — legal / UX / producto  
**Rama:** `feat/ol-privacy-001-privacy-policy`

## Objetivo (plan)

Cumplir [PLAN_OL_PRIVACY_001_2026-03-10.md](../../ops/plans/PLAN_OL_PRIVACY_001_2026-03-10.md): documento de política legible y trazabilidad de uso de geolocalización, sesión, proveedores (Mapbox, Supabase), almacenamiento local y analítica.

## Entregado (MVP)

| Entregable | Detalle |
|------------|---------|
| Texto canónico (ES) | `lib/legal/privacy-policy-es.ts` — secciones numeradas; fecha de actualización exportada. |
| Pantalla pública | `app/privacy.tsx` — scroll, theming, cabecera stack vía `app/_layout.tsx` (`name="privacy"`). Ruta: **`/privacy`**. |
| Integración consentimiento / acceso | Enlace **Política de privacidad** en `contexts/auth-modal.tsx` (cierra modal y navega a `/privacy`). Mismo patrón en `components/ui/flowya-beta-modal.tsx`. |
| Ops | `docs/ops/OPEN_LOOPS.md` — loop activo pasa a **`OL-SECURITY-VALIDATION-001`**; este OL cerrado con referencia a esta bitácora. |
| Plan | `docs/ops/plans/PLAN_OL_PRIVACY_001_2026-03-10.md` — estado actualizado a cerrado MVP. |

## Fuera de alcance (deuda explícita)

- Banner de cookies aparte (no hay cookies de ads en cliente hoy; el texto lo indica).
- Versión EN de la política (`OL-I18N-EN-001`).
- Checkbox obligatorio previo a enviar correo en auth (solo enlace informativo; producto puede endurecer después).

## Sanidad

- `npx tsc --noEmit` OK.

## Trazabilidad GitHub

- Merge en `main`: [**PR #140**](https://github.com/robscan/flowya-app/pull/140) (2026-04-12).
- Índice PR y OL relacionados: [`352`](352-indice-trazabilidad-pr-140-ol-privacy-ol-security-2026-04.md).

## Referencias

- Esta bitácora: `docs/bitacora/2026/04/350-ol-privacy-001-politica-y-ruta-privacidad.md`
- Siguiente OL activo: **`OL-SECURITY-VALIDATION-001`** — ver `OPEN_LOOPS.md`
