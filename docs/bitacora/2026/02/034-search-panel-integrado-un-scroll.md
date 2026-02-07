# Bitácora 034 (2026/02) — Search Panel integrado (un solo scroll)

**Micro-scope:** Panel de búsqueda Map Search V2 con un único flujo scrolleable; "Vistos recientemente" en texto.

---

## Problema

- "Vistos recientemente" aparecía siempre debajo de "Cercanos/Resultados", con scroll interno por sección.
- Sensación de sub-frames y contenido fragmentado.

---

## Objetivo UX

1. Un **solo** contenedor scrolleable para todo el contenido del panel (sin scrolls internos por sección).
2. Reorganizar secciones por estado (idle vs búsqueda) para flujo continuo.
3. "Vistos recientemente" no compite con "Cercanos": se muestra en **formato texto** (no cards) cuando aplica.

---

## Reglas de layout

### A) Estado IDLE (`query.trim().length < 3`)

- **Orden dentro del mismo scroll:**
  1. **Búsquedas recientes** (texto, máx 5)
  2. **Vistos recientemente** (texto, máx 10) — no cards
  3. **Cercanos** (cards con imagen)
- Todo en un único `ScrollView`; sin `ScrollView` anidados.

### B) Estado BÚSQUEDA (`query.trim().length >= 3`)

- Mostrar solo:
  - Resultados de búsqueda (cards) en un solo scroll, o
  - Sugerencias (texto) + CTA Crear según reglas actuales.
- No renderizar "Vistos recientemente" (ni como cards ni como texto) para no fragmentar el panel.

---

## Cambios realizados

- **`app/(tabs)/index.web.tsx`** (search overlay):
  - **Idle:** Un único `ScrollView` envuelve: Búsquedas recientes → Vistos recientemente (filas de texto con `spot.title`, estilo `historyItem`, máx 10) → Cercanos (cards). Eliminados los dos `ScrollView` internos que había en Cercanos y Vistos recientemente.
  - **Búsqueda:** Sin cambios; ya solo se mostraban resultados o sugerencias+CTA (sin "Vistos recientemente").

---

## Resumen

- Panel idle: un solo scroll, orden 1→2→3 y "Vistos recientemente" en texto.
- Panel búsqueda: solo resultados/sugerencias+CTA; "Vistos recientemente" oculto.
