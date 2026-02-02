# Bitácora 032 — Edit Spot: editar ubicación

## Objetivo

Permitir editar la ubicación del spot desde Edit Spot sin romper el flujo actual. Cambios solo se persisten al guardar; al salir sin guardar se descartan.

## Cambios realizados

### 1. Mapa inline en Edit Spot

- **Pasivo:** Sin controles (ruta, encuadre, ubicación). Sin drag/zoom.
- **Vista preview:** Muestra ubicación actual del spot (o draft si hay uno).
- **Un solo botón:** "Editar ubicación" (icono MapPin + texto), estilo secundario.

### 2. Acción "Editar ubicación"

- Abre modal fullscreen con MapLocationPicker.
- Reutiliza el mismo componente que Create Spot.
- Header: título "Selecciona la ubicación del spot" + botón Cerrar (sin flecha atrás).
- Pin inicial en la ubicación actual del spot (o del draft).
- Controles de mapa y botón "Confirmar ubicación" igual que Create Spot.

### 3. Confirmar ubicación (draft temporal)

- Al confirmar: cierra modal, vuelve a Edit Spot.
- Actualiza mapa inline y pin con la nueva ubicación.
- Guarda en estado local (`locationDraft`) — no persiste en DB.

### 4. Guardado y descarte

- **Guardar:** Persiste título, descripciones y (si existe) nueva ubicación.
- **Salir sin guardar:** Al pulsar lápiz para salir de edición o navegar atrás, se descarta `locationDraft`.

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| app/spot/[id].web.tsx | EditSpotMapSlot, modal MapLocationPicker, locationDraft, handleSaveEdit extendido |
| components/design-system/map-location-picker.tsx | Props initialLatitude, initialLongitude para variante Edit Spot |
| bitacora/032_edit_spot_editar_ubicacion.md | Esta bitácora |

## Reglas técnicas

- No se modifica Spot Detail (modo lectura).
- No se modifica Create Spot.
- MapLocationPicker reutilizado con props opcionales.
- Spot Detail: mapa con controles. Edit Spot: mapa pasivo + botón "Editar ubicación".
