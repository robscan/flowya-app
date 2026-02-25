# ANTI_DUPLICATE_SPOT_RULES — Contrato

**Última actualización:** 2026-02-22
**Relación:** [bitácora 016](../bitacora/2026/01/016-scope-g-duplicate-prevention.md), `lib/spot-duplicate-check.ts`

> Reglas no negociables para prevenir spots duplicados en todos los paths de creación.

---

## Regla de duplicado

Un spot se considera duplicado si:

- **Título normalizado** coincide: case-insensitive, trim, sin acentos, espacios internos colapsados (`normalizeSpotTitle`).
- **Distancia** entre coordenadas ≤ radio (default **150 m**).

Implementación: `lib/spot-duplicate-check.ts` — `checkDuplicateSpot(title, lat, lng, radiusMeters?)`.

---

## Obligación

Todo path de creación de spot **debe** llamar a `checkDuplicateSpot` **antes** del INSERT.

- Creación manual/draft libre: si `duplicate: true`, **bloquear inserción** y mostrar alerta/modal.
- Selección explícita de POI externo (search/preview): la validación corre como señal informativa, pero **no bloquea inserción**.

Motivo: en selección POI de planificación el usuario no percibe creación manual; bloquear rompe expectativa de flujo.

---

## Entry points obligatorios

| Entry point | Archivo | Handler |
|-------------|---------|---------|
| Wizard Create Spot | `app/create-spot/index.web.tsx` | Antes de INSERT |
| Crear desde POI (Por visitar) | `components/explorar/MapScreenVNext.tsx` | `handleCreateSpotFromPoi` (no bloqueante) |
| Crear desde POI (Compartir) | `components/explorar/MapScreenVNext.tsx` | `handleCreateSpotFromPoiAndShare` (no bloqueante) |
| Crear desde draft inline | `components/explorar/MapScreenVNext.tsx` | `handleCreateSpotFromDraft` |

Cualquier nuevo path de creación debe añadirse a esta lista y cumplir el contrato.

---

## UX en duplicado

- Mostrar alerta (Alert.alert o equivalente).
- Título: "Spot muy parecido".
- Mensaje: citar el nombre existente; ofrecer opciones.
- Botones: **Cancelar** (no crear), **Cambiar nombre** (volver a editar), **Mover ubicación** (ajustar coords).
- No insertar el spot.

Excepción:

- En selección POI externa explícita no se muestra modal de bloqueo; el flujo continúa y crea spot.

---

## Fail-open

Si `checkDuplicateSpot` falla (red, Supabase, timeout): permitir la creación. No bloquear el flujo por un error de validación.

---

## Guardrails

- Al añadir un nuevo entry point de creación: verificar que llama a `checkDuplicateSpot` antes del INSERT.
- Al modificar `lib/spot-duplicate-check.ts`: mantener fail-open y la firma de `checkDuplicateSpot`.
