# SPOT_SHEET_CONTENT_RULES — Contrato

**Última actualización:** 2026-02-22
**Relación:** [EXPLORE_SHEET.md](EXPLORE_SHEET.md) (modo spot), MapScreenVNext, SpotSheet

> Reglas no negociables para la sheet de spots en Explore: sheet única cuando el spot existe; campos condicionales (mostrar si hay datos, ocultar si no).

---

## Regla A — Sheet única para spots existentes

Cuando el usuario toca un POI en el mapa:

1. Se busca si existe un spot cercano (distancia ≤ tolerancia, p. ej. SPOT_POI_MATCH_TOLERANCE_KM).
2. **Si existe spot cercano** → mostrar **SpotSheet** con ese spot.
3. **Si no existe** → mostrar **SpotSheet en modo POI** (mismo componente, misma animación y gestos; body: Por visitar / Compartir).

**Requisito crítico:** La búsqueda del match debe usar la lista completa de spots candidatos, no la lista filtrada/capada por `pinFilter` o `MAP_PIN_CAP`. Usar solo `displayedSpots` provoca falsos negativos: un spot existente puede quedar fuera (filtrado o fuera del cap) y mostrarse SpotSheet modo POI en lugar de SpotSheet modo spot.

**Implementación:** Usar `spotsForPoiMatch` (o equivalente) que incluya todos los spots que podrían coincidir con un POI — p. ej. `filteredSpots` sin cap, o `spots` — en `handleMapClick`.

---

## Regla B — Campos condicionales (mostrar u ocultar)

SpotSheet muestra cada campo opcional **solo cuando el spot tiene datos**; si está vacío, el bloque no se renderiza.

| Campo             | Condición para mostrar              | Comportamiento si vacío |
|-------------------|-------------------------------------|-------------------------|
| Imagen de portada | `cover_image_url` presente          | Oculta el bloque        |
| Descripción corta | `description_short` con texto       | Oculta el bloque        |
| Por qué importa   | `why ?? description_long` con texto | Oculta el bloque        |
| Dirección         | `address` con texto                 | Oculta el bloque        |

**No usar** texto placeholder ("Sin dirección guardada", "Sin descripción") cuando no hay datos; simplemente no renderizar el bloque.

---

## Guardrails

- Al modificar `handleMapClick` o la lógica de match POI-spot: verificar que se use la lista correcta (todos los spots candidatos).
- Al añadir o modificar campos opcionales en SpotSheet: aplicar patrón "mostrar si hay datos, ocultar si no".
