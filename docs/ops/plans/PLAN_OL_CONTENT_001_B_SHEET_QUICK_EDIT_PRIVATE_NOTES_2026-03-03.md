# PLAN — OL-CONTENT-001.B (2026-03-03)

Estado: PLANIFICADO  
Dependencia: cierre de `OL-CONTENT-001.A`  
Objetivo: edición rápida y accesible desde SpotSheet/Search sin romper map-first ni privacidad.

Documento de diseño UX asociado:
- `docs/ops/plans/DESIGN_OL_CONTENT_001_B_SHEET_QUICK_EDIT_PRIVATE_NOTES_2026-03-03.md`
- Foundation requerido:
  - `docs/ops/plans/PLAN_OL_CONTENT_001_A_IDENTITY_OWNERSHIP_FOUNDATION_2026-03-03.md`

---

## 1) Decisiones cerradas

1. `nota breve` y `por qué importa` son **personales/privadas** por usuario.
2. En esta fase no se usan `spots.description_short` ni `spots.description_long` para contenido diario privado.
3. Las imágenes de portada subidas por usuario son **públicas** (visibles donde se muestre el spot).
4. La edición rápida debe estar integrada al flujo actual (SpotSheet/Search) sin pantallas extra pesadas.

## 1.1) Precondiciones de ejecución (cerradas)

1. **Storage v1 de notas privadas**
- Se implementa en `pins` (user-owned) para minimizar complejidad y aprovechar RLS existente.
- No crear tabla nueva en `001.B` salvo bloqueo técnico demostrado.

2. **Señal persistente de privacidad en UI**
- Acciones y editor deben mostrar explícitamente:
  - `Imagen (pública)` / `Visible para otros usuarios`
  - `Nota breve (privada)` y `Por qué importa (privado)` / `Solo visible para ti`

3. **Límites canónicos de texto**
- `note_short`: máximo 280 caracteres.
- `note_why`: máximo 800 caracteres.
- Validación en UI y capa de dominio.

4. **Política de conflicto y consistencia**
- Regla canónica: `last write wins`.
- Guardado con patch optimista local.
- Si hay error o desincronización, refetch puntual del spot/pin para reconciliar.

5. **Compatibilidad con `OL-CONTENT-002` (galería)**
- `cover_image_url` se mantiene como contrato de portada pública en `001.B`.
- `002` podrá introducir colección de imágenes sin romper fallback de portada actual.

---

## 2) Scope

1. Quick action en SpotSheet para:
   - Agregar/editar imagen pública.
   - Agregar/editar nota breve privada.
   - Agregar/editar “por qué importa” privado (diario).
2. Quick actions equivalentes en resultados Search (visitados) para acelerar flujo.
3. Persistencia por usuario en capa privada (`pins` o tabla user-owned definida en `001.A`).
4. Feedback inmediato y refresco local estable.

---

## 3) Fuera de scope

- Editor largo tipo documento.
- Timeline/álbum completo.
- Sharing/export del contenido privado.
- IA de copy en esta fase.

---

## 4) Integración técnica sugerida

### EP-1 — Adaptación de dominio

- Extender `lib/pins` (o módulo privado definido en `001.A`) para:
  - `updatePrivateShortNote(spotId, text)`
  - `updatePrivateWhy(spotId, text)`
  - `getPrivateSpotNotes(spotId)`
- Mantener validaciones:
  - `note_short <= 280`,
  - `note_why <= 800`.

### EP-2 — SpotSheet quick edit

- Acción visible en SpotSheet cuando `saved || visited`.
- Apertura de editor ligero (overlay/sheet corto).
- Guardado asincrónico con loading y mensaje de estado.

### EP-3 — Search quick edit parity

- En `visited`, replicar quick actions para edición privada.
- No navegar fuera de Search.
- Refrescar card local tras guardar.

### EP-4 — Imagen

- Reusar flujo actual de carga de portada.
- Integrar entry rápida desde SpotSheet y Search sin duplicar código.

### EP-5 — QA + docs

- Validar keyboard-safe, no-apilamiento de overlays, persistencia cross-sesión.
- Actualizar contrato/bitácora de cierre del loop.

---

## 5) Riesgos y mitigación

1. Mezclar copy privado con copy público.
- Mitigación: bloquear escritura en `spots.description_*` para quick edits privados.

2. Confusión de privacidad (imagen vs notas).
- Mitigación: copy persistente en editor/acciones:
  - Imagen: “Visible para otros usuarios.”
  - Notas: “Solo visible para ti.”

3. Fricción por múltiples overlays.
- Mitigación: un solo editor activo por vez; cerrar Search/otros overlays cuando aplique.

4. Regresión en web por nesting de controles.
- Mitigación: mantener patrón existente de event handling en cards (`stopPropagation` + control táctil hermano).

5. Inconsistencia entre SpotSheet y Search.
- Mitigación: share de helpers/estado y misma capa de dominio.

---

## 6) Criterios de aceptación

1. Usuario puede editar nota breve privada y “por qué importa” desde SpotSheet.
2. Usuario puede editar esas notas desde Search (visitados) sin perder contexto.
3. Los cambios persisten por usuario entre sesiones.
4. No hay escritura accidental en campos globales públicos del spot.
5. UX estable en web y native (teclado, overlays, taps).

---

## 7) Orden de ejecución recomendado

1. EP-1 dominio privado.
2. EP-2 SpotSheet quick edit.
3. EP-3 Search parity.
4. EP-4 imagen rápida integrada.
5. EP-5 QA + docs + cierre.
