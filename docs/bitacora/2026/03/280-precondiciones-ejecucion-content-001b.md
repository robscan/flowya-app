# 280 — Precondiciones cerradas para ejecución `OL-CONTENT-001.B`

Fecha: 2026-03-03  
Tipo: Decisión operativa de ejecución  
Área: `OL-CONTENT-001.B`

## Decisiones cerradas

1. Notas privadas (`nota breve`, `por qué importa`) se guardan en `pins` (v1).
2. Imagen de portada permanece pública (`cover_image_url`), sin cambio de visibilidad.
3. UI debe indicar siempre privacidad:
   - Imagen: visible para otros usuarios.
   - Notas: solo visibles para el usuario.
4. Límites de texto:
   - `note_short <= 280`
   - `note_why <= 800`
5. Consistencia:
   - `last write wins`,
   - patch optimista,
   - refetch puntual ante error/desincronización.
6. Compatibilidad:
   - `001.B` mantiene `cover_image_url` como contrato de portada;
   - `OL-CONTENT-002` podrá extender a galería sin romper fallback.

## Evidencia

- `docs/ops/plans/PLAN_OL_CONTENT_001_B_SHEET_QUICK_EDIT_PRIVATE_NOTES_2026-03-03.md` actualizado con sección de precondiciones.
