# CHECKLIST_QA_P3_002_B_COUNTRIES_GAMIFICATION_2026-03-01

**Fecha:** 2026-03-01  
**Objetivo:** cerrar QA funcional y visual del bloque países + gamificación V1 (`flows`) antes de freeze.

---

## 1) Países sheet (runtime)

1. Abrir contador de países desde mapa en `Todos`, `Por visitar` y `Visitados`.
- Esperado: abre en `medium`; no se superpone con SpotSheet.

2. Expandir sheet y volver a `medium`.
- Esperado: transiciones limpias, sin saltos de layout.

3. KPI orden canónico.
- Esperado: izquierda a derecha `países -> spots -> flows` (en ambos filtros).

4. KPI accionables.
- Esperado: `países` y `spots` accionables según estado; `flows` solo informativo.

5. Barra de nivel.
- Esperado: solo visible en `visitados`; ausente en `por visitar`.

6. Modal de niveles (tap en `X/12`).
- Esperado: abre/cierra bien, resalta nivel actual, sin scroll innecesario si hay viewport suficiente.

## 2) Mapa y overlays

1. Contadores flotantes (países/spots) y controles de mapa.
- Esperado: sin colisiones, sin salto inicial de posición, animación consistente.

2. Tap en mini-mapa de países.
- Esperado: encuadre por zona funcional, sin zoom de navegador accidental (web).

3. Regla de no ensamble de sheets.
- Esperado: al abrir CountriesSheet se cierra SpotSheet activa.

## 3) Flows (gamificación V1)

1. Chip de flows sobre perfil.
- Esperado: visible, legible, ancho adaptativo al número.

2. Tap en chip de flows.
- Esperado: toast con guía clara: `Suma flows marcando spots como visitados desde el mapa o buscador.`

3. KPI flows en sheet.
- Esperado:
  - `visitados`: etiqueta `flows`.
  - `por visitar`: etiqueta `flows por obtener`.

## 4) Buscador y quick actions

1. Lista de resultados en `visitados`.
- Esperado: prioriza descripción corta; si falta, muestra CTA editable.

2. `Agregar imagen` desde card.
- Esperado: abre selector de archivos sin abrir SpotSheet por detrás.

3. `Agregar descripción corta` desde card.
- Esperado: abre editor estable (no se cierra solo) y persiste al guardar.

4. Web nesting.
- Esperado: consola sin error `button cannot be a descendant of button`.

## 5) Share card (web)

1. Generar share en `visitados` y `por visitar`.
- Esperado: imagen renderiza con fondo sólido por filtro, marca `flowya.app`, top 3 países.

2. Orden KPI en imagen.
- Esperado: `países -> spots -> flows`.

3. Fallback web.
- Esperado: si no hay share nativo, descarga local funciona.

## 6) Smoke cross-theme

1. Repetir casos críticos en `light` y `dark`.
- Esperado: contraste correcto y estilos de filtro coherentes.

---

## Criterio de pase

- 100% de casos críticos aprobados en `light/dark` y filtros (`Todos`, `Por visitar`, `Visitados`).
- Sin errores de consola bloqueantes.
- Si falla cualquier caso crítico: no cerrar `OL-P3-002.B`.
