# 293 — Explore: ajuste final de copy y tipografía del slogan

Fecha: 2026-03-06
Tipo: Ajuste visual/copy menor (follow-up de 291 y 292)

## Contexto
Se hicieron ajustes finales sobre el letrero de entrada en Explore para mejorar legibilidad y tono del mensaje.

## Cambios aplicados
- Copy en dos líneas:
  - `SIGUE LO QUE`
  - `TE MUEVE`
- Se eliminó el punto final.
- Tipografía final aplicada:
  - `fontSize: 32`
  - `lineHeight: 40`
  - `fontWeight: 700`

## Evidencia (archivo)
- `components/explorar/MapScreenVNext.tsx`

## Validación mínima
- Verificación visual en Explore (mobile/web).

## Rollback
- Revertir el bloque `styles.sloganText` y el string del slogan en `MapScreenVNext.tsx`.
