# 142 — Search V2 cierre parcial filtros + pendiente fallback maki visual

Fecha: 2026-02-25
Owner: Codex + apple-1
Estado: Cierre parcial (funcional), pendiente visual

## Contexto

Sesión de hardening de Search V2 + mapa Explore después de estabilizar ranking landmark/geo con Mapbox Search Box `/forward`.

Objetivo de la sesión:
- endurecer reglas UX al buscar bajo filtros de usuario (`Por visitar`, `Visitados`),
- evitar cierres accidentales del overlay,
- mantener trazabilidad documental para retomar sin reconstruir contexto.

## Cambios aplicados

1. Search bajo filtros de usuario:
- En `Por visitar` y `Visitados` ya no se muestran recomendaciones externas.
- En `Por visitar` y `Visitados` ya no se muestra CTA `Crear spot aquí`.
- En no-resultados bajo esos filtros, se muestra mensaje centrado:
  - "No encontramos resultados en este filtro. Para ver recomendaciones del mundo, cambia a Todos."

2. Overlay web:
- Tap en fondo ya no cierra búsqueda; solo blur de input cuando aplica.

3. Filtro superior del mapa:
- Se probó `MapPinFilterInline`, pero por decisión de UX se volvió al dropdown `MapPinFilter`.

4. Iconografía maki:
- Se ajustó fallback para evitar warnings funcionales por `styleimagemissing`.
- Estado actual visual: fallback neutro se percibe como punto blanco homogéneo.

## Estado funcional al cierre

- Búsqueda landmark/geo operativa (incluyendo casos de monumentos).
- Regla de filtros de usuario aplicada de forma consistente en web/native.
- Sin errores de lint.

## Pendiente explícito (open loop)

Fallback visual de maki en mapa:
- mantener resiliencia ante sprites faltantes,
- reemplazar punto blanco homogéneo por set visual canónico y legible.

Referencias:
- `docs/ops/OPEN_LOOPS.md` (OL-P1-008)
- `lib/map-core/style-image-fallback.ts`
- `lib/map-core/spots-layer.ts`
