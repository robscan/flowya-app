# Bitácora 124 — Fase B: resolver de linking con scoring

**Fecha:** 2026-02-25  
**Rama:** `codex/search-poi-linking-phase-b`  
**Relación:** PLAN_SPOT_LINKING_VISIBILITY_SAFE_ROLLOUT (Fase B)

---

## Objetivo

Pasar de scaffold a resolución real de enlace spot↔POI/Landmark, manteniendo rollout seguro detrás de flag y fallback no disruptivo.

---

## Cambios aplicados

### 1) Resolver real de enlace

Archivo:

- `lib/spot-linking/resolveSpotLink.ts`

Implementación:

- Busca candidatos con `searchPlaces` (proximidad + bbox local).
- Calcula score por:
  - similitud de nombre (normalizada)
  - distancia geográfica
- Clasifica salida:
  - `linked` (alta confianza)
  - `uncertain` (ambigua)
  - `unlinked` (sin confianza suficiente)
- Clasifica tipo enlazado `poi|landmark` por señales (`featureType`, `maki`, categorías, tokens).
- Mantiene fallback seguro `unlinked` ante errores.

Parámetros iniciales (v1-phase-b):

- radio operativo: 0.6 km
- cutoff duro: 0.8 km
- score weights: nombre 0.65 / distancia 0.35
- thresholds:
  - linked >= 0.78
  - uncertain >= 0.55

### 2) Enriquecimiento de resultados de lugares

Archivo:

- `lib/places/searchPlaces.ts`

Se agregan metadatos opcionales en `PlaceResult`:

- `maki`
- `featureType`
- `categories`

Uso principal:

- alimentar resolver de linking y futuras reglas de iconografía.

---

## Guardrails mantenidos

- `ff_link_on_edit_save` sigue siendo condición para persistir `link_*` desde Edit Spot web.
- No se activó `hide linked-unsaved`.
- No se activó aún iconografía `maki` en pin FLOWYA.

---

## Riesgos abiertos

- La calidad de `featureType/maki/categories` depende del proveedor geocoder y zona.
- Umbrales iniciales requieren calibración en QA real (zonas densas con nombres repetidos).
- `uncertain` no debe ocultar spot automáticamente (regla sigue vigente).

---

## Próximo paso

Fase C:

- calibración de thresholds con dataset real;
- activar métricas de calidad de enlace;
- preparar iconografía `maki` con fallback y validación visual.
