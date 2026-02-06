# Bitácora 003 (2026/02) — Limpieza técnica y baseline estable

**Tipo:** Técnico / Preparación  
**Estado:** Cerrado  
**Archivo tocado:** `app/(tabs)/index.web.tsx`

---

## Objetivo

Restablecer un baseline técnico estable eliminando errores TypeScript y warnings ESLint sin modificar comportamiento funcional ni UX.

---

## Cambios realizados

- **Corrección de import incorrecto de Map** desde `react-map-gl/mapbox-legacy`: reemplazo de `import Map, { Marker }` por `import { Map, Marker }` (resolución de `import/no-named-as-default`).
- **Estabilización de dependencias en hooks:** `geoOptions` convertido en referencia estable con `useMemo<PositionOptions>(() => ({ enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }), [])` e incluido en las dependencias de `handleLocate` y `handleViewAll` (resolución de `react-hooks/exhaustive-deps`).
- **Eliminación de código muerto:** eliminación completa de la función `exitSearchMode` y su `useCallback` (resolución de `@typescript-eslint/no-unused-vars`).
- **Sin cambios de lógica, UI o comportamiento visible.**

---

## Estado técnico

- **npm run build:** ✅ OK  
- **TypeScript:** sin errores en archivos tocados  
- **ESLint:** sin warnings relacionados con este scope en `app/(tabs)/index.web.tsx`  
- **Consola:** limpia (sin logs nuevos)

---

## Alcance

Solo limpieza técnica. No se tocaron Search, MapControls, Create Spot ni flujos de usuario.

---

## Riesgos conocidos

Existen warnings TypeScript en otros archivos fuera de este scope (documentados previamente). No se abordaron por disciplina de alcance.

---

## Cierre del scope

- **Estado:** Cerrado  
- **Tipo:** Técnico / Preparación  
- **Impacto en producto:** Ninguno (baseline estable)

---

## Regla de rollback

Revertir el commit asociado a esta limpieza restaura el estado previo sin pérdida de datos ni cambios funcionales.

**Commit:** `chore: clean imports, hooks deps and unused code (baseline stabilization)`
