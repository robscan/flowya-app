# Bitácora 055 (2026/02) — OL-028: No reload + no camera jump (Create Spot)

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo (intento):** (1) Navegación long-press → create-spot sin full reload (SPA). (2) En create-spot sin params de mapa, cero camera jump.

---

## 1) Causa (pruebas reales)

- **V3:** Long-press → confirm → create-spot provocaba full reload (no SPA). Se usaba `router.push(\`/create-spot?${query}\`)` (string).
- **V2:** Abrir /create-spot sin params hacía que el mapa “recentrara” ligeramente (tryCenterOnUser en onMapLoad).

## 2) Fix intentado

- MapScreenVNext: `router.push({ pathname: '/create-spot', params })`.
- MapLocationPicker: sin preserveView ni initialCoords no llamar tryCenterOnUser.

## 3) Resultado

- Pruebas V1/V2/V3 siguieron fallando. **Intento revertido.** OL-028 marcado **DEFERRED**: no prioritario; en el futuro la creación será inline sheet y control por capas, sin depender de esta ruta.
