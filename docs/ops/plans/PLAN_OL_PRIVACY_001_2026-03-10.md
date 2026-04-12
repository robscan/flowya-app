# PLAN — OL-PRIVACY-001: Política de privacidad y consentimiento

**Fecha:** 2026-03-10 — **Cierre MVP:** 2026-04-12  
**Estado:** **Cerrado (MVP)** — política pública + enlaces en flujo de acceso  
**Origen:** Revisión seguridad PR #97; necesidad de disclaimers explícitos  
**Evidencia:** bitácora [`350`](../bitacora/2026/04/350-ol-privacy-001-politica-y-ruta-privacidad.md)

---

## Objetivo

Crear política de privacidad con los disclaimers necesarios para cumplir buenas prácticas y expectativas regulatorias.

## Disclaimers a incluir

### Geolocalización (prioridad)

- Uso: solo en cliente para UX (distancias, centrado en mapa).
- No se persiste, no se envía a backend, analytics ni logs.
- Solicitud on-demand: permiso solo cuando usuario pulsa "Mi ubicación".
- Si permiso ya concedido: obtención silenciosa al cargar (sin prompt).

### Otros (por definir en ejecución)

- Cookies y almacenamiento local.
- Datos de sesión / auth.
- Analytics si aplica.
- Datos enviados a Mapbox/Supabase (scopes necesarios).

## Dependencias

- Auth foundation (sesión, identidad).
- Revisión de instrumentación/telemetría para validar que `userCoords` no se serializa.

## Entregables

- Documento de política de privacidad (público, legible).
- Integración en flujo de consentimiento si aplica (ej. primer uso, registro).

## Referencias

- Bitácora 286: geolocalización on-demand
- Bitácora 306: feedback UX + revisión seguridad PR #97
