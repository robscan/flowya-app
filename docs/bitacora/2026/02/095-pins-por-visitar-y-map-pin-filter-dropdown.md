# Bitácora 095 (2026/02) — Pins: revert Por visitar + botón único; MapPinFilter dropdown

**Fecha:** 2026-02-14  
**Objetivo:** (A) Revertir a flujo original: label "Por visitar" y un solo botón que cicla estados; (B) Convertir MapPinFilter a dropdown estilo Apple Mail.

---

## A) Revert Por visitar + botón único que cicla

### Decisión UX

- **Filtro:** Label "Guardados" → **"Por visitar"** (map-pin-filter).
- **SpotSheet:** Dos botones (Guardar + Visitado) → **un solo botón** que cicla: default → Por visitar → Visitado → quitar pin.
- **Toasts:** "Por visitar", "Visitado", "Pin quitado" (como MapScreenV0).

### Implementación

- **MapPinFilter:** Cambio de label únicamente.
- **SpotSheet:** Sustitución de dos botones por uno; props `onSavePin` solo (eliminado `onMarkVisited`); el botón muestra "Por visitar" o "Visitado" según estado y llama siempre a `onSavePin`.
- **MapScreenVNext:** `handleSavePin` único con lógica de ciclo usando `setPinStatus`, `nextPinStatus`, `removePin` (API legacy de lib/pins); eliminado `handleMarkVisited`.

### Archivos

- `components/design-system/map-pin-filter.tsx`: label "Por visitar".
- `components/explorar/SpotSheet.tsx`: un solo botón, `handleSavePin`.
- `components/explorar/MapScreenVNext.tsx`: `handleSavePin` con ciclo, imports de `setPinStatus`, `nextPinStatus`, `removePin`.

---

## B) MapPinFilter dropdown estilo Apple Mail

### Decisión UX

- **De:** 3 pills horizontales (Todos | Por visitar | Visitados).
- **A:** Dropdown tipo Apple Mail: trigger muestra valor actual; tap despliega menú con 3 opciones; al elegir se cambia filtro, se cierra menú y se actualiza mapa.
- **Estilo Apple Maps:** Objeto centrado, texto más grande y delgado (`TypographyStyles.filterLabel`).
- **Iconos:** Globe (Todos), Pin (Por visitar), CheckCircle (Visitados).

### Implementación

- **MapPinFilter:** Estado local `open`; trigger con icono + label + ChevronDown/Up; menú `position: absolute` debajo del trigger; backdrop a pantalla completa para tap fuera; opciones con icono + label + count.
- **Typography:** Nuevo `filterLabel` en `TypographyStyles`: fontSize 17, fontWeight 300, lineHeight 22.
- **design-system.web:** Descripción y ejemplos actualizados; counts en ejemplos.

### Archivos

- `components/design-system/typography.tsx`: `filterLabel` en TypographyStyles.
- `components/design-system/map-pin-filter.tsx`: dropdown, iconos (Globe, Pin, CheckCircle), TypographyStyles.filterLabel.
- `app/design-system.web.tsx`: sección Map pin filter con nueva descripción y ejemplos con counts.

---

## QA manual (checklist)

- [ ] Filtro muestra "Por visitar" (no "Guardados"); dropdown por defecto muestra "Todos" con Globe.
- [ ] Tap en trigger despliega menú; tap fuera cierra.
- [ ] Seleccionar "Por visitar" o "Visitados" cierra menú, cambia filtro y actualiza mapa.
- [ ] Counts visibles en Por visitar y Visitados dentro del menú.
- [ ] SpotSheet: un solo botón que cicla default → Por visitar → Visitado → quitar; toasts correctos.
- [ ] design-system.web muestra el dropdown correctamente.
- [ ] Consola sin errores.

---

## DoD

- AC de A y B; bitácora 095; QA manual.
