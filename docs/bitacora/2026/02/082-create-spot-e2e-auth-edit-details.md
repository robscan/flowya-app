# Bitácora 082 (2026/02) — Create spot E2E (map-first) + Auth gate + Editar detalles

**Fecha:** 2026-02-11  
**Objetivo:** Cerrar flujo end-to-end de creación de spot desde “Sin resultados” y que “Editar detalles” funcione; auth gate en ambos entry points.

---

## Qué se hizo

### Flujo cerrado (logged-in)

1. **Sin resultados** → tap **“Crear spot nuevo aquí”** → entra en modo placing (pin en centro del mapa / ubicación).
2. **Confirmar ubicación** → BORRADOR: celda “Imagen (opcional)” canónica (mismo patrón que paso “Foto de portada” del create-spot), CTA “Crear spot”.
3. (Opcional) Agregar imagen (1 cover; sin galería) → Quitar si se desea.
4. **Crear spot** → insert en `spots` con campos mínimos (title, description_short, description_long, latitude, longitude, address); si hay imagen: pipeline existente `optimizeSpotImage` + `uploadSpotCover` → `cover_image_url`.
5. Tras insert: `refetchSpots()`, `setSelectedSpot(createdSpot)`, sheet en estado **expanded**.
6. CTA **“Editar detalles”** → navega a `/spot/[id]?edit=1` (Edit Spot sin hero, back en header).

### Auth gate

- **“Crear spot nuevo aquí” (no-results):** si no hay sesión → `requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot)` abre modal de auth; **no** se crea draft ni se entra en placing.
- **“Crear spot” (BORRADOR):** si no hay sesión → mismo helper; **no** se inserta.
- Reutilizado el mecanismo ya existente (bitácora 048); no se implementó gate nuevo.

### Ajustes de datos / código

- **DB:** La tabla `spots` **no** tiene columna `user_id`; solo `pins` la tiene. Se corrigió el insert en MapScreenVNext: se eliminó `user_id` del payload para evitar error de columna inexistente. Campos insertados: title, description_short, description_long, latitude, longitude, address (cover_image_url se actualiza tras upload si hay imagen).
- **UI:** CTA unificado en “Editar detalles” (SpotSheet/ExpandedExtra). Badge BORRADOR. Celda “Agregar imagen” centrada y con icono canónico (ImagePlaceholder).

### Pruebas realizadas / a ejecutar

- **Logged-out:** “Crear spot nuevo aquí” → modal auth, no draft. “Crear spot” (si se llegara a BORRADOR) → modal auth, no insert.
- **Logged-in:** Sin resultados → Crear spot nuevo aquí → Confirmar ubicación → (opcional imagen) → Crear spot → spot en mapa + sheet expanded → “Editar detalles” → Edit Spot para ese id.

---

## Pendiente (no hecho hoy)

- **Soft delete:** Queda como OPEN LOOP. El código ya filtra `is_hidden = false` y la pantalla de spot hace `update({ is_hidden: true })`; la columna `is_hidden` no aparece en migraciones 001/002 (posible migración posterior o manual). Verificar esquema real y alinear queries/migraciones si hace falta; no se tocó hoy.
- **Delete:** No se usa hard delete; flujo no depende de DELETE físico.

---

## Archivos tocados (resumen)

- `components/explorar/MapScreenVNext.tsx` — auth gate en handleCreateFromNoResults y handleCreateSpotFromDraft; insert sin user_id; refetch + setSelectedSpot + setSheetState expanded.
- `components/explorar/SpotSheet.tsx` — DraftInlineEditor: celda imagen canónica (ImagePlaceholder, “Agregar imagen”), label “Imagen (opcional)”, preview + Quitar; CTA “Editar detalles”.
- `app/spot/[id].web.tsx` / `components/design-system/spot-detail.tsx` — Edit Spot sin hero (back en header).
- Contratos y docs de search/chooser según bitácora 081; hoy se añade nota de auth gate en chooser.

---

## Referencias

- Bitácora 048 (auth gate create spot).
- Bitácora 013 (cover image pipeline).
- docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md (auth gate en “Crear spot nuevo aquí”).
- docs/contracts/DATA_MODEL_CURRENT.md — spots sin user_id.
