# 419 — Privacy iOS App Store policy

**Fecha:** 2026-05-17  
**Tipo:** Legal / App Store readiness / web route  
**Rama:** `feat/privacy-ios-policy`

## Objetivo

Crear una URL pública separada para la política de privacidad de FLOWYA iOS V1:

- Mantener `/privacy` como política web actual.
- Publicar `/privacy-ios` como política EN-first específica para App Store.
- Alinear el texto con iOS V1: UIKit-first, local-first, Apple MapKit, permiso When In Use, sin login obligatorio ni mutación remota activa de datos personales.

## Entregado

| Entregable | Detalle |
|------------|---------|
| Texto canónico iOS | `lib/legal/privacy-policy-ios-en.ts` — política EN para FLOWYA iOS V1. |
| Ruta pública | `app/privacy-ios.tsx` — pantalla Expo Router para `/privacy-ios`. |
| Stack route | `app/_layout.tsx` — título `FLOWYA iOS Privacy Policy`. |
| Vercel | `vercel.json` — rewrites `/privacy-ios` y `/privacy-ios/` a `privacy-ios.html`. |

## Guardrails de copy

- No se reemplaza ni modifica `/privacy`.
- No se declara tracking, ads, venta de datos ni cookies publicitarias.
- No se menciona Mapbox como runtime iOS; iOS V1 declara Apple MapKit.
- Supabase remoto no se describe como mutación activa de datos personales iOS V1.
- No se promete publicación pública de fotos ni social sharing como activo V1.

## Sanidad

- `npm run build` OK.
- Export Expo incluye `/privacy-ios`.
- Export local genera `dist/privacy.html` y `dist/privacy-ios.html`.
- Deploy producción Vercel OK; alias `https://www.flowya.app` actualizado.
- `curl -I -L https://www.flowya.app/privacy` devuelve `HTTP/2 200`.
- `curl -I -L https://www.flowya.app/privacy-ios` devuelve `HTTP/2 200`.

## Trazabilidad GitHub

- PR: [#190](https://github.com/robscan/flowya-app/pull/190).
- URL App Store: `https://www.flowya.app/privacy-ios`.
