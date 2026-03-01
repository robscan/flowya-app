# Bitácora 233 (2026/03) — OL-P1-003 cierre operativo: System Status Bar

**Fecha:** 2026-03-01
**Loop:** `OL-P1-003` — System Status Bar

## Objetivo

Implementar `SystemStatusBar` como canal canónico de estado del sistema, migrar providers/hooks activos y mantener compatibilidad con `toast` para evitar regresiones.

## Cambios aplicados

- Nuevo componente/proveedor canónico:
  - `components/ui/system-status-bar.tsx`
  - `useSystemStatus().show(message, { type })`
  - Cola visible hasta 3 mensajes, auto-hide 2500 ms en bloque.
  - Fade-in/fade-out.
  - A11y: `accessibilityRole="status"`, `accessibilityLiveRegion="polite"`.
  - Z-index runtime: `12`.

- Root app provider:
  - `app/_layout.tsx` usa `SystemStatusProvider` en lugar de `ToastProvider`.

- Migración de call sites activos (`useToast` -> `useSystemStatus`):
  - `components/explorar/MapScreenVNext.tsx`
  - `app/spot/[id].web.tsx`
  - `app/spot/edit/[id].web.tsx`
  - `app/spot/edit/[id].tsx`
  - `components/ui/flowya-beta-modal.tsx`

- Compatibilidad backward:
  - `components/ui/toast.tsx` quedó como capa `@deprecated` delegando a `SystemStatusProvider/useSystemStatus`.

## Validación

- `npm run lint` OK.
- Smoke visual esperado:
  - mensajes aparecen debajo de controles top,
  - no bloquean interacción (`pointerEvents: 'none'`),
  - colores por tipo (`success/error/default`) según tokens.

## Estado

- `OL-P1-003` cerrado a nivel implementación base + migración de call sites activos.
- Siguiente paso opcional: consolidar inventario de textos canónicos en módulo de mensajes (`lib/system-status-messages.ts`) y completar normalización de copy en todos los eventos.
