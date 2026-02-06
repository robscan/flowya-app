# Bitácora 035 — Version freeze v0.34 (post-search)

## Objetivo

Congelar la versión actual de FLOWYA como baseline estable tras la feature Search MVP. A partir de aquí, solo cambios incrementales planificados.

## Estado del producto (baseline congelada)

FLOWYA v0.34 es una app web-first (Expo + React Native Web + Mapbox) para descubrir lugares, guardar pins (por visitar / visitados), compartir spots y **buscar** spots en el mapa.

### Features incluidas

| Feature | Descripción |
|--------|-------------|
| **Mapa principal** | Mapbox GL, proyección globo, controles zoom, ubicación, "Ver todo" (encuadre usuario + spots según filtro) |
| **Búsqueda (Search MVP)** | Botón Buscar, modo búsqueda (overlay full height), input + listado; 10 spots más cercanos por defecto; búsqueda por título; SearchResultCard; exit sin perder texto; botón clear (X); tap en pin seleccionado → spot detail |
| **Pines** | Por visitar / Visitados / Seleccionado, iconografía custom, filtros con conteo |
| **Spots** | Crear, editar, eliminar; título, descripciones, imagen de portada, ubicación |
| **Spot Detail** | Hero, contenido, mapa con controles (Ver todos, Mi ubicación, Cómo llegar), distancia pasiva |
| **Edit Spot** | Mapa inline pasivo, botón "Editar ubicación" → fullscreen picker, draft local hasta Guardar |
| **Create Spot** | Wizard: ubicación → título → descripciones → imagen → revisión |
| **Auth** | Magic link (Scope I), modal canónico, perfil, logout con confirmación |
| **Compartir** | Link a spot, detección de duplicados |
| **FLOWYA Beta** | Label sin contenedor (watermark), modal de feedback → Supabase feedback |
| **Design System** | IconButton (selected), SpotCardMapSelection (hideActions, onCardPress), SearchResultCard, SearchResultsShowcase; estados pressed canónicos, touch-action web |

### Validaciones confirmadas (v0.33 + Search)

- [x] Mapa funciona en web y mobile web
- [x] Scroll en Spot Detail, Edit Spot, Create Spot, listado de búsqueda
- [x] Botones de icono con estados pressed/selected consistentes
- [x] "Ver todo": incluye ubicación usuario + spots según filtro; icono FrameWithDot
- [x] Label FLOWYA: sin contenedor, z-index por encima del mapa y por debajo de overlays
- [x] Edit Spot: mapa inline sin controles de detail; flujo Editar ubicación → fullscreen → confirmar → volver; cambios solo al guardar
- [x] Search: tap fuera cierra UI sin borrar texto; volver a Buscar muestra texto y resultados; botón X limpia input; selección de resultado centra pin y muestra SpotCardMapSelection; tap en pin ya seleccionado → spot detail (hit area)

## Reglas de congelamiento

1. **No agregar nuevas funcionalidades** salvo las planificadas en bitácoras posteriores.
2. **No refactorizar lógica existente.**
3. **Solo ajustes mínimos** si hay errores críticos (crash, bloqueo, pérdida de datos).

## Marca de versión

- `app/_layout.tsx`: comentario `// FLOWYA v0.34 — Frozen baseline (post-search)`
- `package.json`: campo `description`: `"FLOWYA v0.34 — Frozen baseline (post-search)"`, `version`: `"0.34.0"`

## Criterio de cierre

- [x] Baseline documentada
- [x] Search MVP incluido y documentado (bitácora 034)
- [x] Marca de versión v0.34 añadida
