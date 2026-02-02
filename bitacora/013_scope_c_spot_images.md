# Bitácora 013 — Scope C: Pipeline de imágenes para spots

## Objetivo

Implementar un pipeline sólido de imágenes para spots: optimización en cliente, subida a Supabase Storage, persistencia de URL en `spots.cover_image_url`, placeholder canónico y vista en grande. Sin bloquear el flujo ni mostrar errores técnicos al usuario.

## Archivos tocados

### Nuevos

- **supabase/migrations/003_storage_spot_covers.sql** — Bucket `spot-covers` y políticas RLS (INSERT anon/authenticated, SELECT public).
- **lib/spot-image-optimize.ts** — Optimización en web: canvas resize (max 1600px), JPEG ~75 %, objetivo &lt; 500 KB. Fallback a blob original si falla.
- **lib/spot-image-upload.ts** — Subida a `spot-covers/{spotId}/cover.jpg`, devuelve URL pública o `null` sin lanzar.
- **components/design-system/spot-image.tsx** — Componente canónico: estados loading | image | placeholder | error. Usa ImagePlaceholder cuando no hay URI o error.
- **components/design-system/image-fullscreen-modal.tsx** — Modal fullscreen para ver imagen (lightbox simple, web compatible).

### Modificados

- **app/create-spot/index.web.tsx** — Paso 5: sección "Foto de portada" con selección (expo-image-picker), preview y "Quitar". En handleCreate: tras insertar spot, si hay imagen seleccionada → fetch → optimizar → subir → update `cover_image_url`; fallback silencioso si falla.
- **components/design-system/spot-card.tsx** — Usa SpotImage para miniatura; opcional `onImagePress` para abrir en grande (solo si hay imagen y callback).
- **components/design-system/spot-detail.tsx** — Hero usa SpotImage; opcional `onImagePress` para abrir en grande.
- **app/(tabs)/index.web.tsx** — Estado `fullscreenImageUri`, SpotCard con `onImagePress`, render de ImageFullscreenModal.
- **app/spot/[id].web.tsx** — Estado `fullscreenImageUri`, SpotDetail con `onImagePress`, render de ImageFullscreenModal.
- **components/design-system/index.ts** — Export de SpotImage, ImageFullscreenModal y sus tipos.
- **app/design-system.web.tsx** — Nueva sección "Imagen de spot (Scope C)" con descripción y showcase de SpotImage (placeholder + imagen de ejemplo).

## Decisiones

- **Bucket**: `spot-covers`, una imagen por spot (path `{spotId}/cover.jpg`). Políticas: anon puede INSERT (flujo Create Spot sin auth); SELECT público para lectura.
- **Optimización**: Solo en web (canvas). Max width 1600px, JPEG quality 0.75, objetivo &lt; 500 KB. Si falla optimización → se sube el blob original. En native (futuro) se podría usar expo-image-manipulator o subir sin optimizar.
- **Flujo Create Spot**: La imagen es opcional. Se selecciona en paso 5 (revisión). Al "Crear spot": 1) INSERT spot, 2) si hay imagen: fetch(uri) → optimizar → subir → UPDATE cover_image_url; cualquier fallo se ignora y el spot queda con `cover_image_url` null.
- **Placeholder**: Mismo ImagePlaceholder en SpotCard, SpotDetail hero y Create Spot. SpotImage lo usa cuando `uri` es null o cuando hay error de carga (onError).
- **Fullscreen**: Al tocar la imagen en SpotCard (mapa) o en SpotDetail (hero) se abre ImageFullscreenModal con la URL. Cerrar con botón o tocando el fondo.

## Qué se optimiza y qué no

- **Sí**: Redimensionar (max 1600px), comprimir JPEG ~75 %, evitar subir MBs.
- **No**: Múltiples tamaños (thumb/medium/full), CDN, moderación, galerías, múltiples imágenes por spot.

## Dependencias

- **expo-image-picker** — Selección de imagen en biblioteca (y cámara en otros entornos). Añadido al proyecto para Scope C.

## Pendientes (scopes futuros)

- Hacer el bucket `spot-covers` público desde Dashboard si getPublicUrl no devuelve URL accesible (según versión de Supabase).
- En native: integración de selección/optimización/subida en create-spot (hoy solo index.web.tsx).
- Posible uso de expo-image-manipulator en native para optimización antes de subir.

## Criterio de cierre

- Imagen se optimiza antes de subir (web).
- Imagen se guarda en Storage y URL en `spots.cover_image_url`.
- Placeholder consistente si no hay imagen o hay error.
- Imagen correcta en SpotCard y SpotDetail.
- Vista fullscreen al tocar imagen (mapa y detalle).
- Consola sin errores ni warnings nuevos; fallbacks silenciosos.
