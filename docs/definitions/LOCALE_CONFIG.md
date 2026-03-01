# Definición — Locale Config Canónico

## Objetivo

Definir una única fuente de verdad para el locale efectivo de la app y evitar hardcodes por componente.

## Módulo canónico

- `lib/i18n/locale-config.ts`

## Variables

- `APP_LOCALE_MODE`
  - `"manual"`: fuerza locale fijo para desarrollo/QA.
  - `"system"`: usa idioma del sistema.
- `APP_MANUAL_LOCALE`
  - Locale usado cuando `APP_LOCALE_MODE = "manual"` (actual: `es-MX`).

## API pública

- `getCurrentLocale(): string`
  - Devuelve locale efectivo final (ej. `es-MX`, `en-US`).
- `getCurrentLanguage(): string`
  - Devuelve idioma base para selección de catálogos (ej. `es`, `en`).

## Principios

1. No leer `navigator.language` ni `Intl` directamente desde features.
2. Todos los consumidores usan `locale-config`.
3. Persistencia de datos debe ser canónica (ej. `countryCode` ISO), no texto traducido.
4. Traducción futura debe cambiar política (`manual` -> `system`) sin refactor masivo.
