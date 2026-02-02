# Bitácora 033 — Version freeze v0 (baseline estable)

## Objetivo

Congelar la versión actual de FLOWYA como baseline estable antes de iniciar nuevas features (ej. Search). A partir de aquí, solo cambios incrementales planificados.

## Estado del producto (baseline congelada)

FLOWYA v0.33 es una app web-first (Expo + React Native Web + Mapbox) para descubrir lugares, guardar pins (por visitar / visitados) y compartir spots.

### Features incluidas

| Feature | Descripción |
|--------|-------------|
| **Mapa principal** | Mapbox GL, proyección globo, controles zoom, ubicación, "Ver todo" (encuadre usuario + spots según filtro) |
| **Pines** | Por visitar / Visitados / Seleccionado, iconografía custom, filtros con conteo |
| **Spots** | Crear, editar, eliminar; título, descripciones, imagen de portada, ubicación |
| **Spot Detail** | Hero, contenido, mapa con controles (Ver todos, Mi ubicación, Cómo llegar), distancia pasiva |
| **Edit Spot** | Mapa inline pasivo, botón "Editar ubicación" → fullscreen picker, draft local hasta Guardar |
| **Create Spot** | Wizard: ubicación → título → descripciones → imagen → revisión |
| **Auth** | Magic link (Scope I), modal canónico, perfil, logout con confirmación |
| **Compartir** | Link a spot, detección de duplicados |
| **FLOWYA Beta** | Label sin contenedor (watermark), modal de feedback → Supabase feedback |
| **Design System** | IconButton, ButtonPrimary/Secondary, estados pressed canónicos, touch-action web |

### Validaciones confirmadas

- [x] Mapa funciona en web y mobile web
- [x] Scroll en Spot Detail, Edit Spot, Create Spot
- [x] Botones de icono con estados pressed/selected consistentes
- [x] "Ver todo": incluye ubicación usuario + spots según filtro; icono FrameWithDot
- [x] Label FLOWYA: sin contenedor, z-index por encima del mapa y por debajo de overlays
- [x] Edit Spot: mapa inline sin controles de detail; flujo Editar ubicación → fullscreen → confirmar → volver; cambios solo al guardar

### Features fuera de alcance (futuro)

- **Search** — Búsqueda de spots / lugares
- Otras features no documentadas aquí

## Reglas de congelamiento

1. **No agregar nuevas funcionalidades.**
2. **No refactorizar lógica existente.**
3. **Solo ajustes mínimos** si hay errores críticos (crash, bloqueo, pérdida de datos).

## Limpieza aplicada

- Eliminado `console.log` temporal en dev (send-feedback)
- Listeners (auth, map, viewport) con cleanup correcto

## Marca de versión

- `app/_layout.tsx`: comentario `// FLOWYA v0.33 — Frozen baseline (pre-search)`
- `package.json`: campo `description`: `"FLOWYA v0.33 — Frozen baseline (pre-search)"`

## Criterio de cierre

- [x] Baseline documentada
- [x] Validaciones confirmadas
- [x] Console limpia
- [x] Marca de versión añadida
