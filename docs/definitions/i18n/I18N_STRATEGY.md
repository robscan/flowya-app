# Estrategia Multilenguaje (i18n) — v0.1

**Fecha:** 2026-02-07  
**Objetivo:** App multilenguaje intuitiva sin rehacer arquitectura.

---

## 1) Principio
- UI strings: i18n tradicional (ES/EN primero).
- Contenido del usuario (notas/diario): **se guarda en el idioma que lo escribió**.
- Contenido de lugares (Mapbox): pedirlo en el idioma del usuario cuando sea posible.

---

## 2) Decisiones de producto (MVP)
- `appLocale` = idioma del sistema, con override manual (futuro).
- Mapbox requests con `language` (si el SDK lo soporta) para:
  - place name
  - address formatting
- Guardar `language_hint` en el spot.

---

## 3) Traducción de contenido del usuario (futuro, opcional)
Modelo recomendado:
- `note_raw` (texto original)
- `note_translations` (jsonb) con llaves por idioma:
  - `{ "en": { "text": "...", "status": "generated|edited" } }`

Regla:
- Nunca sobrescribir el original.
- Mostrar siempre el original y opción de ver traducción.

---

## 4) Tags multilenguaje
- Guardar tags como:
  - `tag_id` (canónico) + `label` por idioma en catálogo.
- Si el usuario crea tag libre: guardarlo raw + sugerir mapping después.

