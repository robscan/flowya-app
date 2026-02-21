# Plan: Galería de imágenes + Mi diario (futuro)

**Estado:** Documentado para retomar. No implementar aún.

> Ideas discutidas 2026-02-14. Plan detallado para ejecución futura.

---

## Feature 1: Múltiples imágenes por spot (galería pública)

### Modelo de datos
- **Nueva tabla** `spot_images`: id, spot_id, url, sort_order, created_at.
- **spots.cover_image_url**: se mantiene como portada/fallback; deriva de primera imagen en spot_images.
- **Storage**: bucket `spot-covers`, paths `{spotId}/gallery/{uuid}.jpg`.

### UI
- **SpotImageGrid:** Grid 2-3 celdas en hero; tap abre galería.
- **ImageFullscreenModal:** Extender con uris[], initialIndex, FlatList horizontal, paginación estilo Apple Maps.
- **Create/Edit Spot:** Multi-select imágenes, subir a gallery.

---

## Feature 2: Mi diario (notas personales)

### Modelo de datos
- **pins:** Añadir `notes text`, `notes_updated_at timestamptz`.
- RLS existente ya protege; no cambios de políticas.

### Lib
- `lib/pins.ts`: PinState.notes, updatePinNotes(spotId, notes).
- Requiere pin (saved o visited); al guardar primera nota, crear pin con saved=true si no existe.

### UI
- **SpotDetail:** Sección "Mi diario" después de descripción; TextInput multiline; visible solo si usuario autenticado.

---

## Orden de implementación sugerido
1. **Mi diario** (menor alcance): migración pins + lib + UI SpotDetail.
2. **Galería:** migración spot_images + lib + SpotImageGrid + ImageFullscreenModal extendido + Create/Edit Spot.
