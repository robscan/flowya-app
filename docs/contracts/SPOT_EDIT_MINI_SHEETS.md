# SPOT_EDIT_MINI_SHEETS — Contrato (edición por sección, estilo Apple Maps)

**Fuentes de verdad:** docs/ops/*, docs/contracts/*. Este contrato describe el **patrón acordado**; la implementación es posterior (OL-021).

---

## 1) Patrón

- **SpotSheet principal:** Muestra el spot en modo lectura (collapsed/medium/expanded según contrato ExploreSheet).
- **Edición por sección:** Cada sección editable tiene un control "Editar" que abre un **SubSheet** (mini-sheet modal) **de un solo nivel**.
- No multi-stack: solo 1 SubSheet abierto a la vez; cerrar/cancelar vuelve al SpotSheet principal.

---

## 2) MVP secciones editables

1. **Detalles** — Teléfono, web (y otros campos de contacto/detalle que se definan en datos).
2. **Categoría + etiquetas** — Categoría sugerida (p. ej. desde maki) y etiquetas libres o controladas (según modelo de datos).

_Nota: La lista exacta de campos por sección depende del modelo de datos actual; este contrato fija el patrón UI (SubSheet por sección), no el esquema final._

---

## 3) Guardrails

- **Keyboard-safe:** Con teclado abierto, el SubSheet se ajusta (safe-area + keyboard); contenido no tapado.
- **No overlays frágiles:** SubSheet se comporta como sheet/modal estable (sin doble scroll ni espacio blanco por drag).
- **No multi-stack:** Máximo 1 nivel de SubSheet; cancelar o guardar cierra el SubSheet y vuelve al sheet anterior (SpotSheet).
- **Cancelar:** Siempre vuelve al sheet anterior sin aplicar cambios de esa sección.

---

## 4) User-editables vs snapshot

- **User-editables:** Campos que el usuario puede modificar en la app (teléfono, web, categoría, etiquetas, etc.). Se persisten en `spots` o tablas relacionadas.
- **Snapshot:** Datos importados una vez (p. ej. dirección desde Mapbox en creación) que se guardan como texto/snapshot y no se re-sincronizan con fuentes externas. Pueden mostrarse como "solo lectura" o editables según decisión de producto (si se permite override, queda como user-editable).

_Implementación y modelo de datos concretos: ver OL-021 y decisiones de producto._
