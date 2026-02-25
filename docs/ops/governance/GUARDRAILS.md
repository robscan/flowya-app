# GUARDRAILS — Alcances y consistencia (Explorar vs Fluir vs Recordar)

Este documento protege el desarrollo: evita contradicciones y “scope creep” mientras mantenemos UX de vanguardia.

---

## 1) Principio: Explorar es map-first (hoy)

En Explorar:

- El mapa es el **contexto permanente**.
- Las herramientas viven como overlays flotantes (panel/card).
- Guardar un spot es **captura mínima** (título + ubicación + estado).

Explorar NO debe depender de:

- Login obligatorio
- Fluir (rutas/tours IA)
- Diario pesado (Recordar)

---

## 2) Qué está permitido en Explorar (sí)

✅ Search (V2) + PlacePreview + CreateSpot (lite)
✅ Chips Por visitar / Visitado (default contextual)
✅ “Añadir nota” opcional, sin forzar
✅ Map style switch: exploreGray vs editColor **solo en modo edición/confirmación**
✅ Activity logging mínimo (C3) para habilitar futuro

---

## 3) Qué NO se mete en Explorar (no) — se vuelve OPEN LOOP o nuevo scope

❌ Crear Fluir completo (orden, itinerario, IA, etc.)
❌ Sección Recordar completa (álbum, feed, timeline)
❌ Sistema de reseñas públicas / “la gente opina” de terceros
❌ Perfil avanzado (preferencias complejas)
❌ Reglas de recomendación intrusivas

Si aparece, se registra en `docs/ops/OPEN_LOOPS.md` como:

- Idea / Futuro
- Dependencias
- Criterio de apertura (cuando aplicar)

---

## 4) Señales para abrir Fluir (macro-alcance)

Abrimos Fluir cuando:

- Explorar está estable y rápido (sin deuda en overlays/teclado)
- Ya podemos agrupar spots por ciudad (place_snapshot + city)
- C3 registra señales mínimas (search/save/visited)
- Existe una propuesta clara de “Draft de Fluir” (contenedor, no tour IA completo)

---

### Fluir-lite (permitido ANTES de abrir Fluir)

Mientras Fluir esté “cerrado”, se permite SOLO **Fluir-lite** dentro de Explorar:

- Guardar una **lista simple** (ej. “Mi día”, “Barcelona 3 días”) como _draft local_ o metadata mínima (sin IA).
- Asociar spots existentes a esa lista (orden opcional), sin navegación nueva.
  ✅ Todo sucede como overlays map-first; sin pantallas tipo “Fluir app”.

### Gates (criterios) para “abrir Fluir” (testables)

Fluir se puede abrir cuando se cumpla TODO:

1. Explorar/Search/CreateSpot están estables (sin deuda de overlays/teclado; sin bugs P0/P1 abiertos).
2. Ya existe **place/city** confiable en spot (place_snapshot o city) para agrupar.
3. “Draft de Fluir” está definido como contenedor (no tour IA): contrato de datos y UX de creación/edición mínima.
4. Existe **WOW mínimo** comprobable (ej. export/share map o ruta simple) sin disparar complejidad.

### Prohibido antes de gates

- Tour IA completo / itinerarios automáticos
- Editor complejo tipo Notion
- Motor de recomendaciones “planner” multi-paso
- Entidad Fluir con múltiples pantallas (browse/gestión) fuera de Explorar

## 5) Señales para abrir Recordar (macro-alcance)

Abrimos Recordar cuando:

- Crear/Marcar Visitado es sólido y agradable
- Notas/fotos ya existen y se guardan sin fricción
- Podemos inferir “trip window” mínimo (visited_at + city clustering)
- Hay una salida WOW mínima (mapa recuerdo o álbum básico)

---

### Recordar-lite (permitido ANTES de abrir Recordar)

Mientras Recordar esté “cerrado”, se permite SOLO **Recordar-lite** como metadata dentro de Spot:

- `visited: boolean`
- `visited_at: timestamp` (opcional)
- `note_short: string` (opcional, máximo ~280 chars; sin editor pesado)

✅ Esto vive dentro de Explorar como acciones pequeñas (overlay existente), sin pantallas nuevas.

### Gates (criterios) para “abrir Recordar” (testables)

Recordar se puede abrir cuando se cumpla TODO:

1. Existe un contrato claro de datos para Recordar-lite (campos anteriores) y no cambia por 2 PRs seguidos.
2. UX: marcar visited / editar note_short no rompe map-first (sin overlays apilados, sin estados fantasma).
3. Persistencia: se guarda y se lee de vuelta en al menos 2 sesiones (reload) sin inconsistencias.
4. Costo: no introduce cargas pesadas por default (sin timeline/feed al abrir Explorar).

### Prohibido antes de gates

- Timeline/feed/álbum completo
- Editor largo (markdown/rich text)
- “Recuerdos” como entidad separada con browse/gestión
- Flujos de import/export o IA de diario

## 6) Reglas de consistencia de UX (Apple Maps vibe)

- Un solo overlay activo a la vez (no apilar sheets).
- “Seleccionar resultado” colapsa lista y devuelve foco al mapa.
- Acciones primarias: pocas, claras. Resto en menú (⋯).
- Nada reprende. Todo recompensa: micro-feedback (“Guardado”, “+1 visitado”).
