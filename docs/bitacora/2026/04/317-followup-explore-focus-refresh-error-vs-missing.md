# 317 — Follow-up Explore: focus refresh distingue error vs missing

Fecha: 2026-04-05
Tipo: Fix runtime (reconciliación segura en refresh por foco)

## Contexto
En el flujo de refresh por foco de Explore, `mergeSpotFromDbById` devolvía `missing` tanto para casos reales de fila ausente como para errores de consulta. Eso podía activar reconciliación completa en escenarios de error transitorio.

## Cambios aplicados
- `mergeSpotFromDbById` ahora devuelve `merged | missing | error | skipped`.
- Cuando la consulta de Supabase falla, retorna `error` (ya no `missing`).
- En `useFocusEffect`, el refetch completo se ejecuta solo cuando el resultado es `missing`.
- Si el resultado es `error`, se evita reconciliación completa para no tratar un fallo transitorio como eliminación confirmada.

## Evidencia (archivos)
- `components/explorar/MapScreenVNext.tsx`

## Validación mínima
- `npm run -s lint -- --no-cache` (ok, solo warnings)
- `npx tsc --noEmit` (falla por errores de tipado preexistentes fuera de este cambio)

## Resultado
Se reduce el riesgo de reconciliación incorrecta ante errores transitorios en la consulta puntual de spot durante el refresh rápido por foco.
