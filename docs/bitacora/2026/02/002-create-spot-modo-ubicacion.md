# Bitácora 002 (2026/02) — Create Spot: modo y selección de ubicación

**Scope:** scope/create-spot-location-v1  
**Rama:** scope/create-spot-location-v1  
**Tipo:** Entrada a Create Spot, ubicación inicial y header (sin guardado ni cambios de datos).

---

## Objetivo del scope

Definir y aplicar un único modo de entrada a Create Spot y las reglas de ubicación inicial:

- Entrada al flujo Create Spot solo por long-press en el mapa o desde Search (sin FAB Create Spot en el mapa).
- Ubicación inicial: punto del long-press cuando se entra desde el mapa; ubicación del usuario cuando se entra desde Search.
- Paso 1 (selección de ubicación): solo botón X para cerrar; flecha “atrás” solo a partir del paso 2.

---

## Reglas de entrada a Create Spot

### Desde el mapa

- **Única acción:** long-press (mantener dedo/ratón ~500 ms) sobre el mapa.
- Al detectar long-press: se cierra SpotCard (`setSelectedSpot(null)`), se cierra Search (`setSearchActive(false)`), y se navega a `/create-spot?lat=…&lng=…` con el punto bajo el cursor/dedo.
- Un tap corto no abre Create Spot; el timer se cancela en `onMouseUp`, `onTouchEnd` y `onMouseLeave`.

### Desde Search

- Los botones “Crear nuevo spot” (al final de resultados y en “¿No encontraste…?”) llaman a `handleCreateSpotFromSearch`.
- Este handler: cierra Search (`setSearchActive(false)`), cierra SpotCard (`setSelectedSpot(null)`), y navega a `/create-spot?from=search` (sin `lat`/`lng`).

### Modo exclusivo

- Create Spot es la pantalla `/create-spot`; no coexisten Search activo + Create Spot ni SpotCard visible + Create Spot, porque al entrar se limpian ambos y la vista cambia.

---

## Reglas de ubicación inicial

- **Entrada desde mapa (long-press):** la pantalla Create Spot lee `lat` y `lng` de la query; si ambos existen y son números válidos, se pasan a `MapLocationPicker` como `initialLatitude` e `initialLongitude`. El pin y la vista inicial del mapa coinciden con el punto del long-press.
- **Entrada desde Search (`from=search`):** no se pasan coords iniciales; `MapLocationPicker` usa su lógica por defecto (centrar en ubicación del usuario y colocar el pin ahí).

---

## Decisiones tomadas

- **Ocultar FAB Create Spot:** se eliminó por completo el segundo botón del FAB (MapPinPlus) en el mapa; el FAB queda solo con Search/X.
- **Long-press como única entrada desde mapa:** evita confusión con tap para seleccionar pin y deja claro que “crear aquí” es una acción deliberada.
- **Header paso 1:** solo botón X (cerrar); la flecha “atrás” aparece a partir del paso 2 para no ofrecer “volver” cuando no hay paso anterior en el flujo.
- **Sin estado global “createSpotActive”:** el modo Create Spot se identifica por la ruta `/create-spot`; no se añadió estado extra en el mapa.

---

## Riesgos conocidos

- Usuarios que no descubran el long-press pueden no encontrar cómo crear desde el mapa; la entrada desde Search sigue disponible y explícita (“Crear nuevo spot”).

---

## Regla de rollback

Revertir la rama `scope/create-spot-location-v1` (o no mergear) restaura: FAB con botón Create Spot en el mapa, entrada por tap/botón a Create Spot sin long-press, y navegación a `/create-spot` sin parámetros de ubicación. No hay cambios de modelo de datos ni de guardado; el rollback es seguro y local a la entrada al flujo y al header de Create Spot.

---

## Ajuste: continuidad de vista del mapa

**Problema detectado:** Al entrar a Create Spot desde long-press, el paso 1 recalculaba la vista del mapa (centro en el punto del long-press y zoom 14), generando un salto visual y rompiendo la continuidad: el usuario percibía que la vista “cambió” aunque el pin estuviera en el lugar correcto.

**Ajuste aplicado:** Se pasa la vista actual del mapa en el momento del long-press mediante query params (`mapLng`, `mapLat`, `mapZoom`, y opcionalmente `mapBearing`, `mapPitch`). Create Spot lee esos params y los entrega a `MapLocationPicker` cuando la entrada es desde mapa con vista preservada. En `MapLocationPicker` se añadieron props opcionales de vista inicial; cuando están presentes y válidas, se usan como `initialViewState` del mapa y **no** se ejecuta `flyTo` ni centrado en `onMapLoad`. El pin sigue en `initialLatitude`/`initialLongitude`. Entrada desde Search no se modifica (sin params de vista; el picker sigue usando `tryCenterOnUser`).

**Confirmación:** Las reglas del scope create-spot-location-v1 no se alteran: entrada por long-press o desde Search, headers, ubicación inicial (long-press = punto; Search = usuario). Solo se preserva la vista cuando la entrada es desde mapa (long-press), sin cambiar ningún otro flujo.

**Gobierno:** Cambio mínimo y reversible (SCOPE_0). Quitar los params de vista y la rama “vista preservada” en el picker restaura el comportamiento anterior. Consola limpia; sin dependencias nuevas.

---

## Cierre del scope

**Estado:** Cerrado. El scope create-spot-location-v1 (incluido el ajuste incremental de continuidad de mapa) está completo y funcional. No se abren nuevos scopes ni refactors adicionales con este cierre.
