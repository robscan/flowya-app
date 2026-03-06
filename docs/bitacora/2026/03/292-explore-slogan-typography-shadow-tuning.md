# 292 — Explore: ajuste final de tipografía/sombra del slogan de entrada

Fecha: 2026-03-06
Tipo: Ajuste visual menor (follow-up de bitácora 291)

## Contexto
Tras implementar el slogan de entrada en Explore, se realizaron ajustes finos de legibilidad sobre fondo de cielo oscuro y consistencia visual en mobile.

## Cambios aplicados
- Slogan mantiene texto: `SIGUE LO QUE TE MUEVE...`
- Color forzado a blanco para contraste consistente.
- Tipografía ajustada a:
  - `fontSize: 40`
  - `lineHeight: 44`
  - `fontWeight: 500`
- Sombra de texto migrada a propiedad unificada `textShadow`.

## Evidencia (archivo)
- `components/explorar/MapScreenVNext.tsx`

## Validación mínima
- Verificación visual en Explore (mobile/web) con fondo oscuro.

## Rollback
Revertir los valores de `styles.sloganText` en `components/explorar/MapScreenVNext.tsx` al estado previo.
