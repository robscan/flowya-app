# SCOPELOG — Flowya (Control mínimo)

## Rama Epic activa

- Nombre: feat/explore-overlay-shell
- JBTD Pack: Explore
- Milestone de merge: “Overlay shell estable + saveSpot + pickLocation + anti-empalmes”

## Micro-scopes dentro de la rama (lista viva)

- [ ] MS1 — Crear UI Shell state machine (overlayMode/focusMode/mapStyleMode)
- [ ] MS2 — Search overlay desacoplado (emite eventos, no navega)
- [ ] MS3 — SaveSpot overlay (nombre + chips + guardar)
- [ ] MS4 — PickLocation overlay (mapStyle edit + colapso lista)
- [ ] MS5 — Reglas anti-empalmes (safe bottom zone + keyboard)
- [ ] MS6 — Defaults contextuales (status + persistencia suave)

## Regla de merges

- Merge a main cuando:
  - (a) milestone completado, o
  - (b) micro-scope de alto riesgo necesita aislarse (UI Shell, input/keyboard, map gestures)

## Hotfix

- Si algo crítico se rompe en main:
  - crear hotfix/\*, merge a main, y cherry-pick a la epic si aplica.
