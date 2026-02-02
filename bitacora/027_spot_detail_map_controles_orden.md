# Bitácora 027 — Ajuste orden de controles en Spot Detail Map

## Objetivo

Unificar y ordenar los controles del mapa en Spot Detail, alineados con el patrón del mapa principal y con un orden semántico claro.

## Ajuste de orden

- **Antes**: Mi ubicación → Cómo llegar → Reencuadrar (Frame).
- **Después**: Ver todos (FrameWithDot) → Mi ubicación → Cómo llegar.

## Racional UX del orden semántico

1. **Ver todos** (arriba): Acción de contexto global — encuadrar usuario + spot. Sirve como ancla de orientación.
2. **Mi ubicación**: Centrar en el usuario. Complementa al reencuadre con una acción puntual.
3. **Cómo llegar** (abajo): Salida a app externa. Cierra la secuencia de acciones en el mapa.

## Cambios técnicos

- Reorden de los tres `IconButton` en `SpotDetailMapSlot`.
- Sustitución de `Frame` (Lucide) por `FrameWithDot` (custom).
- Mismo tamaño, separación y alineación en columna vertical.

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| app/spot/[id].web.tsx | Orden de controles, Frame → FrameWithDot |
| bitacora/027_spot_detail_map_controles_orden.md | Esta bitácora |
