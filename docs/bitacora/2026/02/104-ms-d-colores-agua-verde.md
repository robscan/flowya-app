# Bitácora 104 (2026/02) — MS-D: Colores agua y zonas verdes

**Fecha:** 2026-02-14

**Objetivo:** Agua y zonas verdes más visibles en el mapa para mejor orientación.

---

## Cambios realizados (revisión final)

**Enfoque:** Estilo FLOWYA creado en Mapbox Studio, cargado por URL. Sin modificación en runtime.

### Archivos

- **`lib/map-core/constants.ts`**
  - `FLOWYA_MAP_STYLE_LIGHT` = `mapbox://styles/robscan/cmlyeznh2000q01s35k8s2pv1` (lightPreset: day)
  - `FLOWYA_MAP_STYLE_DARK` = `mapbox://styles/robscan/cmlyfk2g1000i01rzcgy0d8cl` (lightPreset: night)

- **`components/explorar/MapScreenVNext.tsx`**
  - `mapStyle` usa `FLOWYA_MAP_STYLE_LIGHT` en modo claro y `FLOWYA_MAP_STYLE_DARK` en oscuro.

Light y dark usan ahora FLOWYA day y FLOWYA night respectivamente.
