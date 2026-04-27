# 384 — Media picker and refresh P0 web mitigation

Fecha: 2026-04-26

## Contexto

Durante el bloque V1 de estabilidad se confirmó un patrón de riesgo repetido en media: si el file picker web se abre después de `await` de auth, duplicados o consentimiento, algunos navegadores móviles pueden bloquear `input.click()` y dejar al usuario con loader o acciones bloqueadas.

También se identificó que el upload público desde quick add podía insertar la imagen en Storage/DB, pero no refrescar de inmediato las superficies que consumen la galería en runtime.

## Cambio aplicado

- Se extrajo `pickImageFilesFromWebInput()` como helper síncrono de gesto para archivos web.
- `handlePoiAddPhotos()` ahora inicia el picker web después del gate mínimo de auth, antes de duplicate check y consentimiento.
- Si aparece modal de duplicado, el flujo conserva los archivos ya elegidos para `Crear de todas formas`.
- El quick add público de imágenes refresca `heroOverrideUris` y el metadata local de búsqueda después de `syncCoverFromGallery()`.

## Alcance

Aplica al P0 web de POI no guardado/fotos y refresh inmediato público en Explore.

No resuelve todavía:

- canon path-first de media;
- privacidad por foto;
- paridad nativa de galería múltiple;
- cola con concurrencia limitada para muchas fotos.

Esos puntos siguen separados en `OL-SPOT-MEDIA-CANON-001` y en la fase media del documento de auditoría.

## Validación

- `npm run typecheck`
- `npm run test:regression`
- `npm run lint -- --no-cache` (sin errores; quedan warnings existentes del repo)

## QA manual pendiente

1. Web móvil: desde POI no guardado, tocar agregar fotos y confirmar que el picker abre inmediatamente.
2. Web móvil: cancelar picker y confirmar que no queda busy.
3. Web: seleccionar POI duplicado, elegir fotos, `Crear de todas formas` y verificar que no se reabre picker innecesariamente.
4. Spot existente: subir foto pública y verificar hero/listado/search sin reload.
5. Subir varias fotos y confirmar que la app no bloquea navegación, aunque la cola dedicada queda pendiente.
