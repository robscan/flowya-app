# 291 — Explore: slogan de entrada con fade bajo filtros

Fecha: 2026-03-06
Tipo: Fix UX/branding transversal (sin loop nuevo)

## Contexto
Se solicitó mostrar el slogan de Flowya al entrar a la app (pantalla Explore) con una animación suave y temporal. Además, debía evitarse el traslape con el filtro superior y mantener coherencia visual con la marca.

## Cambios aplicados
- Se añadió overlay de slogan no bloqueante en Explore.
- Secuencia de animación implementada:
  - fade in
  - permanencia breve
  - fade out lento
- Texto final aplicado: `SIGUE LO QUE TE MUEVE...`
- Posicionamiento ajustado debajo del filtro superior para usar el hueco disponible y evitar solapamiento.
- Tipografía alineada visualmente con `FLOWYA` (mismo estilo base de heading).

## Evidencia (archivo)
- `components/explorar/MapScreenVNext.tsx`

## Validación mínima
- `npm run lint -- --no-cache components/explorar/MapScreenVNext.tsx`
- Resultado: OK

## Rollback
Revertir los cambios del slogan en `components/explorar/MapScreenVNext.tsx` para volver al comportamiento anterior sin mensaje de entrada.
