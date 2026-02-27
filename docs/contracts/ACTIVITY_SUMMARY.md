# ACTIVITY_SUMMARY — Contrato de resumen de actividad (Explore)

**Fecha:** 2026-02-26  
**Estado:** ACTIVE (Fase A implementada)

## Objetivo

Mostrar un resumen compacto y útil del progreso del usuario:
- **Países visitados**
- **Lugares visitados**
- **Pendientes**

Sin introducir ruido visual, sin degradar performance y sin métricas dudosas.

---

## 1) Principios

1. **Confiabilidad primero**: no mostrar cifras inferidas si no hay dato sólido.
2. **Cálculo barato**: actualización por eventos, no polling continuo.
3. **No competir con flujo principal**: UI compacta y secundaria al mapa/sheet.
4. **Cross-platform consistente**: misma semántica en web/mobile, adaptando layout.

---

## 2) Métricas canónicas (v1)

### 2.1 `visitedPlacesCount`
- Definición: número de spots con pin estado `visited` para el usuario actual.
- Fuente: `pins.status='visited'` + spot visible (no hidden).
- Precisión esperada: alta.

### 2.2 `pendingPlacesCount`
- Definición: número de spots con pin estado `to_visit` para el usuario actual.
- Fuente: `pins.status='to_visit'` + spot visible.
- Precisión esperada: alta.

### 2.3 `visitedCountriesCount`
- Definición: cantidad de países únicos con al menos un spot `visited` del usuario.
- Fuente preferida (orden):
  1. país normalizado persistido en spot (si existe en modelo futuro),
  2. snapshot de lugar enlazado (si existe campo canónico),
  3. fallback heurístico de address (solo si calidad >= umbral y cacheado).
- Regla: si no hay fuente confiable, no inventar; mostrar `—` o ocultar bloque según configuración UX.
- Precisión esperada: media en v1 (hasta cerrar modelo de país canónico).

---

## 3) Reglas de cálculo

- Universo de spots: solo `is_hidden=false` (o equivalente de visibilidad vigente).
- Un spot cuenta una sola vez por métrica.
- `visited` y `to_visit` son excluyentes por spot/usuario.
- Países: deduplicación por clave canónica ISO (si existe); si no, por nombre normalizado.

---

## 4) Estado y eventos

## 4.1 Estado mínimo

```ts
ActivitySummaryState = {
  visitedPlacesCount: number;
  pendingPlacesCount: number;
  visitedCountriesCount: number | null; // null = no dato confiable aún
  updatedAtMs: number;
  quality: {
    countries: "high" | "medium" | "low";
  };
}
```

### 4.2 Eventos que invalidan/actualizan

- `PIN_SET_TO_VISITED`
- `PIN_SET_TO_VISIT`
- `PIN_REMOVED` (si aplica)
- `SPOT_HIDDEN`
- `SPOT_RESTORED`
- `AUTH_SESSION_CHANGED`

Regla: recomputar incrementalmente cuando sea posible; fallback a recompute completo cuando el evento no permita delta seguro.

---

## 5) UX contract

### 5.1 Contenedor
- Tarjeta compacta (1 bloque, 3 métricas), estilo discreto.
- Ubicación recomendada: zona superior del sheet `medium` o sección inicial de Search expanded (sin bloquear mapa).

### 5.2 Copy
- `Países visitados`
- `Lugares visitados`
- `Pendientes`

### 5.3 Estados visuales
- `loading`: skeleton corto.
- `ready`: valores numéricos.
- `partial`: países `—` + tooltip/copy “Datos de país en progreso”.
- `error`: fallback silencioso (ocultar bloque, log interno).

---

## 6) Performance y guardrails

- No recalcular en cada render del mapa.
- Caching en memoria por sesión + invalidación por eventos.
- Evitar geocoding en caliente dentro de interacción de mapa.
- Si cálculo > presupuesto (p. ej. 50ms main thread), diferir al idle tick.

---

## 7) Seguridad y privacidad

- Métricas privadas por usuario autenticado.
- No exponer datos de otro usuario en vistas públicas.
- Si usuario no autenticado: ocultar resumen o mostrar CTA de login (decisión de producto).

---

## 8) Fases recomendadas

### Fase A (rápida, segura)
- Implementar `visitedPlacesCount` + `pendingPlacesCount`.
- `visitedCountriesCount` en `null` (no visible o `—`).

Estado 2026-02-27:
- Implementado en runtime Search web/native mediante `ActivitySummary`.
- Render condicionado a usuario autenticado.
- `visitedPlacesCount` y `pendingPlacesCount` derivados de estado de pins en memoria (sin polling).
- `visitedCountriesCount` con heurística inicial desde `spot.address` (último token) + guardrail de cobertura mínima.
- Si la cobertura de país en spots visitados es baja, se mantiene `—` (`null`).

### Fase B
- Incorporar `visitedCountriesCount` con fuente confiable y deduplicación canónica.

### Fase C
- Añadir micro-interacciones: tap en métrica para abrir vista filtrada correspondiente.

---

## 9) Open loops

- Definir fuente canónica de país en modelo de datos (evitar heurística frágil de address).
- Establecer contrato de calidad para `visitedCountriesCount` (high/medium/low) en analytics.
