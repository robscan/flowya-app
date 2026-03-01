# Bitácora 237 (2026/03) — OL-P3-002.A locale canónico + drill-down países

**Fecha:** 2026-03-01
**Loop:** `OL-P3-002`
**Fase:** `P3-002.A` (hardening UX/idioma)

## Objetivo

Resolver inconsistencia de idioma en listado de países y corregir flujo de tap en país que no devolvía resultados en buscador.

## Cambios

- Se introduce `lib/i18n/locale-config.ts` como fuente única de locale.
  - Modo actual: manual (`es-MX`) para desarrollo.
  - Preparado para cambio futuro a idioma del sistema.

- Se documenta definición y contrato:
  - `docs/definitions/LOCALE_CONFIG.md`
  - `docs/contracts/LOCALE_RESOLUTION.md`

- Países en Explore:
  - Normalización por token y resolución a etiqueta localizada (locale efectivo).
  - Índice de alias multi-idioma para mapear nombres de país a ISO.

- Tap en país:
  - Ya no depende de query textual.
  - Abre Search en modo drill-down por país con resultados filtrados por clave canónica del país.

- System status / toast:
  - El anclaje ahora considera también altura del sheet de países para mantener mensajes arriba del sheet.

## Validación

- `npm run lint` OK.

## Estado

- `P3-002.A` mejora consistencia de idioma y corrige la navegación por país.
