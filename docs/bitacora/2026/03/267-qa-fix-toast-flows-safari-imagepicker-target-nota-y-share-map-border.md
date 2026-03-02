# 267 — QA fix: toast flows, selector imagen Safari, target nota breve y borde mapa en share

Fecha: 2026-03-01  
Tipo: QA fixes + UX hardening  
Área: Search quick actions + MapScreen + Share card

## Ajustes aplicados

1. Toast de chip flows simplificado.
- Archivo: `components/explorar/MapScreenVNext.tsx`
- Nuevo copy: `Marca tus lugares visitados.`

2. `Agregar imagen` en Safari iPhone (web) desde resultados visitados.
- Archivo: `components/explorar/MapScreenVNext.tsx`
- Se agrega picker web nativo con `input[type=file]` para evitar bloqueo de apertura en Safari.
- Se mantiene `expo-image-picker` para plataformas no-web.
- Guardrail: auth solo bloquea cuando no hay usuario autenticado.

3. Área táctil de `Agregar descripción corta` ampliada.
- Archivo: `components/design-system/search-list-card.tsx`
- Se incrementa zona tap con `minHeight`, `padding` y margen negativo controlado para mejorar precisión táctil.

4. Render share: eliminar línea/marco sobre mapa.
- Archivo: `lib/share-countries-card.ts`
- Se remueve pasada de trazo/sombra en borde del mapa para respetar estilo sin marcos/lineas.

## Sanidad

- `npm run lint -- --no-cache` OK.
