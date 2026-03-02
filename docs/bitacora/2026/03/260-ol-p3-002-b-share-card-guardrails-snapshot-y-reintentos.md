# 260 — OL-P3-002.B: Share card guardrails (snapshot fresco + reintentos estables)

Fecha: 2026-03-01
Tipo: hardening UX/runtime (share)

## Objetivo

Cerrar estabilidad del flujo de compartir en `CountriesSheet` para evitar:
- share sin mapa listo,
- bloqueos innecesarios de reintento,
- dobles disparos por eventos web.

## Cambios

### 1) Snapshot fresco obligatorio antes de compartir
Archivo: `components/explorar/MapScreenVNext.tsx`

- Se agrega firma de snapshot (`countriesSnapshotSignature`) basada en:
  - filtro activo (`saved|visited`),
  - buckets y conteos renderizados.
- Cuando `CountriesSheet` está abierta y cambia la firma/dataset, se invalida snapshot previo:
  - `setCountriesMapSnapshot(null)`.
- Share queda deshabilitado hasta recibir snapshot nuevo:
  - `shareDisabled={isCountriesShareInFlight || !countriesMapSnapshot}`.
- Si usuario toca compartir sin snapshot listo:
  - toast: `Preparando imagen del mapa… intenta de nuevo en un momento.`

### 2) Reintentos de share sin cerrar sheet
Archivo: `components/explorar/MapScreenVNext.tsx`

- `countriesShareConsumedRef` ya no queda “pegado” tras primer intento.
- Se restablece al finalizar ciclo (`finally`) junto con `isCountriesShareInFlight`.
- Resultado: usuario puede reintentar share en la misma sesión de sheet.

### 3) Cooldown interno de helper ajustado
Archivo: `lib/share-countries-card.ts`

- Cooldown interno baja de 6000ms a 1200ms (`SHARE_COOLDOWN_MS`).
- Mantiene guardrail anti-doble-trigger, pero evita falsos bloqueos largos de reintento.

## Resultado esperado

- Share card usa mapa actualizado del estado visible (filtro/conteos actuales).
- Botón share se habilita solo cuando hay snapshot listo.
- Reintentos funcionan sin cerrar/reabrir CountriesSheet.

## Sanidad

- `npm run lint -- --no-cache` OK.
