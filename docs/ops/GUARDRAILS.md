# GUARDRAILS — Alcances y consistencia (Explore vs Flow vs Recordar)

Este documento protege el desarrollo: evita contradicciones y “scope creep” mientras mantenemos UX de vanguardia.

---

## 1) Principio: Explore es map‑first (hoy)

En Explore:
- El mapa es el **contexto permanente**.
- Las herramientas viven como overlays flotantes (panel/card).
- Guardar un spot es **captura mínima** (título + ubicación + estado).

Explore NO debe depender de:
- Login obligatorio
- Flows (rutas/tours IA)
- Diario pesado (Recordar)

---

## 2) Qué está permitido en Explore (sí)

✅ Search (V2) + PlacePreview + CreateSpot (lite)  
✅ Chips Por visitar / Visitado (default contextual)  
✅ “Añadir nota” opcional, sin forzar  
✅ Map style switch: exploreGray vs editColor **solo en modo edición/confirmación**  
✅ Activity logging mínimo (C3) para habilitar futuro

---

## 3) Qué NO se mete en Explore (no) — se vuelve OPEN LOOP o nuevo scope

❌ Crear Flow completo (orden, itinerario, IA, etc.)  
❌ Sección Recordar completa (álbum, feed, timeline)  
❌ Sistema de reseñas públicas / “la gente opina” de terceros  
❌ Perfil avanzado (preferencias complejas)  
❌ Reglas de recomendación intrusivas

Si aparece, se registra en `docs/ops/OPEN_LOOPS.md` como:
- Idea / Futuro
- Dependencias
- Criterio de apertura (cuando aplicar)

---

## 4) Señales para abrir Flow (macro‑alcance)

Abrimos Flow cuando:
- Explore está estable y rápido (sin deuda en overlays/teclado)
- Ya podemos agrupar spots por ciudad (place_snapshot + city)
- C3 registra señales mínimas (search/save/visited)
- Existe una propuesta clara de “Flow Draft” (contenedor, no tour IA completo)

---

## 5) Señales para abrir Recordar (macro‑alcance)

Abrimos Recordar cuando:
- Crear/Marcar Visitado es sólido y agradable
- Notas/fotos ya existen y se guardan sin fricción
- Podemos inferir “trip window” mínimo (visited_at + city clustering)
- Hay una salida WOW mínima (mapa recuerdo o álbum básico)

---

## 6) Reglas de consistencia de UX (Apple Maps vibe)

- Un solo overlay activo a la vez (no apilar sheets).
- “Seleccionar resultado” colapsa lista y devuelve foco al mapa.
- Acciones primarias: pocas, claras. Resto en menú (⋯).
- Nada reprende. Todo recompensa: micro‑feedback (“Guardado”, “+1 visitado”).
