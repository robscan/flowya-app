# Bitácora 003 (2026/02) — Fix animación flyTo ubicación actual

**Scope:** scope/map-flyto-duration-fix-v1  
**Rama:** scope/map-flyto-duration-fix-v1  
**Tipo:** Correctivo incremental (animación de reencuadre).

---

## Objetivo del scope

Restaurar animación perceptible y consistente en el control "Mostrar ubicación actual" del mapa principal, corrigiendo el uso incorrecto de la unidad de duración en `flyTo` y alineando el zoom con el resto de flujos.

**Referencia explícita:** Análisis [docs/analysis/2026/02/003-analisis-animacion-mapa-flyto.md](docs/analysis/2026/02/003-analisis-animacion-mapa-flyto.md): el problema es que `flyTo` usaba `duration: 1.5`, interpretado por Mapbox como 1.5 ms, provocando un salto instantáneo sin animación.

---

## Cambio aplicado

- **Mapa principal** ([app/(tabs)/index.web.tsx](app/(tabs)/index.web.tsx), `handleLocate`):  
  - `duration: 1.5` → `duration: 1500` (milisegundos).  
  - `zoom: 14` → `zoom: 15` (ligeramente más cercano).  
  Aplicado en ambas ramas (éxito de geolocalización y fallback con `userCoords`).

- **Spot Detail** ([app/spot/[id].web.tsx](app/spot/[id].web.tsx), `handleLocate`):  
  - `duration` ya era 1500; solo se alineó `zoom: 14` → `zoom: 15` para coherencia con el mapa principal.

No se modificó orden de llamadas, lógica de permisos, estado global ni `fitBounds` de "Ver todos". Sin nuevos handlers, animaciones custom ni wrappers.

---

## Riesgo

Mínimo. Reversible. Sin cambios de datos ni de flujos de negocio.

---

## Regla de rollback

Revertir la rama `scope/map-flyto-duration-fix-v1` restaura el comportamiento previo (salto instantáneo en "Mostrar ubicación actual" y zoom 14). No hay impacto en datos ni en el resto de la UI.
