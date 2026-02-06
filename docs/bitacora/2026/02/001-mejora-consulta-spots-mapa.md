# Bitácora 001 (2026/02) — Mejora de experiencia de consulta de spots en mapa

**Scope:** scope/map-spot-consultation-v1  
**Rama:** scope/map-spot-consultation-v1  
**Tipo:** Comportamiento de consulta (sin features nuevas, sin cambios de datos).

---

## Objetivo del scope

Mejorar la experiencia de consulta de spots en el mapa asegurando:

- Exploración continua (el mapa nunca se bloquea)
- Estados claros, explícitos y predecibles
- Cierre consciente de estados (sin lógica implícita)
- Código limpio, sin legacy ni comportamientos muertos
- Consola limpia (sin warnings)

---

## Cambios de comportamiento realizados

### 1. SpotCardMapSelection

- **Ya no es modal:** se eliminó el backdrop a pantalla completa que bloqueaba el mapa y cerraba la card al tap fuera o al pan/zoom.
- **Cierre solo con botón X:** se añadió la prop `onClose` al componente; cuando está definida (solo en el mapa), se muestra un botón X flotante en el extremo derecho de la card. Guardar/compartir siguen a la izquierda.
- **Pointer events explícitos:** contenedor del overlay de la card: `pointerEvents="box-none"`; la card en sí: `pointerEvents="auto"` para que solo la card capture toques y el resto pase al mapa.
- **Selección de otro spot:** se mantiene el reemplazo directo (sin cerrar primero, sin animaciones).
- **Hit area del pin seleccionado:** se mantiene para navegar a Spot Detail al tocar el pin ya seleccionado.

### 2. Search (modo búsqueda)

- **Entrada:** solo mediante el botón Search (top-right). Al entrar, el ícono del FAB se reemplaza por X; la SpotCard se oculta (no se destruye el estado de `selectedSpot`).
- **Salida:** únicamente mediante el botón X del FAB. Se eliminó por completo el backdrop de “tap fuera cierra search” y cualquier lógica similar.
- **accessibilityLabel del FAB:** "Buscar" cuando no está en búsqueda; "Cerrar búsqueda" cuando está en búsqueda.
- **Al salir:** si el usuario no seleccionó un resultado, se vuelve al estado anterior y la SpotCard reaparece; si seleccionó un resultado, la card se reemplaza con el nuevo spot.
- **Search y SpotCard nunca visibles a la vez:** la card solo se renderiza cuando `selectedSpot && !searchActive`.

### 3. Controles de mapa

- **Visibles:** Ver todos los spots y Ubicación actual. "Ver todos" se desactiva solo cuando el filtro activo no arroja resultados.
- **Actualización explícita de ubicación:**
  - Se implementó `handleLocate` (pasado a `MapControls` como `onLocate`) que llama a `getCurrentPosition`; en éxito actualiza `userCoords` y hace `flyTo`; **si getCurrentPosition falla**, usa `userCoords` existentes para `flyTo` y no bloquea.
  - En **handleViewAll** se refresca la ubicación antes del encuadre; **si getCurrentPosition falla**, se usan `userCoords` existentes y no se bloquea el fitBounds.
- **Zoom In / Zoom Out eliminados:** Tras comprobar que el mapa es completamente navegable por gestos (pan, pinch, zoom) con la SpotCard visible y que la card no intercepta esos gestos, se eliminaron los botones Zoom In y Zoom Out de `MapControls`. El zoom queda solo por gestos (pinch).

### 4. Limpieza

- Eliminado el callback `handleCloseSearch` (no se usaba).
- Eliminados estilos `cardBackdrop` y `searchBackdrop`.
- Sin nuevos `console.log` ni warnings introducidos.

---

## Decisiones tomadas

- **Pointer events:** overlay con `box-none` y card con `auto` para que el mapa reciba gestos fuera de la card.
- **Fallback de geolocalización:** en onLocate y en handleViewAll, si `getCurrentPosition` falla se usan las coords existentes y se sigue con la acción (flyTo o fitBounds) sin bloquear.
- **Zoom:** tras comprobar en uso que el mapa es navegable por gestos con la card visible, se eliminaron los botones Zoom In y Zoom Out; el zoom se hace solo por pinch/gestos.

---

## Riesgos conocidos

- Ninguno relevante tras la eliminación de los botones de zoom (navegación por gestos comprobada).

---

## Regla de rollback

Revertir la rama `scope/map-spot-consultation-v1` (o no mergear) restaura el comportamiento anterior: backdrop en card y en search, cierre por tap fuera y por pan, FAB sin cambio de ícono X, ubicación sin refresco explícito en Ver todos / Ubicación actual, y botones Zoom In/Out de nuevo en los controles del mapa. No hay cambios de modelo de datos ni de Create Spot; el rollback es seguro y local al mapa y al componente SpotCard.
