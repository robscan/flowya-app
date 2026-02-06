# Bitácora 015 — Scope E: Compartir spot mediante link público

## Objetivo

Permitir compartir un spot mediante un link público `/spot/:id` que abre el SpotDetail correspondiente. Sin sesión, sin pins ni estado en la URL. Web Share API si está disponible; si no, copiar link al clipboard con feedback mínimo ("Link copiado").

## Archivos tocados

### Nuevos

- **lib/share-spot.ts** — `getSpotShareUrl(spotId)` (URL absoluta en web), `shareSpot(spotId, title?)`: intenta `navigator.share()`; si no está disponible o falla, copia la URL al clipboard. Devuelve `{ copied: boolean }` para mostrar toast cuando se copió.

### Modificados

- **app/(tabs)/index.web.tsx** — `handleShare(spot)`: llama a `shareSpot(spot.id, spot.title)`; si `result.copied` muestra toast "Link copiado". SpotCard recibe `onShare={() => handleShare(selectedSpot)}`.
- **app/spot/[id].web.tsx** — `handleShare`: llama a `shareSpot(spot.id, spot.title)`; si `result.copied` muestra toast "Link copiado". SpotDetail recibe `onShare={handleShare}`.
- **app/design-system.web.tsx** — Subsección "Botón compartir (Scope E)": documentación del comportamiento (Web Share / copy) y feedback (toast "Link copiado").

## Decisiones

- **Link**: `/spot/:id` sin parámetros. URL absoluta al compartir: `window.location.origin + '/spot/' + spotId` (solo en web).
- **Web Share**: Si `navigator.share` existe y `navigator.canShare?.(...) ?? true`, se usa; si el usuario cancela o falla, fallback a copiar al clipboard.
- **Feedback**: Solo cuando se copia al clipboard se muestra toast "Link copiado". No modales invasivos.
- **SpotDetail**: Ya es accesible sin sesión (ruta pública). No se comparten pins ni estado (to_visit/visited); el link solo abre el detalle del spot (imagen, título, descripción, ubicación).

## Restricciones respetadas

- NO compartir pins ni estado.
- NO parámetros en la URL.
- NO analytics.
- NO OG previews avanzados.

## Pendientes (fuera de scope)

- OG meta tags básicos para preview en redes (opcional, scope futuro).
- Deep linking en native (Expo Linking) si se usa share en app nativa.

## Criterio de cierre

- Un spot se puede compartir desde el mapa (SpotCard) y desde el detalle (SpotDetail).
- El link abre el SpotDetail del spot (imagen, título, descripción, ubicación) sin requerir sesión.
- Si está disponible Web Share API se usa; si no, se copia el link y se muestra "Link copiado".
- Consola limpia; no se muestran errores técnicos al usuario.
