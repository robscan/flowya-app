# Plan: Galería de imágenes (futuro)

**Estado:** Documentado para retomar. No implementar aún.

> Ideas discutidas 2026-02-14. Feature 1 (Galería) aquí; Feature 2 (Mi diario) en `docs/ops/plans/PLAN_RECORDAR_MI_DIARIO.md`.

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

> **Plan completo en:** `docs/ops/plans/PLAN_RECORDAR_MI_DIARIO.md`  
> **Contrato entry point:** `docs/contracts/RECORDAR_ENTRY_SPOT_SHEET.md`

Modelo de datos y lib siguen vigentes: `pins.notes`, `notes_updated_at`, `lib/pins` (updatePinNotes).
UI: entry desde SpotSheet (dos botones en fila: Por visitar/Visitado + Mi diario), no desde SpotDetail.

---

## Orden de implementación sugerido
1. **Mi diario:** Ver `docs/ops/plans/PLAN_RECORDAR_MI_DIARIO.md`.
2. **Galería:** migración spot_images + lib + SpotImageGrid + ImageFullscreenModal extendido + Create/Edit Spot.
