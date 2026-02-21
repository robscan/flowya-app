# Bitácora 097 (2026/02) — Search copy: expectativas claras (spots Flowya)

**Fecha:** 2026-02-21  
**Objetivo:** Clarificar en el copy del buscador qué se puede buscar (spots en Flowya) y qué hacer si no hay resultados (crear spot). Evitar que el usuario piense que puede buscar cualquier cosa y se decepcione.

---

## Decisión UX

- **Placeholder:** "Buscar lugares…" → **"Buscar spots…"** — deja claro que se buscan spots, no lugares genéricos.
- **Pill BottomDock:** "Buscar" → **"Buscar spots"** — alineado con el placeholder.
- **Sección empty:** "Cercanos" → **"Spots cercanos"** — explícito sobre el contenido.
- **Mensaje empty (sin cercanos):** "No hay spots cercanos. Mantén pulsado el mapa para crear uno." → **"No hay spots cercanos. Busca en el mapa o crea uno nuevo."**
- **Estado sin resultados:** Añadir intro antes de Sugerencias: **"No hay spots con ese nombre. Puedes crearlo en Flowya:"**

---

## Archivos

- `components/search/SearchInputV2.tsx`: placeholder por defecto "Buscar spots…"
- `components/search/SearchFloatingNative.tsx`: placeholder, emptyMessage, "Spots cercanos", noResultsIntro
- `components/search/SearchOverlayWeb.tsx`: idem
- `components/explorar/BottomDock.tsx`: pill "Buscar spots", accessibilityLabel
- `components/explorar/MapScreenV0.tsx`: placeholder, "Spots cercanos", empty message, intro sin resultados

---

## Referencias

- `docs/definitions/content/TONE_OF_VOICE.md`: placeholder actualizado
- Contrato SEARCH_NO_RESULTS_CREATE_CHOOSER: sin cambios de comportamiento, solo copy
