# 243 — Consolidación integral de ajustes Explore/Search/DS del día

Fecha: 2026-03-01  
Tipo: cierre documental integral (runtime + UX/UI + contratos)

## Objetivo

Dejar trazabilidad única de los ajustes aplicados hoy para evitar vacíos de documentación y consultas repetidas en handoff.

## Alcance consolidado

1. **Search en filtro `visitados` con card diferenciada por metadata**
2. **Acciones rápidas in-card** para completar contenido (imagen + descripción corta)
3. **Hardening teclado/foco** (owner único por contexto)
4. **Filtro dropdown** con gating por settle de cámara (retardo post-flyTo/fitBounds)
5. **Canonización DS** de colores/escala/layout en resultados y filtros

---

## 1) Search `visitados`: card con información distinta

### Regla funcional

En filtro `visited`, la card de resultado **no usa dirección** como fallback principal.

- Si existe `description_short`: se muestra como subtítulo.
- Si no existe `description_short`: se muestra CTA inline de completitud:
  - `Agregar una descripción corta.`

Además, si falta imagen (`cover_image_url`), la card muestra placeholder accionable:

- `Agregar imagen`

### Implementación

- `components/explorar/MapScreenVNext.tsx`
  - `subtitleOverride` para `visited`.
  - `quickActions` (`add_image`, `edit_description`) solo en `visited`.
- `components/design-system/search-result-card.tsx`
  - resolución de subtítulo con precedencia explícita de `subtitleOverride`.
- `components/design-system/search-list-card.tsx`
  - render in-card de placeholder de imagen y CTA de descripción.

Resultado UX: la lista de visitados prioriza contenido editorial del spot sobre dirección cruda.

---

## 2) Flujos de completitud in-card (sin salir de Search)

### Agregar imagen

- Trigger: placeholder en slot de media.
- Flujo: picker -> optimización -> upload -> persistencia DB -> patch local de resultado.

### Agregar descripción corta

- Trigger: CTA inline en slot de subtítulo.
- Flujo: modal quick edit -> guardar -> persistencia DB -> patch local.

### Continuidad

- Al regresar del flujo, la lista permanece en contexto de Search/filtro donde se detonó.

---

## 3) Hardening teclado/foco (resumen)

Se formalizó owner único de teclado:

- Paso 0 de Create Spot domina foco.
- Si abre Paso 0, Search/quick edit cierran y se ejecuta blur explícito.
- Quick edit se reubicó arriba (safe area) para reducir choque con teclado.

Referencia detallada: bitácora `240`.

---

## 4) Dropdown de filtros + retardo hasta settle de cámara

- Dropdown no se muestra durante:
  - Search abierto,
  - Paso 0 abierto,
  - transición de cámara.
- La aparición del filtro espera settle de viewport con fallback timeout.
- Primer reveal usa delay de entrada para transición visual más limpia.

Referencia detallada: bitácora `242`.

---

## 5) Canonización visual DS (resumen)

- Tokens de color canónicos de países/filtros centralizados en `constants/theme.ts`.
- `SearchListCard` consolidado con layout adaptativo (imagen al borde, texto flexible, acciones inline).
- Escala tipográfica compacta para listas densas.

Referencia detallada: bitácora `241`.

---

## Documentos canónicos actualizados

- `docs/contracts/SEARCH_V2.md`
- `docs/contracts/KEYBOARD_AND_TEXT_INPUTS.md`
- `docs/contracts/CREATE_SPOT_PASO_0.md`
- `docs/contracts/explore/FILTER_RUNTIME_RULES.md`
- `docs/contracts/explore/MAP_RUNTIME_RULES.md`
- `docs/contracts/DESIGN_SYSTEM_USAGE.md`

## Estado final

- Ajustes funcionales y visuales del día documentados de forma exhaustiva.
- No quedan vacíos intencionales sobre:
  - card diferenciada de `visitados`,
  - acciones para agregar foto/descripcion corta desde resultados,
  - guardrails de teclado,
  - guardrails de dropdown/flyTo.
