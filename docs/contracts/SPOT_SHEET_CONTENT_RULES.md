# SPOT_SHEET_CONTENT_RULES — Contrato

**Última actualización:** 2026-03-16  
**Relación:** [EXPLORE_SHEET.md](EXPLORE_SHEET.md), `components/explorar/SpotSheet.tsx`, `components/explorar/MapScreenVNext.tsx`, `components/design-system/image-fullscreen-modal.tsx`

> Reglas no negociables para la sheet de Explore: una sola superficie para spot/POI, contenido condicional, y comportamiento estable para imagen en pantalla completa.

---

## Regla A — Sheet única para spot y POI

Cuando el usuario toca un POI del mapa:

1. Se intenta match con spot existente cercano.
2. Si hay match, se renderiza `SpotSheet` con `spot` (modo spot).
3. Si no hay match, se renderiza `SpotSheet` con `poi` (modo POI), manteniendo el mismo contenedor, gestos y animaciones.

No se debe montar una sheet alternativa para POI. El modo cambia por props (`spot` vs `poi`) dentro del mismo componente.

---

## Regla B — Match POI→spot con universo correcto

La detección de match no puede depender de listas capadas por render o por filtro visual.

Regla obligatoria:

- Evaluar el match contra el conjunto completo de candidatos de spot (no solo contra `displayedSpots`).
- Evitar falsos negativos cuando el spot real quedó fuera por cap/filtro de UI.

Impacto de incumplimiento:

- Se abre modo POI aunque el spot exista.
- Se rompe continuidad de acciones de spot (editar, detalle, estado actual).

---

## Regla C — Campos condicionales en SpotSheet

SpotSheet solo muestra bloques si hay dato real:

| Campo | Condición para mostrar | Si está vacío |
|---|---|---|
| Imagen de portada | `cover_image_url` presente | Ocultar bloque |
| Descripción corta | `description_short` con texto | Ocultar bloque |
| Por qué importa | `why ?? description_long` con texto | Ocultar bloque |
| Dirección | `address` con texto | Ocultar bloque |

No usar placeholders como "Sin dirección" o "Sin descripción". Si no hay dato, no se renderiza sección.

---

## Regla D — Lightbox de imagen (portada)

Contrato actual:

- La imagen de portada en `SpotSheet` es interactiva solo si existe `cover_image_url` y se recibe `onImagePress`.
- El parent (`MapScreenVNext`) abre `ImageFullscreenModal` con una sola `uri`.
- Cierre del modal permitido por:
  - tap en fondo,
  - tap en imagen,
  - botón `Cerrar`.

Constraint vigente:

- Lightbox simple de **una imagen** (sin carrusel ni índice).

---

## Regla E — CTAs en modo POI por filtro activo

En modo POI, los CTAs visibles dependen de `pinFilter`:

| `pinFilter` | CTA visible |
|---|---|
| `all` | `Por visitar` y `Visitado` |
| `saved` | Solo `Por visitar` |
| `visited` | Solo `Visitado` |

Mientras se está guardando (`poiLoading`), se reemplaza la fila de acciones por estado de carga.

Además, si el usuario expande la sheet estando en modo POI, el flujo puede auto-crear spot con estado derivado del filtro (`saved`→`to_visit`, `visited`→`visited`).

---

## Troubleshooting rápido

- Tap en portada no abre pantalla completa:
  - verificar `selectedSpot.cover_image_url` no nulo,
  - verificar que `SpotSheet` reciba `onImagePress` desde `MapScreenVNext`.
- El modal abre pero no se cierra:
  - revisar que `onClose` resetee `fullscreenImageUri` a `null`.
- En modo POI falta un botón:
  - validar `pinFilter` activo; en `saved`/`visited` se muestra solo una acción por contrato.
- QA reporta "sheet equivocada" al tocar POI:
  - revisar que el match use el universo completo de spots y no una lista capada.

---

## Guardrails de mantenimiento

- No duplicar componentes de sheet para POI vs spot.
- Cualquier cambio en CTAs de modo POI debe mantener matriz por filtro o actualizar este contrato en el mismo PR.
- Si se evoluciona a galería multi-imagen, actualizar esta página y el contrato de `ImageFullscreenModal` en conjunto.
