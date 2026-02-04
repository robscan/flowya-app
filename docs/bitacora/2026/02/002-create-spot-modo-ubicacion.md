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

- **Única acción:** long-press firme (mantener dedo/ratón **3 segundos**) sobre el mapa. Comportamiento alineado con Google Maps.
- Si hay **movimiento o arrastre** por encima de un umbral (~10 px) antes de que venza el tiempo, el long-press se **cancela** (timer y refs se limpian en `onMouseMove`/`onTouchMove`).
- Al detectar long-press: se cierra SpotCard y Search; se muestra un **modal de confirmación** (“¿Crear spot aquí?”) con opción “No volver a mostrar” (persistencia en `localStorage`). Si el usuario ya eligió no mostrar, se navega directamente a `/create-spot?lat=…&lng=…` con el punto y la vista actual.
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

**Estado:** Cerrado.

**Scopes cerrados en este release:** scope/map-spot-consultation-v1, scope/create-spot-location-v1.

**Confirmación:** Los ajustes post-auditoría (botón X en SpotCard, eliminación de Zoom In/Out, FAB Search X con fondo negro e icono rojo, long-press 3 s con cancelación por movimiento, modal de confirmación y “No volver a mostrar”) quedaron aplicados. El comportamiento en producción coincide con la documentación de las bitácoras 001 y 002. Release: **FLOWYA V26.02.002**.

---

## Auditoría post-suggested-scope

**Implementado (scope create-spot-location-v1):**

- FAB sin botón Create Spot en el mapa; solo Search/X.
- Entrada a Create Spot por long-press en el mapa (3 s, cancelación por movimiento) con modal de confirmación y opción “No volver a mostrar”; luego `lat`/`lng` y params de vista (`mapLng`, `mapLat`, `mapZoom`); cancelación del timer en `onMouseUp`/`onTouchEnd`/`onMouseLeave`.
- Entrada desde Search: `handleCreateSpotFromSearch` cierra SpotCard y Search y navega a `/create-spot?from=search`.
- Create Spot paso 1: header solo botón X; a partir del paso 2, flecha atrás.
- Continuidad de vista: MapLocationPicker recibe vista preservada y no ejecuta flyTo cuando hay params de vista.

**Implementado (scope map-spot-consultation-v1, mismo código):**

- Search: salida solo con botón X del FAB; no existe cierre por tap fuera (sin searchBackdrop).
- SpotCard solo visible cuando `selectedSpot && !searchActive`.

**No implementado o incoherente con bitácora (corregido en esta sesión):**

- **SpotCard:** La bitácora 001 declara botón X y prop `onClose`; el código pasaba `onClose` pero el componente no lo aceptaba ni mostraba el X. **Corregido:** añadida prop `onClose` y botón X flotante a la derecha.
- **MapControls:** La bitácora 001 declara Zoom In/Zoom Out eliminados; en código seguían presentes. **Corregido:** eliminados Plus/Minus; solo quedan Ver todos y Ubicación actual.

---

## Correcciones aplicadas (post-auditoría)

- **SpotCardMapSelection:** prop `onClose` añadida al tipo; cuando está definida se muestra un botón X circular a la derecha de la card (mismo tamaño que acciones). Cierre solo con ese botón (sin tap fuera).
- **MapControls:** eliminados botones Zoom In y Zoom Out; el zoom se hace solo por gestos (pinch). Controles visibles: Ver todos los spots, Ubicación actual.
- **FAB Search (botón X):** cuando el modo búsqueda está activo, el FAB muestra fondo negro e icono rojo (`stateError`) para “Cerrar búsqueda”; estado pressed con opacidad 0,85.

---

## Ajustes finales Create Spot

- **Long-press firme:** umbral de **3 segundos** (ajustado desde 4 s tras feedback; antes 500 ms). Cancelación si el puntero/dedo se mueve por encima de ~10 px (`onMouseMove`/`onTouchMove`).
- **Modal de confirmación:** nuevo modal (mismo diseño del DS: backdrop, sheet, título, botones) antes de entrar a Create Spot. Título “¿Crear spot aquí?”; mensaje explicativo; botones Cancelar y “Crear spot”. No se reutiliza `ConfirmModal` (componente nuevo `CreateSpotConfirmModal`).
- **Checkbox “No volver a mostrar”:** en el modal; si el usuario lo marca y confirma, se persiste en `localStorage` (`flowya_create_spot_skip_confirm` = `'true'`). En long-presses posteriores se navega directamente sin mostrar el modal.
- Sin cambios en backend, guardado, validaciones ni animaciones; consola limpia.
